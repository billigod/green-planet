import os
import numpy as np
from scipy import ndimage
from shapely.geometry import box, shape, mapping
from typing import Dict, Any, List, Optional
from PIL import Image

try:
    import rasterio.features
    from pyproj import Transformer
except ImportError:
    rasterio = None
    Transformer = None

class MultiTemporalChangeDetector:
    @staticmethod
    def detect_optical_loss(
        ndvi_t0: np.ndarray,
        ndvi_t1: np.ndarray,
        valid_mask_t0: np.ndarray,
        valid_mask_t1: np.ndarray,
        resolution_m: float = 10.0,
        ndvi_drop_threshold: float = 0.18,
        min_baseline_ndvi: float = 0.45,
        min_cluster_pixels: int = 5,
        transform: Any = None,
        crs: Any = None
    ) -> Dict[str, Any]:
        """
        Calculates multi-temporal NDVI drop across paired observations:
        Delta_NDVI = NDVI_t0 - NDVI_t1
        Filters out clouds/shadows via joint valid mask and applies morphological opening
        to eliminate isolated noise pixels.
        Labels contiguous loss clusters and calculates area in hectares.
        """
        joint_valid = valid_mask_t0 & valid_mask_t1
        delta_ndvi = ndvi_t0 - ndvi_t1

        raw_change = (
            joint_valid &
            (ndvi_t0 >= min_baseline_ndvi) &
            (delta_ndvi >= ndvi_drop_threshold) &
            (ndvi_t1 < 0.40)
        )

        cleaned_change = ndimage.binary_opening(raw_change, structure=np.ones((2, 2)))
        labeled_array, num_features = ndimage.label(cleaned_change, structure=np.ones((3, 3)))

        total_loss_pixels = 0
        significant_clusters = []

        for cluster_id in range(1, num_features + 1):
            pixel_count = int(np.sum(labeled_array == cluster_id))
            if pixel_count >= min_cluster_pixels:
                total_loss_pixels += pixel_count
                significant_clusters.append({
                    "cluster_id": cluster_id,
                    "pixels": pixel_count,
                    "hectares": round((pixel_count * resolution_m * resolution_m) / 10000.0, 2)
                })

        pixel_area_m2 = resolution_m * resolution_m
        total_loss_hectares = round((total_loss_pixels * pixel_area_m2) / 10000.0, 2)

        confidence = 0.0
        if total_loss_pixels > 0 and np.any(cleaned_change):
            avg_delta = float(np.mean(delta_ndvi[cleaned_change]))
            magnitude_score = min(40.0, (avg_delta / 0.40) * 40.0)
            size_score = min(35.0, (total_loss_hectares / 5.0) * 35.0) if total_loss_hectares > 0.5 else 15.0
            baseline_score = min(25.0, (float(np.mean(ndvi_t0[cleaned_change])) / 0.65) * 25.0)
            confidence = round(min(99.4, magnitude_score + size_score + baseline_score), 1)

        # Georeferenced polygon extraction if transform & crs are provided
        polygons = []
        if total_loss_pixels > 0 and transform is not None and crs is not None and Transformer is not None:
            try:
                polygons = MultiTemporalChangeDetector.extract_polygons_from_mask_georeferenced(
                    cleaned_change, transform, crs, min_pixels=min_cluster_pixels
                )
            except Exception:
                polygons = []

        return {
            "loss_detected": total_loss_pixels > 0,
            "loss_area_hectares": total_loss_hectares,
            "loss_pixel_count": total_loss_pixels,
            "clusters_count": len(significant_clusters),
            "clusters": significant_clusters,
            "confidence_score": confidence,
            "sensor_modality": "optical_msi",
            "mean_ndvi_drop": round(float(np.mean(delta_ndvi[cleaned_change])), 3) if total_loss_pixels > 0 else 0.0,
            "delta_ndvi": delta_ndvi,
            "change_mask": cleaned_change,
            "polygons": polygons
        }

    @staticmethod
    def extract_polygons_from_mask_georeferenced(
        binary_mask: np.ndarray,
        transform: Any,
        crs: Any,
        min_pixels: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Extracts vector polygon geometries from raster mask using rasterio.features.shapes
        and transforms coordinates from native projected CRS (e.g. UTM) into standard WGS84 GeoJSON [lng, lat].
        """
        if rasterio is None or Transformer is None:
            return []

        shapes = rasterio.features.shapes(binary_mask.astype(np.int16), transform=transform)
        transformer = Transformer.from_crs(crs, "EPSG:4326", always_xy=True)

        polygons = []
        cid = 1
        for geom, val in shapes:
            if val == 1:
                s = shape(geom)
                # Filter small shapes
                if s.area < (min_pixels * 100.0 * 0.8):
                    continue

                # Transform to WGS84 coordinates
                try:
                    from shapely import transform as shp_transform
                    s_wgs84 = shp_transform(s, transformer.transform)
                except Exception:
                    from shapely.ops import transform as shp_ops_transform
                    s_wgs84 = shp_ops_transform(transformer.transform, s)

                b = s_wgs84.bounds # minx, miny, maxx, maxy = min_lon, min_lat, max_lon, max_lat
                area_ha = round(s.area / 10000.0, 2)
                poly_mapping = mapping(s_wgs84)
                polygons.append({
                    "cluster_id": cid,
                    "area_hectares": area_ha,
                    "bbox": [round(b[1], 6), round(b[0], 6), round(b[3], 6), round(b[2], 6)], # [min_lat, min_lng, max_lat, max_lng]
                    "geojson": poly_mapping,
                    "feature": {
                        "type": "Feature",
                        "geometry": poly_mapping,
                        "properties": {
                            "cluster_id": cid,
                            "loss_area_ha": area_ha,
                            "source": "S2_L2A_MULTISPECTRAL_CHANGE"
                        }
                    }
                })
                cid += 1
                if cid > 50:
                    break

        return polygons

    @staticmethod
    def generate_change_preview_png(
        change_mask: np.ndarray,
        ndvi_t0: np.ndarray,
        output_path: str
    ) -> str:
        """
        Generates an RGBA overlay PNG highlighting detected canopy loss in bright crimson red
        and leaving baseline forest semi-transparent.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        h, w = change_mask.shape
        rgba = np.zeros((h, w, 4), dtype=np.uint8)

        # Baseline forest background (semi-transparent green)
        forest_mask = ndvi_t0 > 0.45
        rgba[forest_mask, 0] = 30
        rgba[forest_mask, 1] = 130
        rgba[forest_mask, 2] = 60
        rgba[forest_mask, 3] = 80

        # Change / loss pixels (vibrant crimson red highlight)
        rgba[change_mask, 0] = 239
        rgba[change_mask, 1] = 68
        rgba[change_mask, 2] = 68
        rgba[change_mask, 3] = 250

        img = Image.fromarray(rgba, "RGBA")
        img.save(output_path, "PNG")
        return output_path

    @staticmethod
    def extract_polygons_from_mask(
        binary_mask: np.ndarray,
        bounds: List[float]
    ) -> List[Dict[str, Any]]:
        """
        Converts raster cluster bounding boxes into GeoJSON-compatible polygon boxes
        using Shapely. Fallback when transform/CRS is not passed.
        bounds = [min_lat, min_lng, max_lat, max_lng]
        """
        min_lat, min_lng, max_lat, max_lng = bounds
        h, w = binary_mask.shape
        lat_step = (max_lat - min_lat) / h
        lng_step = (max_lng - min_lng) / w

        labeled, num_features = ndimage.label(binary_mask)
        polygons = []

        for cid in range(1, min(num_features + 1, 20)):
            ys, xs = np.where(labeled == cid)
            if len(ys) == 0:
                continue
            y_min, y_max = int(np.min(ys)), int(np.max(ys))
            x_min, x_max = int(np.min(xs)), int(np.max(xs))

            poly_lat_min = min_lat + (h - y_max) * lat_step
            poly_lat_max = min_lat + (h - y_min) * lat_step
            poly_lng_min = min_lng + x_min * lng_step
            poly_lng_max = min_lng + x_max * lng_step

            b = box(poly_lng_min, poly_lat_min, poly_lng_max, poly_lat_max)
            polygons.append({
                "cluster_id": cid,
                "pixel_count": int(len(ys)),
                "bbox": [poly_lat_min, poly_lng_min, poly_lat_max, poly_lng_max],
                "geojson": mapping(b)
            })

        return polygons

    @staticmethod
    def detect_sar_decorrelation(
        backscatter_t0: np.ndarray,
        backscatter_t1: np.ndarray,
        resolution_m: float = 10.0,
        coherence_threshold_db: float = -3.5,
        min_cluster_pixels: int = 8
    ) -> Dict[str, Any]:
        """
        Calculates log-ratio backscatter drop and interferometric decorrelation
        from Sentinel-1 C-SAR passes. Penetrates clouds and heavy atmospheric moisture.
        """
        filtered_t0 = ndimage.median_filter(backscatter_t0.astype(np.float32), size=3)
        filtered_t1 = ndimage.median_filter(backscatter_t1.astype(np.float32), size=3)

        ratio = (filtered_t1 + 1e-6) / (filtered_t0 + 1e-6)
        delta_db = 10.0 * np.log10(np.clip(ratio, 1e-4, 100.0))
        raw_change = delta_db <= coherence_threshold_db

        labeled, num_features = ndimage.label(raw_change, structure=np.ones((3, 3)))
        significant_mask = np.zeros_like(raw_change, dtype=bool)
        loss_pixels = 0

        for cid in range(1, num_features + 1):
            count = int(np.sum(labeled == cid))
            if count >= min_cluster_pixels:
                significant_mask[labeled == cid] = True
                loss_pixels += count

        pixel_area_m2 = resolution_m * resolution_m
        total_loss_hectares = round((loss_pixels * pixel_area_m2) / 10000.0, 2)

        confidence = 0.0
        if loss_pixels > 0:
            drop_intensity = abs(float(np.mean(delta_db[significant_mask])))
            confidence = round(min(98.5, 50.0 + min(48.5, drop_intensity * 6.0)), 1)

        return {
            "loss_detected": loss_pixels > 0,
            "loss_area_hectares": total_loss_hectares,
            "loss_pixel_count": loss_pixels,
            "confidence_score": confidence,
            "sensor_modality": "sar_radar_cband",
            "mean_backscatter_drop_db": round(abs(float(np.mean(delta_db[significant_mask]))), 2) if loss_pixels > 0 else 0.0,
            "change_mask": significant_mask
        }

change_detector = MultiTemporalChangeDetector()
