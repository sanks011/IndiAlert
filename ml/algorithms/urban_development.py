"""
Urban Development Detection Algorithm

This module implements the algorithm for detecting urban development in satellite imagery.
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

class UrbanDevelopmentDetection(ChangeDetectionAlgorithm):
    """Detect urban development using indices sensitive to built-up areas."""
    
    def detect_change(self, before_image, after_image, aoi_geometry):
        # Calculate NDBI (Normalized Difference Built-up Index)
        # NDBI = (SWIR - NIR) / (SWIR + NIR)
        ndbi_before = before_image.normalizedDifference(['B11', 'B8']).rename('NDBI_before')
        ndbi_after = after_image.normalizedDifference(['B11', 'B8']).rename('NDBI_after')
        
        # Calculate UI (Urban Index)
        # UI = (SWIR2 - NIR) / (SWIR2 + NIR)
        ui_before = before_image.normalizedDifference(['B12', 'B8']).rename('UI_before')
        ui_after = after_image.normalizedDifference(['B12', 'B8']).rename('UI_after')
        
        # Calculate changes
        ndbi_diff = ndbi_after.subtract(ndbi_before).rename('NDBI_diff')
        ui_diff = ui_after.subtract(ui_before).rename('UI_diff')
        
        # Combine the indicators
        change_image = ee.Image.cat([ndbi_before, ndbi_after, ndbi_diff, ui_before, ui_after, ui_diff])
        
        # Urban development indicator
        urban_dev = ndbi_diff.gt(0).And(ui_diff.gt(0))
        change_image = change_image.addBands(urban_dev.rename('urban_development_indicator'))
        
        # Add raw score for thresholding
        urban_score = ndbi_diff.multiply(ui_diff).rename('urban_development_score')
        
        # Create binary threshold for area calculations
        thresholded_change = urban_dev.rename('thresholded_change')
        
        change_image = change_image.addBands([urban_score, thresholded_change])
        
        return change_image
    
    def get_visualization_params(self):
        return {
            'bands': ['urban_development_indicator'],
            'min': 0,
            'max': 1,
            'palette': ['black', 'orange']
        }
    
    def filter_false_positives(self, change_image, aoi_geometry):
        # Filter out small isolated pixels (likely noise)
        connected = change_image.select('urban_development_indicator').connectedPixelCount(25, True)
        filtered = change_image.updateMask(connected.gt(8))
        
        # Filter out areas that already had high NDBI in the before image
        # (already developed areas)
        filtered = filtered.updateMask(change_image.select('NDBI_before').lt(0.2))
        
        return filtered
