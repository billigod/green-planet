import os
import numpy as np
from typing import Dict, Any, Optional
from PIL import Image

try:
    import rasterio
    from rasterio.crs import CRS
except ImportError:
    rasterio = None
    CRS = None

class NDVICalculator:
    @staticmethod
    def calculate_ndvi(red_band: np.ndarray, nir_band: np.ndarray) -> np.ndarray:
        """
        Normalized Difference Vegetation Index:
        NDVI = (NIR - RED) / (NIR + RED)
        Values range between -1.0 (water/clouds) and +1.0 (dense closed canopy).
        """
        red = red_band.astype(np.float32)
        nir = nir_band.astype(np.float32)
        denom = nir + red
        
        # Zero out where denominator is 0 or negative
        valid_denom = denom > 1e-6
        ndvi = np.zeros_like(red, dtype=np.float32)
        ndvi[valid_denom] = (nir[valid_denom] - red[valid_denom]) / denom[valid_denom]
        return np.clip(ndvi, -1.0, 1.0)

    @staticmethod
    def save_geotiff(
        ndvi_arr: np.ndarray,
        transform: Any,
        crs: Any,
        output_path: str,
        nodata: float = -9999.0
    ) -> str:
        """
        Writes a georeferenced GeoTIFF of the NDVI raster.
        """
        if rasterio is None:
            raise RuntimeError("rasterio is required to export GeoTIFF rasters.")

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        h, w = ndvi_arr.shape

        # Clean CRS if passed as string or object
        raster_crs = crs
        if isinstance(crs, str):
            raster_crs = CRS.from_user_input(crs)

        with rasterio.open(
            output_path,
            "w",
            driver="GTiff",
            height=h,
            width=w,
            count=1,
            dtype="float32",
            crs=raster_crs,
            transform=transform,
            nodata=nodata,
            compress="deflate"
        ) as dst:
            dst.write(ndvi_arr.astype(np.float32), 1)

        return output_path

    @staticmethod
    def generate_ndvi_preview_png(
        ndvi_arr: np.ndarray,
        valid_mask: Optional[np.ndarray],
        output_path: str
    ) -> str:
        """
        Generates an 8-bit RGBA color-mapped preview PNG:
        - Dense Canopy (NDVI >= 0.6): Deep Forest Green [26, 152, 80]
        - Moderate Canopy (0.4 - 0.6): Olive Green [145, 207, 96]
        - Sparse / Shrub (0.25 - 0.4): Khaki/Yellow [254, 224, 139]
        - Soil / Clear-cut (0.0 - 0.25): Orange/Red [215, 48, 39]
        - Water / Cloud shadow (< 0.0): Dark Ochre / Navy [110, 60, 40]
        - Masked (clouds, invalid): Transparent [0, 0, 0, 0]
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        h, w = ndvi_arr.shape
        rgba = np.zeros((h, w, 4), dtype=np.uint8)

        active = valid_mask if valid_mask is not None else np.ones((h, w), dtype=bool)

        # Normalize NDVI from [0.0, 0.8] into [0.0, 1.0]
        norm = np.clip((ndvi_arr - 0.05) / 0.70, 0.0, 1.0)

        # Forest color ramp (Red to Green)
        r = (215 * (1.0 - norm) + 26 * norm).astype(np.uint8)
        g = (48 * (1.0 - norm) + 152 * norm).astype(np.uint8)
        b = (39 * (1.0 - norm) + 80 * norm).astype(np.uint8)

        rgba[active, 0] = r[active]
        rgba[active, 1] = g[active]
        rgba[active, 2] = b[active]
        rgba[active, 3] = 255

        img = Image.fromarray(rgba, "RGBA")
        img.save(output_path, "PNG")
        return output_path

    @staticmethod
    def calculate_stats(ndvi: np.ndarray, valid_mask: Optional[np.ndarray] = None) -> Dict[str, Any]:
        active_ndvi = ndvi[valid_mask] if valid_mask is not None else ndvi
        if active_ndvi.size == 0 or np.sum(valid_mask) == 0:
            return {
                "mean_ndvi": 0.0,
                "median_ndvi": 0.0,
                "std_ndvi": 0.0,
                "min_ndvi": 0.0,
                "max_ndvi": 0.0,
                "dense_canopy_fraction": 0.0,
                "degraded_ground_fraction": 0.0,
                "valid_pixel_count": 0
            }
        dense_canopy = np.sum(active_ndvi > 0.60) / active_ndvi.size
        degraded = np.sum(active_ndvi < 0.25) / active_ndvi.size
        return {
            "mean_ndvi": round(float(np.mean(active_ndvi)), 3),
            "median_ndvi": round(float(np.median(active_ndvi)), 3),
            "std_ndvi": round(float(np.std(active_ndvi)), 3),
            "min_ndvi": round(float(np.min(active_ndvi)), 3),
            "max_ndvi": round(float(np.max(active_ndvi)), 3),
            "dense_canopy_fraction": round(float(dense_canopy), 3),
            "degraded_ground_fraction": round(float(degraded), 3),
            "valid_pixel_count": int(active_ndvi.size)
        }

ndvi_calculator = NDVICalculator()

