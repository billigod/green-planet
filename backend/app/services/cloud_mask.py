import numpy as np
from typing import Tuple

class CloudMaskService:
    # Official Sentinel-2 L2A Scene Classification Layer (SCL) mapping
    SCL_NO_DATA = 0
    SCL_SATURATED_OR_DEFECTIVE = 1
    SCL_DARK_AREA_PIXELS = 2
    SCL_CLOUD_SHADOWS = 3
    SCL_VEGETATION = 4
    SCL_NOT_VEGETATED = 5
    SCL_WATER = 6
    SCL_UNCLASSIFIED = 7
    SCL_CLOUD_MEDIUM_PROB = 8
    SCL_CLOUD_HIGH_PROB = 9
    SCL_THIN_CIRRUS = 10
    SCL_SNOW_ICE = 11

    @classmethod
    def mask_from_scl(cls, scl_band: np.ndarray) -> Tuple[np.ndarray, float]:
        """
        Generates valid clear surface reflectance mask from official Sentinel-2
        Scene Classification Layer (SCL).
        Masks out:
          - No Data (0)
          - Saturated / defective pixels (1)
          - Cloud shadows (3)
          - Cloud medium probability (8)
          - Cloud high probability (9)
          - Thin cirrus (10)
          - Snow / Ice (11)
        Valid surface pixels:
          - Vegetation (4)
          - Non-vegetated (5)
          - Water (6)
          - Unclassified surface (7)
        Returns: (clear_surface_mask, cloud_coverage_pct)
        """
        scl = scl_band.astype(np.uint8)
        
        # Invalid / cloud classes
        invalid_classes = [
            cls.SCL_NO_DATA,
            cls.SCL_SATURATED_OR_DEFECTIVE,
            cls.SCL_CLOUD_SHADOWS,
            cls.SCL_CLOUD_MEDIUM_PROB,
            cls.SCL_CLOUD_HIGH_PROB,
            cls.SCL_THIN_CIRRUS,
            cls.SCL_SNOW_ICE
        ]
        invalid_mask = np.isin(scl, invalid_classes)
        clear_mask = ~invalid_mask

        total_pixels = scl.size
        # Exclude no_data from cloud percentage denominator if edge collar
        data_pixels = np.sum(scl != cls.SCL_NO_DATA)
        cloud_classes = [cls.SCL_CLOUD_SHADOWS, cls.SCL_CLOUD_MEDIUM_PROB, cls.SCL_CLOUD_HIGH_PROB, cls.SCL_THIN_CIRRUS]
        cloud_pixels = np.sum(np.isin(scl, cloud_classes))

        denom = data_pixels if data_pixels > 0 else total_pixels
        cloud_pct = round(float((cloud_pixels / denom) * 100.0), 2)
        return clear_mask, cloud_pct

    @staticmethod
    def detect_cloud_and_shadow(
        blue_band: np.ndarray,
        red_band: np.ndarray,
        nir_band: np.ndarray,
        cloud_threshold: float = 0.35,
        shadow_threshold: float = 0.08
    ) -> Tuple[np.ndarray, float]:
        """
        Generates valid surface reflectance mask by identifying opaque cloud reflectance
        and cloud casting shadows across optical bands. Fallback when SCL is missing.
        Returns: (clear_surface_mask, cloud_coverage_pct)
        """
        b = blue_band.astype(np.float32)
        r = red_band.astype(np.float32)
        nir = nir_band.astype(np.float32)

        if np.max(b) > 1.0:
            b = b / 10000.0 if np.max(b) > 255 else b / 255.0
            r = r / 10000.0 if np.max(r) > 255 else r / 255.0
            nir = nir / 10000.0 if np.max(nir) > 255 else nir / 255.0

        cloud_mask = (b > cloud_threshold) & (r > cloud_threshold * 0.8) & (nir > cloud_threshold * 0.8)
        shadow_mask = (nir < shadow_threshold) & (r < shadow_threshold)
        invalid_mask = cloud_mask | shadow_mask
        clear_mask = ~invalid_mask

        total_pixels = clear_mask.size
        cloud_pixels = np.sum(invalid_mask)
        cloud_pct = round(float((cloud_pixels / total_pixels) * 100.0), 2)
        return clear_mask, cloud_pct

cloud_mask_service = CloudMaskService()
