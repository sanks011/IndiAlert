"""
Advanced Deforestation Detection Algorithm

This module implements a state-of-the-art algorithm for detecting deforestation in satellite imagery
with advanced false positive reduction for crop harvesting and natural vegetation changes.
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

class DeforestationDetection(ChangeDetectionAlgorithm):
    """
    Advanced deforestation detection with crop harvesting false positive reduction.
    
    This algorithm uses:
    - Multi-spectral vegetation indices (NDVI, EVI, SAVI, NDMI, NBR)
    - Temporal consistency analysis
    - Crop phenology awareness
    - Harmonic analysis for seasonal patterns
    - Advanced false positive filtering
    """
    
    def detect_change(self, before_image, after_image, aoi_geometry):
        """
        Advanced deforestation detection with false positive reduction.
        """
        print("Starting deforestation detection...")
        
        # Calculate multiple vegetation indices for robust analysis
        before_indices = self._calculate_vegetation_indices(before_image)
        after_indices = self._calculate_vegetation_indices(after_image)
        
        print("Calculated vegetation indices")
        
        # Sample some values for debugging
        try:
            sample_point = aoi_geometry.centroid()
            before_sample = before_indices.sample(sample_point, 30).first().getInfo()
            after_sample = after_indices.sample(sample_point, 30).first().getInfo()
            print(f"Before indices at center: {before_sample}")
            print(f"After indices at center: {after_sample}")
        except Exception as e:
            print(f"Could not sample indices: {e}")
        
        # Rename indices to match expected naming convention
        before_indices_renamed = ee.Image.cat([
            before_indices.select('NDVI').rename('NDVI_before'),
            before_indices.select('EVI').rename('EVI_before'),
            before_indices.select('SAVI').rename('SAVI_before'),
            before_indices.select('NDMI').rename('NDMI_before'),
            before_indices.select('NBR').rename('NBR_before')
        ])
        
        after_indices_renamed = ee.Image.cat([
            after_indices.select('NDVI').rename('NDVI_after'),
            after_indices.select('EVI').rename('EVI_after'),
            after_indices.select('SAVI').rename('SAVI_after'),
            after_indices.select('NDMI').rename('NDMI_after'),
            after_indices.select('NBR').rename('NBR_after')
        ])
        
        # Primary deforestation detection using multiple indices
        deforestation_score = self._calculate_primary_score(before_indices, after_indices)
        print("Calculated primary deforestation score")
        
        # Apply seasonal change filtering first
        seasonal_filtered_score = self._apply_seasonal_filtering(
            deforestation_score, before_indices, after_indices, aoi_geometry
        )
        print("Applied seasonal filtering")
        
        # Apply advanced false positive filtering
        filtered_score = self._apply_false_positive_filters(
            seasonal_filtered_score, before_indices, after_indices, aoi_geometry
        )
        print("Applied false positive filters")
        
        # Sample the scores for debugging
        try:
            score_sample = deforestation_score.sample(sample_point, 30).first().getInfo()
            filtered_sample = filtered_score.sample(sample_point, 30).first().getInfo()
            print(f"Primary score at center: {score_sample}")
            print(f"Filtered score at center: {filtered_sample}")
        except Exception as e:
            print(f"Could not sample scores: {e}")
        
        # Create binary threshold for area calculations (more sensitive threshold)
        thresholded_change = filtered_score.gte(0.2).rename('thresholded_change')
        
        # Debug: Sample the threshold result
        try:
            threshold_sample = thresholded_change.sample(sample_point, 30).first().getInfo()
            print(f"Threshold result at center: {threshold_sample}")
        except Exception as e:
            print(f"Could not sample threshold: {e}")
        
        # Create comprehensive change image
        change_image = ee.Image.cat([
            before_indices_renamed,
            after_indices_renamed,
            deforestation_score.rename('deforestation_score'),
            filtered_score.rename('filtered_deforestation_score'),
            thresholded_change
        ])
        
        print("Deforestation detection completed")
        return change_image
    
    def detect_change_with_dates(self, before_image, after_image, aoi_geometry, before_period, after_period):
        """
        Enhanced deforestation detection with seasonal awareness using date information.
        """
        print("Starting seasonal-aware deforestation detection...")
        
        # First run the standard detection
        change_image = self.detect_change(before_image, after_image, aoi_geometry)
        
        # Check available bands and extract the appropriate score
        try:
            available_bands = change_image.bandNames()
            
            # Try to get the filtered score, fall back to main score if needed
            if available_bands.contains('filtered_deforestation_score').getInfo():
                deforestation_score = change_image.select('filtered_deforestation_score')
            elif available_bands.contains('deforestation_score').getInfo():
                deforestation_score = change_image.select('deforestation_score')
            else:
                print("Warning: No deforestation score band found, skipping seasonal filtering")
                return change_image
                
        except Exception as e:
            print(f"Warning: Could not check available bands: {e}")
            # Try to extract deforestation_score as fallback
            try:
                deforestation_score = change_image.select('deforestation_score')
            except:
                print("Warning: Could not extract any score band, skipping seasonal filtering")
                return change_image
        
        # Apply month-aware seasonal filtering
        seasonally_adjusted_score = self._apply_month_aware_filtering(
            deforestation_score, aoi_geometry, before_period, after_period
        )
        
        print("Applied month-aware seasonal filtering")
        
        # Add the seasonally adjusted score as a new band (don't try to replace)
        updated_change_image = change_image.addBands(
            seasonally_adjusted_score.rename('seasonally_filtered_deforestation_score')
        )
        
        # Update the main deforestation_score band for thresholding
        try:
            updated_change_image = updated_change_image.addBands(
                seasonally_adjusted_score.rename('deforestation_score'), 
                ['deforestation_score'], 
                True
            )
        except Exception as e:
            print(f"Warning: Could not update main score band: {e}")
            # Just add as new band
            updated_change_image = updated_change_image.addBands(
                seasonally_adjusted_score.rename('final_deforestation_score')
            )
        
        print("Seasonal-aware deforestation detection completed")
        return updated_change_image

    def _calculate_vegetation_indices(self, image):
        """Calculate multiple vegetation indices for robust analysis"""
        # NDVI - Standard vegetation index
        ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI')
        
        # EVI - Enhanced Vegetation Index (less sensitive to atmospheric effects)
        evi = image.expression(
            '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
                'NIR': image.select('B8'),
                'RED': image.select('B4'),
                'BLUE': image.select('B2')
            }
        ).rename('EVI')
        
        # SAVI - Soil Adjusted Vegetation Index (reduces soil brightness influence)
        savi = image.expression(
            '((NIR - RED) / (NIR + RED + 0.5)) * (1 + 0.5)', {
                'NIR': image.select('B8'),
                'RED': image.select('B4')
            }
        ).rename('SAVI')
        
        # NDMI - Normalized Difference Moisture Index (water content)
        ndmi = image.normalizedDifference(['B8', 'B11']).rename('NDMI')
        
        # NBR - Normalized Burn Ratio (detects burned areas)
        nbr = image.normalizedDifference(['B8', 'B12']).rename('NBR')
        
        return ee.Image.cat([ndvi, evi, savi, ndmi, nbr])
    
    def _calculate_primary_score(self, before_indices, after_indices):
        """Calculate primary deforestation score with forest-specific weighting"""
        print("DEBUG: Starting enhanced primary score calculation...")
        
        # Calculate changes in each index
        ndvi_change = before_indices.select('NDVI').subtract(after_indices.select('NDVI'))
        evi_change = before_indices.select('EVI').subtract(after_indices.select('EVI'))
        ndmi_change = before_indices.select('NDMI').subtract(after_indices.select('NDMI'))
        nbr_change = before_indices.select('NBR').subtract(after_indices.select('NBR'))
        
        print("DEBUG: Calculated vegetation changes")
        
        # Forest-focused scoring approach
        # Higher weights for indices that are more reliable for forests
        
        # NDVI change (primary indicator, but normalized by initial NDVI)
        ndvi_before = before_indices.select('NDVI')
        # Relative NDVI change (percentage loss)
        relative_ndvi_change = ndvi_change.divide(ndvi_before.add(0.01)).clamp(0, 1)
        primary_score = relative_ndvi_change.multiply(10).clamp(0, 1)
        
        # NDMI change (important for forests - moisture loss)
        ndmi_score = ndmi_change.multiply(8).clamp(0, 1)
        
        # NBR change (burn ratio - good for detecting cleared areas)
        nbr_score = nbr_change.multiply(6).clamp(0, 1)
        
        # EVI change (supporting evidence)
        evi_score = evi_change.multiply(4).clamp(0, 1)
        
        # Combine scores with weighted average (emphasizing forest indicators)
        # Weight NDVI and NDMI more heavily for forest detection
        combined_score = primary_score.multiply(0.4).add(
            ndmi_score.multiply(0.3)
        ).add(
            nbr_score.multiply(0.2)
        ).add(
            evi_score.multiply(0.1)
        )
        
        # Apply forest baseline requirement
        # Only areas with reasonable initial forest vegetation can score high
        forest_baseline = ndvi_before.gt(0.3).And(
            before_indices.select('NDMI').gt(0.1)
        )
        
        # Scale score based on forest baseline
        final_score = combined_score.multiply(forest_baseline).clamp(0, 1)
        
        print("DEBUG: Completed enhanced primary score calculation")
        return final_score
    
    def _apply_false_positive_filters(self, score, before_indices, after_indices, aoi_geometry):
        """Enhanced false positive filtering with agricultural area detection"""
        print("DEBUG: Starting enhanced false positive filtering...")
        
        # Filter 1: Basic Vegetation Check - was there vegetation to lose?
        baseline_filter = self._vegetation_baseline_filter(before_indices)
        
        # Filter 2: Simple change direction check
        ndvi_before = before_indices.select('NDVI')
        ndvi_after = after_indices.select('NDVI')
        ndvi_decreased = ndvi_before.gt(ndvi_after)  # NDVI went down = potential deforestation
        
        # Filter 3: Enhanced agricultural area detection
        agricultural_filter = self._detect_agricultural_areas(before_indices, after_indices)
        
        # Filter 4: Forest vs crop spectral signature analysis
        forest_signature_filter = self._forest_signature_analysis(before_indices, after_indices)
        
        # Filter 5: Temporal pattern analysis
        temporal_filter = self._temporal_pattern_analysis(before_indices, after_indices)
        
        # Combine all filters
        # Agricultural areas get heavily penalized (multiplied by 0.1)
        # Non-forest signatures get moderately penalized (multiplied by 0.3) 
        # Poor temporal patterns get lightly penalized (multiplied by 0.7)
        agricultural_penalty = agricultural_filter.multiply(-0.9).add(1.0).clamp(0.1, 1.0)
        forest_penalty = forest_signature_filter.multiply(-0.7).add(1.0).clamp(0.3, 1.0)
        temporal_penalty = temporal_filter.multiply(-0.3).add(1.0).clamp(0.7, 1.0)
        
        # Basic requirement: vegetation baseline and decrease
        basic_filter = baseline_filter.And(ndvi_decreased)
        
        # Apply all filters
        filtered_score = score.multiply(basic_filter) \
                            .multiply(agricultural_penalty) \
                            .multiply(forest_penalty) \
                            .multiply(temporal_penalty)
        
        print("DEBUG: Completed enhanced false positive filtering")
        return filtered_score.clamp(0, 1)
    
    def _detect_agricultural_areas(self, before_indices, after_indices):
        """
        Detect areas that are likely agricultural rather than forest.
        Returns 1 for likely agriculture, 0 for likely forest.
        """
        ndvi_before = before_indices.select('NDVI')
        ndvi_after = after_indices.select('NDVI')
        evi_before = before_indices.select('EVI')
        evi_after = after_indices.select('EVI')
        ndmi_before = before_indices.select('NDMI')
        
        # Agricultural indicators:
        
        # 1. Moderate initial vegetation (not dense forest, not bare soil)
        # Crops typically have NDVI 0.3-0.7, forests >0.7
        moderate_vegetation = ndvi_before.gt(0.25).And(ndvi_before.lt(0.65))
        
        # 2. Very rapid/complete vegetation loss (typical of crop harvest)
        rapid_loss = ndvi_before.subtract(ndvi_after).gt(0.4)  # >40% NDVI drop
        
        # 3. Low moisture content initially (crops vs forests)
        # Forests typically have higher NDMI values
        low_moisture = ndmi_before.lt(0.3)
        
        # 4. High EVI/NDVI ratio (indicating crops rather than natural vegetation)
        # Crops often have higher EVI relative to NDVI
        high_evi_ratio = evi_before.divide(ndvi_before.add(0.01)).gt(0.8)
        
        # 5. Very low remaining vegetation (complete harvest)
        complete_clearing = ndvi_after.lt(0.15)
        
        # Agricultural signature: combination of indicators
        # Strong indicators: moderate initial vegetation + rapid loss + complete clearing
        strong_agricultural = moderate_vegetation.And(rapid_loss).And(complete_clearing)
        
        # Moderate indicators: add moisture and spectral ratio tests
        moderate_agricultural = moderate_vegetation.And(rapid_loss).And(low_moisture.Or(high_evi_ratio))
        
        # Combine indicators
        agricultural_likelihood = strong_agricultural.multiply(1.0).add(
            moderate_agricultural.And(strong_agricultural.Not()).multiply(0.7)
        )
        
        return agricultural_likelihood
    
    def _forest_signature_analysis(self, before_indices, after_indices):
        """
        Analyze spectral signature to determine if area exhibits forest characteristics.
        Returns 1 for likely non-forest, 0 for likely forest.
        """
        ndvi_before = before_indices.select('NDVI')
        ndmi_before = before_indices.select('NDMI')
        nbr_before = before_indices.select('NBR')
        
        # Forest characteristics:
        # - High NDVI (dense vegetation)
        # - High NDMI (high moisture content)
        # - High NBR (healthy vegetation)
        
        high_ndvi = ndvi_before.gt(0.65)  # Dense vegetation
        high_moisture = ndmi_before.gt(0.25)  # Good moisture content
        healthy_vegetation = nbr_before.gt(0.3)  # Healthy vegetation signature
        
        # Strong forest signature requires all three
        strong_forest = high_ndvi.And(high_moisture).And(healthy_vegetation)
        
        # Moderate forest signature requires at least two
        moderate_forest = high_ndvi.And(high_moisture).Or(
            high_ndvi.And(healthy_vegetation)
        ).Or(
            high_moisture.And(healthy_vegetation)
        )
        
        # Non-forest likelihood (inverse of forest likelihood)
        non_forest_likelihood = strong_forest.Not().multiply(
            moderate_forest.Not().multiply(1.0).add(
                moderate_forest.And(strong_forest.Not()).multiply(0.5)
            )
        )
        
        return non_forest_likelihood
    
    def _temporal_pattern_analysis(self, before_indices, after_indices):
        """
        Analyze temporal patterns to distinguish crops from forest clearing.
        Returns 1 for likely crop pattern, 0 for likely deforestation pattern.
        """
        ndvi_before = before_indices.select('NDVI')
        ndvi_after = after_indices.select('NDVI')
        evi_before = before_indices.select('EVI')
        evi_after = after_indices.select('EVI')
        
        # Calculate the rate and pattern of change
        ndvi_change = ndvi_before.subtract(ndvi_after)
        evi_change = evi_before.subtract(evi_after)
        
        # Crop harvest patterns:
        # - Very rapid loss (within short time window)
        # - Consistent loss across multiple indices
        # - Often complete vegetation removal
        
        # Deforestation patterns:
        # - May be gradual or rapid
        # - Often partial clearing initially
        # - Usually affects larger contiguous areas
        
        # Very rapid change suggests crop harvest
        very_rapid_change = ndvi_change.gt(0.5).And(evi_change.gt(0.3))
        
        # Extremely consistent change across indices (crop-like)
        consistent_change = ndvi_change.subtract(evi_change).abs().lt(0.2)
        
        # Crop-like temporal pattern
        crop_pattern = very_rapid_change.And(consistent_change)
        
        return crop_pattern.multiply(1.0)
    
    def _magnitude_filter(self, before_indices, after_indices):
        """Check if the change magnitude is significant enough to be deforestation"""
        # Calculate absolute change in NDVI
        ndvi_change = before_indices.select('NDVI').subtract(after_indices.select('NDVI'))
        
        # For deforestation, we need a decrease, not increase
        significant_decrease = ndvi_change.gt(0.05)  # At least 5% NDVI decrease
        
        # Additional check: EVI change should be consistent
        evi_change = before_indices.select('EVI').subtract(after_indices.select('EVI'))
        evi_decrease = evi_change.gt(0.03)  # At least 3% EVI decrease
        
        # Combine both conditions - either strong NDVI decrease or both decreases
        magnitude_ok = significant_decrease.Or(ndvi_change.gt(0.03).And(evi_decrease))
        
        return magnitude_ok.multiply(1.0)
    
    def _enhanced_crop_filter(self, before_indices, after_indices):
        """Enhanced crop pattern detection with relaxed thresholds"""
        ndvi_before = before_indices.select('NDVI')
        ndvi_after = after_indices.select('NDVI')
        evi_before = before_indices.select('EVI')
        evi_after = after_indices.select('EVI')
        
        # Calculate relative changes
        ndvi_change = ndvi_before.subtract(ndvi_after)
        evi_change = evi_before.subtract(evi_after)
        
        # Crop indicators (relaxed to avoid missing forest clearing)
        # Pattern 1: Very rapid change (crops) vs gradual change (forest clearing)
        rapid_change = ndvi_change.gt(0.6)  # Very rapid drop suggests crops
        
        # Pattern 2: Low initial vegetation (likely crops, not forest)
        low_initial_veg = ndvi_before.lt(0.4)  # Was likely cropland, not forest
        
        # Pattern 3: Seasonal pattern (high EVI/NDVI ratio suggests crops)
        seasonal_pattern = evi_before.divide(ndvi_before.add(0.01)).gt(0.9)
        
        # If any pattern strongly suggests crops, reduce confidence slightly
        crop_indicator = rapid_change.Or(low_initial_veg).Or(seasonal_pattern)
        
        # Return filter (0.7 = likely crop, 1.0 = likely forest)
        # Less aggressive filtering to avoid missing real deforestation
        return crop_indicator.multiply(-0.3).add(1.0).clamp(0.7, 1.0)
    
    def _spectral_gradient_filter(self, before_indices, after_indices):
        """Enhanced spectral gradient analysis for vegetation loss detection"""
        # Check for vegetation loss spectral signature
        
        # Primary check: NDVI decrease indicates vegetation loss
        ndvi_before = before_indices.select('NDVI')
        ndvi_after = after_indices.select('NDVI')
        ndvi_decrease = ndvi_before.subtract(ndvi_after).gt(0.02)  # Lowered threshold
        
        # Secondary check: Was there meaningful vegetation initially?
        had_vegetation = ndvi_before.gt(0.25)  # Lowered threshold for sensitivity
        
        # Tertiary check: EVI consistency (should also decrease)
        evi_before = before_indices.select('EVI')
        evi_after = after_indices.select('EVI')
        evi_decrease = evi_before.subtract(evi_after).gt(0.01)  # Very low threshold
        
        # Combined spectral signature
        # Either strong NDVI decrease OR consistent decrease in both indices
        strong_ndvi_loss = ndvi_decrease.And(had_vegetation)
        consistent_loss = ndvi_decrease.And(evi_decrease).And(had_vegetation)
        
        spectral_signature = strong_ndvi_loss.Or(consistent_loss)
        
        return spectral_signature.multiply(1.0)
    
    def _vegetation_baseline_filter(self, before_indices):
        """Enhanced baseline filter to focus on forest areas"""
        print("DEBUG: Applying enhanced vegetation baseline filter...")
        
        # More stringent baseline for forest detection
        # Forests typically have higher NDVI values than crops
        ndvi_threshold = 0.4   # Higher threshold for forest vegetation
        ndmi_threshold = 0.1   # Minimum moisture content for forests
        
        # Check for meaningful forest vegetation
        had_forest_vegetation = before_indices.select('NDVI').gt(ndvi_threshold).And(
            before_indices.select('NDMI').gt(ndmi_threshold)
        )
        
        print("DEBUG: Completed enhanced vegetation baseline filter")
        return had_forest_vegetation
    

    def _apply_seasonal_filtering(self, score_image, before_indices, after_indices, aoi_geometry):
        """
        Apply seasonal change filtering to reduce false positives from natural cycles.
        
        This function identifies and filters out changes that are likely due to:
        - Deciduous forest seasonal cycles
        - Agricultural crop cycles  
        - Monsoon/dry season effects
        - Natural phenological variations
        """
        print("DEBUG: Applying seasonal change filtering...")
        
        try:
            # 1. Detect agricultural/seasonal patterns using NDVI variability
            ndvi_before = before_indices.select('NDVI')
            ndvi_after = after_indices.select('NDVI')
            
            # Calculate seasonal indicators
            # Agricultural areas often have more extreme NDVI ranges
            ndvi_range = ndvi_before.max(ndvi_after).subtract(ndvi_before.min(ndvi_after))
            
            # 2. Check for reversible vs permanent changes
            # Seasonal changes often affect all vegetation indices similarly
            # Deforestation typically shows stronger NDMI/NBR changes relative to NDVI
            
            ndvi_change = ndvi_before.subtract(ndvi_after)
            ndmi_change = before_indices.select('NDMI').subtract(after_indices.select('NDMI'))
            nbr_change = before_indices.select('NBR').subtract(after_indices.select('NBR'))
            
            # Calculate change ratios - deforestation shows disproportionate moisture/burn changes
            ndmi_to_ndvi_ratio = ndmi_change.divide(ndvi_change.add(0.01)).abs()
            nbr_to_ndvi_ratio = nbr_change.divide(ndvi_change.add(0.01)).abs()
            
            # 3. Seasonal texture analysis
            # Natural forests maintain high texture even during seasonal changes
            # Agricultural areas become uniform after harvest
            
            # Calculate texture using NDVI entropy
            # Convert NDVI to integer for entropy calculation (Earth Engine requirement)
            ndvi_before_int = ndvi_before.multiply(255).add(128).int8()  # Scale to 0-255 and convert to int8
            ndvi_after_int = ndvi_after.multiply(255).add(128).int8()
            
            ndvi_texture_before = ndvi_before_int.entropy(ee.Kernel.square(radius=2))
            ndvi_texture_after = ndvi_after_int.entropy(ee.Kernel.square(radius=2))
            texture_change = ndvi_texture_before.subtract(ndvi_texture_after)
            
            # 4. Identify permanent forest loss indicators
            # True deforestation shows:
            # - High moisture loss (NDMI change)
            # - High burn/bare soil signal (NBR change)  
            # - Loss of vegetation structure (texture)
            # - Consistent across multiple indices
            
            # Permanent change indicators
            moisture_loss_indicator = ndmi_change.gt(0.15)  # Significant moisture loss
            structural_loss_indicator = texture_change.gt(0.5)  # Loss of texture
            spectral_consistency = ndmi_to_ndvi_ratio.gt(0.8).And(nbr_to_ndvi_ratio.gt(0.6))
            
            # 5. Seasonal change indicators (to filter out)
            # Seasonal changes typically show:
            # - High NDVI variability but maintained structure
            # - Lower moisture change relative to vegetation change
            # - Maintained texture patterns
            
            seasonal_indicator = ndvi_range.gt(0.3).And(texture_change.lt(0.3)).And(ndmi_to_ndvi_ratio.lt(0.5))
            
            # 6. Agricultural cycle detection
            # Very low post-change NDVI suggests harvested cropland
            harvested_cropland = ndvi_after.lt(0.2).And(ndvi_before.gt(0.4))
            
            # 7. Apply filtering
            # Keep only changes that show permanent forest loss characteristics
            permanent_change_mask = moisture_loss_indicator.And(structural_loss_indicator).And(spectral_consistency)
            
            # Remove seasonal and agricultural false positives
            non_seasonal_mask = seasonal_indicator.Not().And(harvested_cropland.Not())
            
            # Combine filters
            final_mask = permanent_change_mask.And(non_seasonal_mask)
            
            # Apply the seasonal filter
            filtered_score = score_image.multiply(final_mask)
            
            # Ensure the output has the same structure as input
            # If the mask filtered everything to 0, still return a valid image
            filtered_score = filtered_score.unmask(0)
            
            # Debug: Sample the filtering effects
            try:
                center_point = aoi_geometry.centroid()
                
                original_sample = score_image.sample(center_point, 30).first().getInfo()
                filtered_sample = filtered_score.sample(center_point, 30).first().getInfo()
                
                print(f"DEBUG: Seasonal filter - Original score: {original_sample}")
                print(f"DEBUG: Seasonal filter - Filtered score: {filtered_sample}")
                
            except Exception as e:
                print(f"DEBUG: Could not sample seasonal filtering: {e}")
            
            print("DEBUG: Completed seasonal change filtering")
            return filtered_score
            
        except Exception as e:
            print(f"Warning: Seasonal filtering failed: {e}")
            print("DEBUG: Returning original score without seasonal filtering")
            return score_image

    def _apply_month_aware_filtering(self, score_image, aoi_geometry, before_period, after_period):
        """
        Apply month-aware filtering based on known seasonal patterns.
        
        This considers:
        - Monsoon season effects (June-September in India)
        - Winter deciduous cycles (December-February)
        - Spring growth periods (March-May)
        """
        print("DEBUG: Applying month-aware seasonal filtering...")
        
        try:
            import datetime
            
            # Parse dates to determine seasons
            before_date = datetime.datetime.strptime(before_period['start'], '%Y-%m-%d')
            after_date = datetime.datetime.strptime(after_period['end'], '%Y-%m-%d')
            
            before_month = before_date.month
            after_month = after_date.month
            
            # Define seasonal periods for India
            monsoon_months = [6, 7, 8, 9]  # June-September
            winter_months = [12, 1, 2]    # December-February  
            spring_months = [3, 4, 5]     # March-May
            
            # Seasonal adjustment factors
            seasonal_factor = 1.0
            
            # Reduce sensitivity during known seasonal transition periods
            if (before_month in winter_months and after_month in spring_months) or \
               (before_month in spring_months and after_month in monsoon_months):
                seasonal_factor = 0.7  # Reduce sensitivity during growth transitions
                print(f"DEBUG: Applying growth transition filter (factor: {seasonal_factor})")
                
            elif (before_month in monsoon_months and after_month in winter_months):
                seasonal_factor = 0.8  # Reduce sensitivity during senescence
                print(f"DEBUG: Applying senescence transition filter (factor: {seasonal_factor})")
                
            elif before_month in winter_months and after_month in winter_months:
                seasonal_factor = 0.9  # Slightly reduce sensitivity in dormant season
                print(f"DEBUG: Applying dormant season filter (factor: {seasonal_factor})")
            
            # Apply seasonal adjustment
            adjusted_score = score_image.multiply(seasonal_factor)
            
            print(f"DEBUG: Month-aware filtering applied - Before: {before_month}, After: {after_month}, Factor: {seasonal_factor}")
            return adjusted_score
            
        except Exception as e:
            print(f"Warning: Month-aware filtering failed: {e}")
            return score_image

    def get_visualization_params(self):
        """Get visualization parameters for deforestation results"""
        return {
            'bands': ['filtered_deforestation_score'],
            'min': 0,
            'max': 1,
            'palette': ['white', 'yellow', 'orange', 'red', 'darkred']
        }
    
    def filter_false_positives(self, change_image, aoi_geometry):
        """Additional post-processing false positive filtering"""
        # Apply morphological operations to remove small, isolated changes
        # These are often noise or small clearings, not systematic deforestation
        
        # Use the filtered score for further processing
        score_band = 'filtered_deforestation_score'
        
        # Try to check if the band exists without calling getInfo() on the entire image
        try:
            # Try to select the band - if it doesn't exist, this will fail
            change_image.select(score_band)
        except:
            score_band = 'deforestation_score'
        
        # First create a binary mask from the score (threshold at 0.5)
        binary_mask = change_image.select(score_band).gte(0.5)
        
        # Remove isolated pixels (less than 3x3 area)
        kernel = ee.Kernel.square(radius=1)  # 3x3 kernel
        
        # Opening operation (erosion followed by dilation) on binary mask
        eroded = binary_mask.focal_min(kernel=kernel, iterations=1)
        opened = eroded.focal_max(kernel=kernel, iterations=1)
        
        # Only keep changes larger than minimum area (reduces noise)
        min_area_pixels = 9  # Minimum 9 pixels (roughly 900 sq meters for 10m resolution)
        connected_pixels = opened.connectedPixelCount(maxSize=256)
        size_filtered_mask = connected_pixels.gte(min_area_pixels)
        
        # Apply the size filter to the original score
        size_filtered_score = change_image.select(score_band).updateMask(size_filtered_mask)
        
        # Update the change image with the filtered result
        return change_image.addBands(size_filtered_score.rename('final_deforestation_score'), None, True)
