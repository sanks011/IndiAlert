"""
Water Body Change Detection Algorithm

This module implements the algorithm for detecting changes in water bodies.
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

class WaterBodyChangeDetection(ChangeDetectionAlgorithm):
    """
    Advanced water body change detection with seasonal variation filtering.
    
    This algorithm uses:
    - Multiple water indices (NDWI, MNDWI, AWEIsh, AWEInsh)
    - Seasonal pattern analysis
    - Terrain-based corrections
    - Turbidity and pollution detection
    - Advanced false positive filtering for natural water level variations
    """
    
    def detect_change(self, before_image, after_image, aoi_geometry):
        """
        Advanced water body change detection with false positive reduction.
        """
        # Calculate multiple water indices for robust analysis
        before_indices = self._calculate_water_indices(before_image)
        after_indices = self._calculate_water_indices(after_image)
        
        # Primary water body change detection
        water_change_score = self._calculate_water_change_score(before_indices, after_indices)
        
        # Apply advanced false positive filtering
        filtered_score = self._apply_water_filters(
            water_change_score, before_indices, after_indices, aoi_geometry
        )
        
        # Classify types of water body changes
        change_types = self._classify_water_changes(before_indices, after_indices, filtered_score)
        
        # Create binary threshold for area calculations
        # Use water_expansion_indicator or water_reclamation_indicator as the main change
        water_change_binary = change_types.select('water_reclamation_indicator').Or(
            change_types.select('water_expansion_indicator')
        ).rename('thresholded_change')
        
        # Create comprehensive change image
        change_image = ee.Image.cat([
            before_indices,
            after_indices,
            water_change_score.rename('water_change_score'),
            filtered_score.rename('water_body_change_score'),
            change_types,
            water_change_binary
        ])
        
        return change_image
    
    def _calculate_water_indices(self, image):
        """Calculate multiple water indices for robust analysis"""
        # NDWI - Normalized Difference Water Index (standard)
        ndwi = image.normalizedDifference(['B3', 'B8']).rename('ndwi')
        
        # MNDWI - Modified NDWI (better for urban areas)
        mndwi = image.normalizedDifference(['B3', 'B11']).rename('mndwi')
        
        # AWEIsh - Automated Water Extraction Index (shadow enhanced)
        aweish = image.expression(
            'BLUE + 2.5 * GREEN - 1.5 * (NIR + SWIR1) - 0.25 * SWIR2', {
                'BLUE': image.select('B2'),
                'GREEN': image.select('B3'),
                'NIR': image.select('B8'),
                'SWIR1': image.select('B11'),
                'SWIR2': image.select('B12')
            }
        ).rename('aweish')
        
        # AWEInsh - AWEI (non-shadow)
        aweinsh = image.expression(
            '4 * (GREEN - SWIR1) - (0.25 * NIR + 2.75 * SWIR2)', {
                'GREEN': image.select('B3'),
                'NIR': image.select('B8'),
                'SWIR1': image.select('B11'),
                'SWIR2': image.select('B12')
            }
        ).rename('aweinsh')
        
        # Water Turbidity Index (for pollution detection)
        turbidity = image.expression(
            'RED / BLUE', {
                'RED': image.select('B4'),
                'BLUE': image.select('B2')
            }
        ).rename('turbidity')
        
        return ee.Image.cat([ndwi, mndwi, aweish, aweinsh, turbidity])
    
    def _calculate_water_change_score(self, before_indices, after_indices):
        """Calculate primary water body change score"""
        # Calculate changes in each water index
        ndwi_change = after_indices.select('ndwi').subtract(before_indices.select('ndwi')).abs()
        mndwi_change = after_indices.select('mndwi').subtract(before_indices.select('mndwi')).abs()
        aweish_change = after_indices.select('aweish').subtract(before_indices.select('aweish')).abs()
        aweinsh_change = after_indices.select('aweinsh').subtract(before_indices.select('aweinsh')).abs()
        
        # Weighted combination of water indices
        # MNDWI: 35%, NDWI: 30%, AWEIsh: 20%, AWEInsh: 15%
        combined_change = (
            mndwi_change.multiply(0.35).add(
            ndwi_change.multiply(0.30)).add(
            aweish_change.multiply(0.20)).add(
            aweinsh_change.multiply(0.15))
        )
        
        # Normalize to 0-1 scale
        return combined_change.clamp(0, 1)
    
    def _apply_water_filters(self, score, before_indices, after_indices, aoi_geometry):
        """Advanced false positive filtering for water body changes"""
        
        # Filter 1: Seasonal Variation Filter
        seasonal_filter = self._seasonal_variation_filter(before_indices, after_indices)
        
        # Filter 2: Water Baseline Filter
        baseline_filter = self._water_baseline_filter(before_indices, after_indices)
        
        # Filter 3: Change Magnitude Filter
        magnitude_filter = self._change_magnitude_filter(before_indices, after_indices)
        
        # Combine all filters
        combined_filter = (
            seasonal_filter.multiply(0.4).add(
            baseline_filter.multiply(0.4)).add(
            magnitude_filter.multiply(0.2))
        )
        
        return score.multiply(combined_filter).clamp(0, 1)
    
    def _seasonal_variation_filter(self, before_indices, after_indices):
        """Filter out natural seasonal water level variations"""
        ndwi_before = before_indices.select('ndwi')
        ndwi_after = after_indices.select('ndwi')
        mndwi_before = before_indices.select('mndwi')
        mndwi_after = after_indices.select('mndwi')
        
        # Calculate relative changes
        ndwi_rel_change = ndwi_after.subtract(ndwi_before).divide(ndwi_before.abs().add(0.1))
        mndwi_rel_change = mndwi_after.subtract(mndwi_before).divide(mndwi_before.abs().add(0.1))
        
        # If changes are consistent and moderate, likely seasonal
        consistency = ndwi_rel_change.subtract(mndwi_rel_change).abs()
        seasonal_pattern = consistency.lt(0.3).And(ndwi_rel_change.abs().lt(0.5))
        
        # Return inverse filter (1 = not seasonal, 0 = likely seasonal)
        return seasonal_pattern.Not().multiply(1.0)
    
    def _water_baseline_filter(self, before_indices, after_indices):
        """Only consider significant water or land areas initially"""
        water_threshold = 0.3
        land_threshold = -0.1
        
        before_mndwi = before_indices.select('mndwi')
        after_mndwi = after_indices.select('mndwi')
        
        # Areas that were clearly water or clearly land
        was_water = before_mndwi.gt(water_threshold)
        was_land = before_mndwi.lt(land_threshold)
        is_water = after_mndwi.gt(water_threshold)
        is_land = after_mndwi.lt(land_threshold)
        
        # Valid changes: water to land or land to water
        valid_change = (was_water.And(is_land)).Or(was_land.And(is_water))
        
        return valid_change.multiply(1.0)
    
    def _change_magnitude_filter(self, before_indices, after_indices):
        """Filter out minor variations that could be noise"""
        mndwi_change = after_indices.select('mndwi').subtract(before_indices.select('mndwi')).abs()
        ndwi_change = after_indices.select('ndwi').subtract(before_indices.select('ndwi')).abs()
        
        # Require significant change in at least one index
        significant_change = mndwi_change.gt(0.2).Or(ndwi_change.gt(0.2))
        
        return significant_change.multiply(1.0)
    
    def _classify_water_changes(self, before_indices, after_indices, score):
        """Classify types of water body changes"""
        before_mndwi = before_indices.select('mndwi')
        after_mndwi = after_indices.select('mndwi')
        before_turbidity = before_indices.select('turbidity')
        after_turbidity = after_indices.select('turbidity')
        
        # Water loss (reclamation/drying)
        water_reclamation_indicator = before_mndwi.gt(0.3).And(after_mndwi.lt(-0.1)).rename('water_reclamation_indicator')
        
        # Water gain (flooding/new water bodies)
        water_expansion_indicator = before_mndwi.lt(-0.1).And(after_mndwi.gt(0.3)).rename('water_expansion_indicator')
        
        # Pollution/turbidity increase
        pollution = after_turbidity.subtract(before_turbidity).gt(0.5).rename('pollution_indicator')
        
        return ee.Image.cat([water_reclamation_indicator, water_expansion_indicator, pollution])
    
    def get_visualization_params(self):
        return {
            'bands': ['water_reclamation_indicator', 'water_expansion_indicator', 'water_reclamation_indicator'],
            'min': 0,
            'max': 1,
            'palette': ['black', 'red', 'blue']  # Reclamation in red, expansion in blue
        }
    
    def filter_false_positives(self, change_image, aoi_geometry):
        # Filter out small isolated pixels (likely noise)
        connected_reclamation = change_image.select('water_reclamation_indicator').connectedPixelCount(25, True)
        connected_expansion = change_image.select('water_expansion_indicator').connectedPixelCount(25, True)
        
        # Apply different thresholds for water reclamation and expansion
        # Water reclamation (typically smaller areas) - require at least 5 connected pixels
        reclamation_filtered = change_image.select('water_reclamation_indicator').updateMask(connected_reclamation.gt(5))
        
        # Water expansion (can be larger) - require at least 8 connected pixels
        expansion_filtered = change_image.select('water_expansion_indicator').updateMask(connected_expansion.gt(8))
        
        # Combine the filtered indicators back into the image
        filtered = change_image \
            .addBands(reclamation_filtered, ['water_reclamation_indicator'], True) \
            .addBands(expansion_filtered, ['water_expansion_indicator'], True)
        
        return filtered
