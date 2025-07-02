"""
Land Use Change Detection Algorithm

This module implements the algorithm for detecting general land use changes in satellite imagery.
"""

import ee
import sys
import os

# Add the parent directory to the path to enable imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the base algorithm class
try:
    from change_detection_system import ChangeDetectionAlgorithm
except ImportError:
    # Fallback for direct execution
    import importlib.util
    spec = importlib.util.spec_from_file_location("change_detection_system", 
                                                 os.path.join(os.path.dirname(__file__), "..", "change_detection_system.py"))
    change_detection_system = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(change_detection_system)
    ChangeDetectionAlgorithm = change_detection_system.ChangeDetectionAlgorithm

class LandUseChangeDetection(ChangeDetectionAlgorithm):
    """Detect general land use and land cover changes."""
    
    def detect_change(self, before_image, after_image, aoi_geometry):
        # Calculate a variety of indices to capture different types of land cover
        
        # NDVI (vegetation)
        ndvi_before = before_image.normalizedDifference(['B8', 'B4']).rename('NDVI_before')
        ndvi_after = after_image.normalizedDifference(['B8', 'B4']).rename('NDVI_after')
        ndvi_diff = ndvi_after.subtract(ndvi_before).rename('NDVI_diff')
        
        # NDBI (built-up)
        ndbi_before = before_image.normalizedDifference(['B11', 'B8']).rename('NDBI_before')
        ndbi_after = after_image.normalizedDifference(['B11', 'B8']).rename('NDBI_after')
        ndbi_diff = ndbi_after.subtract(ndbi_before).rename('NDBI_diff')
        
        # NDWI (water)
        ndwi_before = before_image.normalizedDifference(['B3', 'B8']).rename('NDWI_before')
        ndwi_after = after_image.normalizedDifference(['B3', 'B8']).rename('NDWI_after')
        ndwi_diff = ndwi_after.subtract(ndwi_before).rename('NDWI_diff')
        
        # Calculate the magnitude of change across all indices
        change_magnitude = ndvi_diff.abs().add(ndbi_diff.abs()).add(ndwi_diff.abs()).rename('change_magnitude')
        
        # Combine all bands
        change_image = ee.Image.cat([
            ndvi_before, ndvi_after, ndvi_diff,
            ndbi_before, ndbi_after, ndbi_diff,
            ndwi_before, ndwi_after, ndwi_diff,
            change_magnitude
        ])
        
        # Land use change indicator based on overall magnitude
        land_use_change = change_magnitude.gt(0.2)
        
        # Create binary threshold for area calculations
        thresholded_change = land_use_change.rename('thresholded_change')
        
        change_image = change_image.addBands([
            land_use_change.rename('land_use_change_indicator'),
            thresholded_change
        ])
        
        # Add raw score for thresholding
        change_image = change_image.addBands(change_magnitude.rename('land_use_change_score'))
        
        return change_image
    
    def get_visualization_params(self):
        return {
            'bands': ['land_use_change_indicator'],
            'min': 0,
            'max': 1,
            'palette': ['black', 'yellow']
        }
    
    def filter_false_positives(self, change_image, aoi_geometry):
        # Filter out small isolated pixels (likely noise)
        connected = change_image.select('land_use_change_indicator').connectedPixelCount(25, True)
        filtered = change_image.updateMask(connected.gt(10))
        
        # Additional filtering based on specific land use transitions
        # This is more complex and would depend on specific requirements
        
        return filtered
