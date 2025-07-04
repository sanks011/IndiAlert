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
        Uses only harmonized bands for robust processing.
        """
        print("Starting deforestation detection with harmonized bands...")
        
        # First ensure we only work with the harmonized bands
        harmonized_bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12']
        
        try:
            # Check available bands to validate harmonization
            before_bands = before_image.bandNames().getInfo()
            after_bands = after_image.bandNames().getInfo()
            
            print(f"Before image available bands: {before_bands}")
            print(f"After image available bands: {after_bands}")
            
            # Check if images are properly harmonized
            missing_before = [b for b in harmonized_bands if b not in before_bands]
            missing_after = [b for b in harmonized_bands if b not in after_bands]
            
            if missing_before or missing_after:
                print(f"WARNING: Missing bands in before image: {missing_before}")
                print(f"WARNING: Missing bands in after image: {missing_after}")
                print("Proceeding with available bands only")
        except Exception as e:
            print(f"WARNING: Could not check bands: {e}")
        
        # Calculate multiple vegetation indices for robust analysis
        before_indices = self._calculate_vegetation_indices(before_image)
        after_indices = self._calculate_vegetation_indices(after_image)
        
        print("Calculated vegetation indices")
        
        # Sample some values for debugging - with error handling for band mismatches
        try:
            sample_point = aoi_geometry.centroid()
            before_sample = before_indices.sample(sample_point, 30).first().getInfo()
            after_sample = after_indices.sample(sample_point, 30).first().getInfo()
            print(f"Before indices at center: {before_sample}")
            print(f"After indices at center: {after_sample}")
        except Exception as e:
            print(f"Could not sample indices: {e}")
            # Continue processing despite sampling error
        
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
        
        # Sample the scores for debugging - with error handling for band mismatches
        try:
            score_sample = deforestation_score.sample(sample_point, 30).first().getInfo()
            filtered_sample = filtered_score.sample(sample_point, 30).first().getInfo()
            print(f"Primary score at center: {score_sample}")
            print(f"Filtered score at center: {filtered_sample}")
        except Exception as e:
            print(f"Could not sample scores: {e}")
            # Continue processing despite sampling error
        
        # More sensitive thresholding to catch real deforestation
        thresholded_change = filtered_score.gte(0.15).rename('thresholded_change')
        
        # Debug: Sample the threshold result
        try:
            threshold_sample = thresholded_change.sample(sample_point, 30).first().getInfo()
            print(f"Threshold result at center: {threshold_sample}")
        except Exception as e:
            print(f"Could not sample threshold: {e}")
        
        # Create change image with original bands
        try:
            # Use a more robust approach to check if RGB bands exist first
            has_rgb_bands = True
            for band in ['B4', 'B3', 'B2']:
                try:
                    # This will throw an error if any band is missing
                    before_image.select([band]).getInfo()
                    after_image.select([band]).getInfo()
                except:
                    has_rgb_bands = False
                    break
            
            if has_rgb_bands:
                print("Adding RGB bands to change image...")
                before_rgb = before_image.select(['B4', 'B3', 'B2']).rename(['B4_before', 'B3_before', 'B2_before'])
                after_rgb = after_image.select(['B4', 'B3', 'B2']).rename(['B4_after', 'B3_after', 'B2_after'])
                
                change_image = ee.Image.cat([
                    before_indices_renamed,
                    after_indices_renamed,
                    deforestation_score.rename('deforestation_score'),
                    filtered_score.rename('filtered_deforestation_score'),
                    thresholded_change,
                    before_rgb,
                    after_rgb
                ])
            else:
                print("RGB bands not available, excluding from change image...")
                change_image = ee.Image.cat([
                    before_indices_renamed,
                    after_indices_renamed,
                    deforestation_score.rename('deforestation_score'),
                    filtered_score.rename('filtered_deforestation_score'),
                    thresholded_change
                ])
        except Exception as e:
            print(f"WARNING: Error adding RGB bands to change image: {e}")
            # Fallback without RGB bands
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
        Includes robust band handling for harmonized bands.
        """
        print("Starting seasonal-aware deforestation detection with harmonized bands...")
        
        # First run the standard detection with the harmonized bands
        change_image = self.detect_change(before_image, after_image, aoi_geometry)
        
        # Check available bands and extract the appropriate score with thorough error handling
        try:
            # First try getting the band names directly
            try:
                available_bands = change_image.bandNames().getInfo()
                print(f"Available bands in change image: {available_bands}")
            except Exception as e:
                print(f"WARNING: Could not retrieve band names: {e}")
                # Continue anyway, we'll try to select specific bands
            
            # Try to get the filtered score, fall back to main score if needed
            deforestation_score = None
            
            # First try filtered_deforestation_score
            try:
                deforestation_score = change_image.select('filtered_deforestation_score')
                print("Using filtered_deforestation_score for seasonal adjustments")
            except Exception as e:
                print(f"Could not select filtered_deforestation_score: {e}")
            
            # If filtered score failed, try main score
            if deforestation_score is None:
                try:
                    deforestation_score = change_image.select('deforestation_score')
                    print("Using deforestation_score for seasonal adjustments")
                except Exception as e:
                    print(f"WARNING: Could not select deforestation_score: {e}")
                    print("Skipping seasonal filtering - no score band available")
                    return change_image
                
        except Exception as e:
            print(f"WARNING: Error checking available bands: {e}")
            # Try one last direct approach to get deforestation_score
            try:
                deforestation_score = change_image.select('deforestation_score')
            except:
                print("WARNING: Could not extract any score band, skipping seasonal filtering")
                return change_image
        
        # Apply month-aware seasonal filtering
        seasonally_adjusted_score = None
        try:
            seasonally_adjusted_score = self._apply_month_aware_filtering(
                deforestation_score, aoi_geometry, before_period, after_period
            )
            print("Applied month-aware seasonal filtering")
        except Exception as e:
            print(f"WARNING: Seasonal adjustment failed: {e}")
            return change_image
            
        # Only proceed if we have a valid seasonally adjusted score
        if seasonally_adjusted_score is not None:
            # Add the seasonally adjusted score as a new band (don't try to replace)
            try:
                updated_change_image = change_image.addBands(
                    seasonally_adjusted_score.rename('seasonally_filtered_deforestation_score')
                )
                
                # Try to update the main deforestation_score band for thresholding
                try:
                    updated_change_image = updated_change_image.addBands(
                        seasonally_adjusted_score.rename('deforestation_score'), 
                        ['deforestation_score'], 
                        True
                    )
                except Exception as e:
                    print(f"WARNING: Could not update main score band: {e}")
                    # Just add as new band
                    updated_change_image = updated_change_image.addBands(
                        seasonally_adjusted_score.rename('final_deforestation_score')
                    )
                
                print("Seasonal-aware deforestation detection completed")
                return updated_change_image
            except Exception as e:
                print(f"WARNING: Could not add seasonal bands: {e}")
                
        # Fallback to original change image if anything failed
        print("Using original change image without seasonal adjustment")
        return change_image

    def _calculate_vegetation_indices(self, image):
        """Calculate multiple vegetation indices for robust analysis with harmonized bands only"""
        print("DEBUG: Calculating vegetation indices with harmonized bands...")
        
        # Check available bands first to avoid errors
        try:
            available_bands = image.bandNames().getInfo()
            print(f"Available bands for index calculation: {available_bands}")
        except Exception as e:
            print(f"WARNING: Could not check available bands: {e}")
            available_bands = []
        
        # Define band mappings for robust index calculation
        # Use the harmonized band names that should be available
        band_map = {}
        for band in available_bands:
            if 'B2' in band or 'blue' in band.lower():
                band_map['BLUE'] = band
            elif 'B3' in band or 'green' in band.lower():
                band_map['GREEN'] = band
            elif 'B4' in band or 'red' in band.lower():
                band_map['RED'] = band
            elif 'B8' in band or 'nir' in band.lower():
                band_map['NIR'] = band
            elif 'B11' in band or 'swir1' in band.lower():
                band_map['SWIR1'] = band
            elif 'B12' in band or 'swir2' in band.lower():
                band_map['SWIR2'] = band
        
        print(f"DEBUG: Band mapping: {band_map}")
        
        # Get basic statistics to check if we have real data - Fixed geometry issue
        try:
            # Create a sample geometry for statistics (small buffer around image center)
            image_bounds = image.geometry()
            sample_point = image_bounds.centroid()
            sample_region = sample_point.buffer(1000)  # 1km buffer
            
            # Sample a few pixels to check if we have real data vs constants
            # Use available bands for sampling
            sample_bands = available_bands[:2] if len(available_bands) >= 2 else available_bands
            if sample_bands:
                sample_stats = image.select(sample_bands).reduceRegion(
                    reducer=ee.Reducer.minMax(),
                    geometry=sample_region,
                    scale=100,
                    maxPixels=1000
                ).getInfo()
                for band in sample_bands:
                    print(f"DEBUG: Sample {band} range: {sample_stats.get(f'{band}_min', 'N/A')} to {sample_stats.get(f'{band}_max', 'N/A')}")
            else:
                print(f"DEBUG: No bands available for sampling")
        except Exception as e:
            print(f"DEBUG: Could not get sample statistics: {e}")
        
        # NDVI - Standard vegetation index
        try:
            if 'NIR' in band_map and 'RED' in band_map:
                ndvi = image.normalizedDifference([band_map['NIR'], band_map['RED']]).rename('NDVI')
                print("DEBUG: NDVI calculation successful")
            else:
                print(f"WARNING: Cannot calculate NDVI - missing bands. Available: {list(band_map.keys())}")
                ndvi = ee.Image.constant(0).rename('NDVI')
        except Exception as e:
            print(f"WARNING: Could not calculate NDVI: {e}")
            ndvi = ee.Image.constant(0).rename('NDVI')
        
        # EVI - Enhanced Vegetation Index (less sensitive to atmospheric effects)
        try:
            if all(band in band_map for band in ['NIR', 'RED', 'BLUE']):
                evi = image.expression(
                    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
                        'NIR': image.select(band_map['NIR']),
                        'RED': image.select(band_map['RED']),
                        'BLUE': image.select(band_map['BLUE'])
                    }
                ).rename('EVI')
                print("DEBUG: EVI calculation successful")
            else:
                print(f"WARNING: Cannot calculate EVI - missing bands. Available: {list(band_map.keys())}")
                evi = ee.Image.constant(0).rename('EVI')
        except Exception as e:
            print(f"WARNING: Could not calculate EVI: {e}")
            evi = ee.Image.constant(0).rename('EVI')
        
        # SAVI - Soil Adjusted Vegetation Index (reduces soil brightness influence)
        try:
            if 'NIR' in band_map and 'RED' in band_map:
                savi = image.expression(
                    '((NIR - RED) / (NIR + RED + 0.5)) * (1 + 0.5)', {
                        'NIR': image.select(band_map['NIR']),
                        'RED': image.select(band_map['RED'])
                    }
                ).rename('SAVI')
                print("DEBUG: SAVI calculation successful")
            else:
                print(f"WARNING: Cannot calculate SAVI - missing bands. Available: {list(band_map.keys())}")
                savi = ee.Image.constant(0).rename('SAVI')
        except Exception as e:
            print(f"WARNING: Could not calculate SAVI: {e}")
            savi = ee.Image.constant(0).rename('SAVI')
        
        # NDMI - Normalized Difference Moisture Index (water content)
        try:
            if 'NIR' in band_map and 'SWIR1' in band_map:
                ndmi = image.normalizedDifference([band_map['NIR'], band_map['SWIR1']]).rename('NDMI')
                print("DEBUG: NDMI calculation successful")
            else:
                print(f"WARNING: Cannot calculate NDMI - missing bands. Available: {list(band_map.keys())}")
                ndmi = ee.Image.constant(0).rename('NDMI')
        except Exception as e:
            print(f"WARNING: Could not calculate NDMI: {e}")
            ndmi = ee.Image.constant(0).rename('NDMI')
        
        # NBR - Normalized Burn Ratio (detects burned areas)
        try:
            if 'NIR' in band_map and 'SWIR2' in band_map:
                nbr = image.normalizedDifference([band_map['NIR'], band_map['SWIR2']]).rename('NBR')
                print("DEBUG: NBR calculation successful")
            else:
                print(f"WARNING: Cannot calculate NBR - missing bands. Available: {list(band_map.keys())}")
                nbr = ee.Image.constant(0).rename('NBR')
        except Exception as e:
            print(f"WARNING: Could not calculate NBR: {e}")
            nbr = ee.Image.constant(0).rename('NBR')
        
        indices_image = ee.Image.cat([ndvi, evi, savi, ndmi, nbr])
        
        # Debug: Check if we calculated meaningful indices - Fixed geometry issue
        try:
            # Create a sample geometry for NDVI statistics
            image_bounds = indices_image.geometry()
            sample_point = image_bounds.centroid()
            sample_region = sample_point.buffer(1000)  # 1km buffer
            
            indices_stats = indices_image.select('NDVI').reduceRegion(
                reducer=ee.Reducer.minMax(),
                geometry=sample_region,
                scale=100,
                maxPixels=1000
            ).getInfo()
            ndvi_min = indices_stats.get('NDVI_min', 'N/A')
            ndvi_max = indices_stats.get('NDVI_max', 'N/A')
            print(f"DEBUG: Calculated NDVI range: {ndvi_min} to {ndvi_max}")
            
            # Check if we have real variation vs constant values
            if isinstance(ndvi_min, (int, float)) and isinstance(ndvi_max, (int, float)):
                ndvi_range = abs(ndvi_max - ndvi_min)
                if ndvi_range < 0.01:
                    print(f"WARNING: Very low NDVI variation ({ndvi_range:.6f}) - may be using fallback constants")
                else:
                    print(f"DEBUG: Good NDVI variation detected ({ndvi_range:.3f})")
        except Exception as e:
            print(f"DEBUG: Could not check NDVI range: {e}")
        
        print("DEBUG: Completed vegetation index calculation")
        return indices_image
    
    def _calculate_primary_score(self, before_indices, after_indices):
        """Calculate primary deforestation score with more sensitive forest detection"""
        print("DEBUG: Starting enhanced primary score calculation...")
        
        # Calculate changes in each index
        ndvi_change = before_indices.select('NDVI').subtract(after_indices.select('NDVI'))
        evi_change = before_indices.select('EVI').subtract(after_indices.select('EVI'))
        ndmi_change = before_indices.select('NDMI').subtract(after_indices.select('NDMI'))
        nbr_change = before_indices.select('NBR').subtract(after_indices.select('NBR'))
        
        print("DEBUG: Calculated vegetation changes")
        
        # More sensitive forest-focused scoring approach
        # Use moderate multipliers to avoid saturation
        
        # NDVI change (primary indicator, but normalized by initial NDVI)
        ndvi_before = before_indices.select('NDVI')
        ndvi_after = after_indices.select('NDVI')
        
        # Simple absolute NDVI decrease (more straightforward)
        ndvi_decrease = ndvi_change.clamp(0, 1)  # Only positive changes (vegetation loss)
        
        # Multiple scoring approaches for different forest types - ENHANCED SENSITIVITY:
        
        # 1. Absolute NDVI loss (good for dense forest) - increased multiplier
        absolute_score = ndvi_decrease.multiply(3.0).clamp(0, 1)
        
        # 2. Relative NDVI loss (good for moderate vegetation) - increased multiplier
        relative_ndvi_change = ndvi_change.divide(ndvi_before.add(0.01)).clamp(0, 1)
        relative_score = relative_ndvi_change.multiply(2.0).clamp(0, 1)
        
        # 3. NDMI loss (moisture content, good for forests) - increased multiplier
        ndmi_score = ndmi_change.multiply(2.5).clamp(0, 1)
        
        # 4. NBR loss (burn ratio - good for detecting cleared areas) - increased multiplier
        nbr_score = nbr_change.multiply(2.2).clamp(0, 1)
        
        # 5. EVI loss (enhanced vegetation index) - increased multiplier
        evi_score = evi_change.multiply(1.5).clamp(0, 1)
        
        # Combine scores with weighted average, emphasizing multiple indices
        combined_score = absolute_score.multiply(0.3).add(
            relative_score.multiply(0.25)
        ).add(
            ndmi_score.multiply(0.2)
        ).add(
            nbr_score.multiply(0.15)
        ).add(
            evi_score.multiply(0.1)
        )
        
        # More lenient forest baseline requirement for Indian forests
        # Many Indian forests are degraded or have moderate NDVI
        forest_baseline = ndvi_before.gt(0.15).And(  # Even more lenient baseline - catch degraded forests
            ndvi_after.lt(ndvi_before)  # Ensure vegetation actually decreased
        )
        
        # Alternative scoring for areas with low baseline vegetation (degraded forests)
        # This catches deforestation in degraded forest areas
        low_vegetation_score = ndvi_decrease.multiply(3.5).clamp(0, 1)  # Even higher multiplier for sensitivity
        low_vegetation_baseline = ndvi_before.gt(0.05).And(ndvi_before.lte(0.3)).And(  # Degraded forest range
            ndvi_after.lt(ndvi_before)  # Must show vegetation decrease
        )
        
        # Emergency scoring for areas with very low/sparse vegetation
        # This handles mixed pixels or very degraded areas
        emergency_score = ndvi_change.multiply(4.5).clamp(0, 1)  # Even higher sensitivity
        emergency_baseline = ndvi_before.gt(-0.1).And(ndvi_before.lte(0.2)).And(  # Sparse vegetation
            ndvi_change.gt(0.08)  # Lower threshold for significant decrease
        )
        
        # Combine all scoring approaches, taking the maximum for sensitivity
        forest_score = combined_score.multiply(forest_baseline)
        degraded_forest_score = low_vegetation_score.multiply(low_vegetation_baseline)
        emergency_deforestation_score = emergency_score.multiply(emergency_baseline)
        
        # Debug fallback: if all baselines fail but we have some vegetation change, apply minimal scoring
        # This helps catch edge cases where the baselines are too restrictive
        any_baseline = forest_baseline.Or(low_vegetation_baseline).Or(emergency_baseline)
        fallback_score = ndvi_decrease.multiply(1.0).clamp(0, 0.3)  # Conservative fallback
        fallback_condition = any_baseline.Not().And(ndvi_change.gt(0.05))  # Some vegetation loss detected
        
        primary_score = forest_score.max(degraded_forest_score).max(emergency_deforestation_score)
        final_score = primary_score.max(fallback_score.multiply(fallback_condition)).clamp(0, 1)
        
        print("DEBUG: Completed enhanced primary score calculation")
        return final_score
    
    def _apply_false_positive_filters(self, score, before_indices, after_indices, aoi_geometry):
        """Enhanced false positive filtering based on recent research"""
        print("DEBUG: Starting enhanced false positive filtering with advanced techniques...")
        
        # Filter 1: Basic Vegetation Check - was there vegetation to lose?
        baseline_filter = self._vegetation_baseline_filter(before_indices)
        
        # Filter 2: Simple change direction check
        ndvi_before = before_indices.select('NDVI')
        ndvi_after = after_indices.select('NDVI')
        ndvi_decreased = ndvi_before.gt(ndvi_after)  # NDVI went down = potential deforestation
        
        # Filter 3: ENHANCED temporal consistency filtering
        temporal_filter = self._enhanced_temporal_filtering(before_indices, after_indices, aoi_geometry)
        
        # Filter 4: ENHANCED entropy-based texture filtering
        texture_filter = self._enhanced_texture_filtering(before_indices, after_indices)
        
        # Filter 5: CONSERVATIVE agricultural area detection (only penalize obvious agriculture)
        agricultural_filter = self._detect_agricultural_areas(before_indices, after_indices)
        
        # Filter 6: CONSERVATIVE forest signature analysis (mild penalties only)
        forest_signature_filter = self._forest_signature_analysis(before_indices, after_indices)
        
        # Filter 7: ENHANCED seasonal pattern analysis
        seasonal_filter = self._enhanced_seasonal_filtering(before_indices, after_indices)
        
        # Filter 8: NEW - Adaptive threshold based on local statistics
        adaptive_filter = self._adaptive_threshold_filtering(before_indices, after_indices, aoi_geometry)
        
        # Filter 9: NEW - Multi-scale spatial consistency
        spatial_filter = self._spatial_consistency_filtering(score, aoi_geometry)
        
        # Apply SOPHISTICATED contextual analysis for false positive reduction
        # This approach uses multiple indicators to distinguish real deforestation from artifacts
        
        # Access all required bands for comprehensive analysis
        ndvi_before = before_indices.select('NDVI')
        ndvi_after = after_indices.select('NDVI') 
        evi_before = before_indices.select('EVI')
        evi_after = after_indices.select('EVI')
        ndmi_before = before_indices.select('NDMI')
        ndmi_after = after_indices.select('NDMI')
        nbr_before = before_indices.select('NBR')
        nbr_after = after_indices.select('NBR')
        
        # 1. ULTRA-STABLE forest detection (very high confidence false positive)
        ultra_high_vegetation = ndvi_before.gt(0.75)  # Much higher threshold - only truly dense forest
        ultra_maintained_structure = nbr_before.gt(0.45).And(nbr_after.gt(0.4))  # Much stricter
        ultra_small_change = ndvi_before.subtract(ndvi_after).lt(0.1)  # Much smaller change allowed
        ultra_stable_moisture = ndmi_before.gt(0.2).And(ndmi_after.gt(0.15))  # Stricter moisture
        ultra_stable_forest = ultra_high_vegetation.And(ultra_maintained_structure) \
                             .And(ultra_small_change).And(ultra_stable_moisture)
        
        # 2. Enhanced stable forest detection (high confidence false positive) - STRICTER CRITERIA
        high_initial_vegetation = ndvi_before.gt(0.65)  # Much higher threshold - only dense forest
        maintained_forest_structure = nbr_before.gt(0.35).And(nbr_after.gt(0.3))  # Stricter structure
        small_ndvi_change = ndvi_before.subtract(ndvi_after).lt(0.15)  # Much smaller change allowed
        consistent_moisture = ndmi_before.gt(0.15).And(ndmi_after.gt(0.1))  # Stricter moisture requirements
        likely_stable_forest = high_initial_vegetation.And(maintained_forest_structure) \
                              .And(small_ndvi_change).And(consistent_moisture)
        
        # 3. STRICTER seasonal variation detection - only flag obvious seasonal patterns
        good_initial_vegetation = ndvi_before.gt(0.4)  # Higher threshold for seasonal detection
        seasonal_change_range = ndvi_before.subtract(ndvi_after).gte(0.1).And(ndvi_before.subtract(ndvi_after).lt(0.4))  # Narrower range for seasonal
        # Check if EVI change is proportionally smaller (seasonal indicator)
        evi_change = evi_before.subtract(evi_after)
        ndvi_change = ndvi_before.subtract(ndvi_after)
        # When NDVI/EVI ratio is high, it suggests seasonal rather than structural change
        seasonal_ratio_indicator = evi_change.divide(ndvi_change.add(0.01)).lt(2.0)  # Stricter ratio
        preserved_biomass = nbr_before.subtract(nbr_after).lt(0.3)  # Less biomass change allowed
        # Additional seasonal indicator: high remaining vegetation (not cleared)
        significant_vegetation_remains = ndvi_after.gt(0.3)  # Higher threshold for remaining vegetation
        
        # STRICTER seasonal detection - only catch obvious seasonal patterns
        obvious_seasonal = good_initial_vegetation.And(seasonal_change_range) \
                          .And(seasonal_ratio_indicator).And(preserved_biomass) \
                          .And(significant_vegetation_remains)
        
        # Combined seasonal detection - much more conservative
        likely_seasonal = obvious_seasonal
        
        # 3. Cloud/shadow artifact detection (uniform spectral dimming)
        # Cloud shadows affect all bands uniformly, not selectively like deforestation
        significant_ndvi_drop = ndvi_before.subtract(ndvi_after).gt(0.3)
        significant_evi_drop = evi_before.subtract(evi_after).gt(0.5)
        # Check if other indices also drop (indicating uniform dimming)
        moisture_also_drops = ndmi_before.subtract(ndmi_after).gt(0.1)
        uniform_spectral_change = significant_ndvi_drop.And(significant_evi_drop).And(moisture_also_drops)
        
        # 4. Real deforestation preservation (what we want to keep) - MORE SPECIFIC
        major_vegetation_loss = ndvi_before.subtract(ndvi_after).gt(0.35)  # Stricter threshold
        substantial_biomass_loss = nbr_before.subtract(nbr_after).gt(0.25)  # Slightly lower but still significant
        moisture_depletion = ndmi_before.subtract(ndmi_after).gt(0.15)     # Lowered threshold
        # Additional criterion: low remaining vegetation (real clearing)
        minimal_vegetation_remains = ndvi_after.lt(0.3)  # Little vegetation left
        # Strong deforestation signal requires either very high vegetation loss OR 
        # substantial loss in multiple indices with minimal remaining vegetation
        clear_deforestation_signal = major_vegetation_loss.Or(
            substantial_biomass_loss.And(moisture_depletion).And(minimal_vegetation_remains)
        )
        
        # REBALANCED penalty system - much more moderate to preserve real deforestation signals
        
        # Ultra-stable forest penalty - MODERATE (reduce but don't eliminate)
        ultra_stable_penalty = ultra_stable_forest.multiply(-0.6).add(1.0).clamp(0.4, 1.0)
        
        # Light penalties for less obvious false positives
        temporal_penalty = temporal_filter.gt(0.7).multiply(-0.15).add(1.0).clamp(0.85, 1.0)  # Much lighter
        texture_penalty = texture_filter.gt(0.7).multiply(-0.15).add(1.0).clamp(0.85, 1.0)   # Much lighter
        agricultural_penalty = agricultural_filter.gt(0.7).multiply(-0.25).add(1.0).clamp(0.75, 1.0)  # Lighter
        forest_penalty = forest_signature_filter.gt(0.7).multiply(-0.15).add(1.0).clamp(0.85, 1.0)  # Much lighter
        seasonal_penalty = seasonal_filter.gt(0.7).multiply(-0.15).add(1.0).clamp(0.85, 1.0)  # Much lighter
        
        # MODERATE penalties for clear false positive patterns - but preserve real deforestation
        stable_forest_penalty = likely_stable_forest.multiply(-0.5).add(1.0).clamp(0.5, 1.0)  # Much more moderate
        seasonal_variation_penalty = likely_seasonal.multiply(-0.4).add(1.0).clamp(0.6, 1.0)  # MUCH more moderate - was killing everything
        cloud_shadow_penalty = uniform_spectral_change.multiply(-0.7).add(1.0).clamp(0.3, 1.0)  # Moderate
        
        # STRONGER boost for clear deforestation signals (preserve real changes)
        deforestation_boost = clear_deforestation_signal.multiply(0.6).add(1.0).clamp(1.0, 1.6)  # Even stronger boost
        
        # STRONGER enhancement filters to boost real deforestation signals
        adaptive_boost = adaptive_filter.gt(0.7).multiply(0.25).add(1.0).clamp(1.0, 1.25)  # Stronger boost
        spatial_boost = spatial_filter.gt(0.7).multiply(0.25).add(1.0).clamp(1.0, 1.25)    # Stronger boost
        
        # Basic requirement: vegetation baseline and decrease
        basic_filter = baseline_filter.And(ndvi_decreased)
        
        # Apply ULTRA-AGGRESSIVE contextual filtering with strong deforestation signal preservation
        filtered_score = score.multiply(basic_filter) \
                            .multiply(ultra_stable_penalty) \
                            .multiply(temporal_penalty) \
                            .multiply(texture_penalty) \
                            .multiply(agricultural_penalty) \
                            .multiply(forest_penalty) \
                            .multiply(seasonal_penalty) \
                            .multiply(stable_forest_penalty) \
                            .multiply(seasonal_variation_penalty) \
                            .multiply(cloud_shadow_penalty) \
                            .multiply(deforestation_boost) \
                            .multiply(adaptive_boost) \
                            .multiply(spatial_boost)
        
        print("DEBUG: Completed enhanced false positive filtering with advanced techniques")
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
        """Enhanced baseline filter with balanced criteria for meaningful vegetation"""
        print("DEBUG: Applying enhanced vegetation baseline filter...")
        
        # Balanced baseline to detect meaningful vegetation while reducing false positives
        # Allow detection of degraded forests and sparse vegetation but filter obvious non-vegetation
        ndvi_threshold = 0.15   # Reasonable threshold for meaningful vegetation
        ndmi_threshold = -0.05  # Allow somewhat dry areas
        
        # Method 1: Meaningful vegetation (NDVI > 0.15)
        meaningful_vegetation = before_indices.select('NDVI').gt(ndvi_threshold)
        
        # Method 2: Forest-like characteristics (more permissive)
        forest_like_evi = before_indices.select('EVI').gt(0.08)
        forest_like_nbr = before_indices.select('NBR').gt(0.05)
        
        # Method 3: Exclude clearly non-vegetated areas
        not_water = before_indices.select('NDVI').gt(-0.4)  # Water exclusion
        not_bare_soil = before_indices.select('NDMI').gt(-0.25)  # Bare soil exclusion
        has_some_moisture = before_indices.select('NDMI').gt(ndmi_threshold)  # Some moisture
        
        # Combine methods: require meaningful vegetation AND some forest characteristics
        # Use OR logic to be more inclusive while still filtering obvious non-vegetation
        had_meaningful_vegetation = meaningful_vegetation.And(
            forest_like_evi.Or(forest_like_nbr)
        ).And(not_water).And(not_bare_soil).And(has_some_moisture)
        
        print("DEBUG: Completed enhanced vegetation baseline filter with balanced criteria")
        return had_meaningful_vegetation
    

    def _apply_seasonal_filtering(self, score_image, before_indices, after_indices, aoi_geometry):
        """
        Apply BALANCED seasonal change filtering to reduce false positives while preserving real signals.
        
        This function identifies and filters out changes that could be due to:
        - Agricultural crop cycles (harvest patterns)
        - Seasonal variations (deciduous cycles, phenology)
        - Natural vegetation fluctuations
        
        APPROACH: Balanced filtering based on research best practices to achieve 
        good false positive reduction while preserving real deforestation detection.
        """
        print("DEBUG: Applying balanced seasonal change filtering...")
        
        try:
            # Get basic vegetation metrics
            ndvi_before = before_indices.select('NDVI')
            ndvi_after = after_indices.select('NDVI')
            ndvi_change = ndvi_before.subtract(ndvi_after)
            
            # Get additional indices for more robust filtering
            evi_before = before_indices.select('EVI')
            evi_after = after_indices.select('EVI')
            evi_change = evi_before.subtract(evi_after)
            
            # VERY AGGRESSIVE filtering approach - filter any potential false positives
            
            # 1. Agricultural/crop harvest patterns (more aggressive)
            # Filter if ANY of these conditions suggest agriculture/crops:
            # - Low initial vegetation (crops, not forest)
            # - Moderate to complete vegetation removal
            # - Rapid change typical of harvest/management
            potential_agriculture = ndvi_before.lt(0.6).And(        # Broader range for crops
                ndvi_after.lt(0.25)                                # More generous removal threshold  
            ).And(ndvi_change.gt(0.4))                             # Lower change threshold
            
            # 2. Seasonal deciduous/phenological patterns (very aggressive)
            # Filter natural seasonal variation that could be deciduous forests or phenology
            # - Moderate initial vegetation (deciduous forest range)
            # - Partial vegetation loss (not complete clearing)
            # - Consistent change across indices
            seasonal_deciduous = ndvi_before.gt(0.3).And(ndvi_before.lt(0.8)).And(
                ndvi_after.gt(0.1).And(ndvi_after.lt(0.5))                          # Partial loss
            ).And(ndvi_change.gt(0.2).And(ndvi_change.lt(0.7))                     # Moderate change
            ).And(evi_change.gt(0.1).And(evi_change.lt(0.5)))                      # Consistent across indices
            
            # 3. Gradual/natural variation patterns
            # Filter changes that are too gradual to be mechanical deforestation
            # Real deforestation is usually rapid and complete
            gradual_change = ndvi_change.gt(0.15).And(ndvi_change.lt(0.5)).And(
                evi_change.gt(0.1).And(evi_change.lt(0.4))                          # Consistent but not extreme
            ).And(ndvi_before.gt(0.3))                                             # Had reasonable vegetation
            
            # 4. Inconsistent change patterns (sensor/atmospheric artifacts)
            # Filter changes where NDVI and EVI don't agree (likely artifacts)
            inconsistent_change = ndvi_change.gt(0.3).And(evi_change.lt(0.1)).Or(  # NDVI drops but EVI doesn't
                evi_change.gt(0.3).And(ndvi_change.lt(0.1))                       # EVI drops but NDVI doesn't
            )
            
            # 5. Water/cloud interference patterns (enhanced)
            # Areas that show impossible vegetation values
            impossible_change = ndvi_before.lt(-0.2).And(ndvi_after.gt(0.2)).Or(
                ndvi_before.gt(0.9).And(ndvi_after.gt(0.8))                        # Unrealistically high values
            )
            
            # 6. Edge/boundary effects
            # Filter very small isolated changes that are likely edge effects
            # This will be handled later in morphological filtering, but flag here too
            # (This is a placeholder - the actual edge filtering is done in filter_false_positives)
            
            # Combine ALL potential false positive indicators (VERY AGGRESSIVE)
            potential_false_positive = potential_agriculture.Or(seasonal_deciduous).Or(
                gradual_change).Or(inconsistent_change).Or(impossible_change)
            
            # Apply BALANCED filtering to preserve real signals while reducing false positives
            # Use research-based moderate reduction factors for seasonal patterns
            # Preserve strong signals that indicate real deforestation
            balanced_factor = potential_false_positive.multiply(-0.6).add(1.0).clamp(0.3, 1.0)
            
            # Apply the balanced seasonal filter
            filtered_score = score_image.multiply(balanced_factor)
            
            # Debug: Sample the filtering effects
            try:
                center_point = aoi_geometry.centroid()
                
                original_sample = score_image.sample(center_point, 30).first().getInfo()
                filtered_sample = filtered_score.sample(center_point, 30).first().getInfo()
                
                print(f"DEBUG: Balanced seasonal filter - Original score: {original_sample}")
                print(f"DEBUG: Balanced seasonal filter - Filtered score: {filtered_sample}")
                
            except Exception as e:
                print(f"DEBUG: Could not sample aggressive seasonal filtering: {e}")
            
            print("DEBUG: Completed balanced seasonal change filtering")
            return filtered_score
            
        except Exception as e:
            print(f"Warning: Balanced seasonal filtering failed: {e}")
            print("DEBUG: Returning original score without seasonal filtering")
            return score_image

    def _apply_month_aware_filtering(self, score_image, aoi_geometry, before_period, after_period):
        """
        Apply BALANCED month-aware filtering based on seasonal patterns and signal strength.
        
        This considers:
        - Monsoon season effects (June-September in India)
        - Winter deciduous cycles (December-February)
        - Spring growth periods (March-May)
        - Natural phenological cycles
        
        GOAL: Balance false positive reduction with preservation of real deforestation signals
        """
        try:
            print("DEBUG: Applying BALANCED month-aware seasonal filtering...")
            import datetime
            
            # Parse dates to determine seasons
            before_date = datetime.datetime.strptime(before_period['start'], '%Y-%m-%d')
            after_date = datetime.datetime.strptime(after_period['end'], '%Y-%m-%d')
            
            before_month = before_date.month
            after_month = after_date.month
            
            print(f"DEBUG: Before month: {before_month}, After month: {after_month}")
            
            # Define seasonal periods for India
            monsoon_months = [6, 7, 8, 9]  # June-September
            winter_months = [12, 1, 2]    # December-February  
            spring_months = [3, 4, 5]     # March-May
            
            # BALANCED seasonal adjustment factors based on research best practices
            seasonal_factor = 1.0
            
            # Apply moderate reductions for seasonal transitions while preserving strong signals
            if (before_month in winter_months and after_month in spring_months):
                seasonal_factor = 0.6  # Moderate reduction for winter->spring
                print(f"DEBUG: Applying moderate winter->spring filter (factor: {seasonal_factor})")
                
            elif (before_month in spring_months and after_month in monsoon_months):
                seasonal_factor = 0.6  # Moderate reduction for spring->monsoon
                print(f"DEBUG: Applying moderate spring->monsoon filter (factor: {seasonal_factor})")
                
            elif (before_month in monsoon_months and after_month in winter_months):
                seasonal_factor = 0.4  # More reduction for monsoon->winter (senescence)
                print(f"DEBUG: Applying moderate monsoon->winter filter (factor: {seasonal_factor})")
                
            elif before_month in winter_months and after_month in winter_months:
                seasonal_factor = 0.7  # Light reduction within dormant season
                print(f"DEBUG: Applying light dormant season filter (factor: {seasonal_factor})")
                
            elif before_month in monsoon_months and after_month in monsoon_months:
                seasonal_factor = 0.8  # Minimal reduction within monsoon season
                print(f"DEBUG: Applying minimal monsoon season filter (factor: {seasonal_factor})")
                
            elif before_month in spring_months and after_month in spring_months:
                seasonal_factor = 0.8  # Minimal reduction within spring growth season
                print(f"DEBUG: Applying minimal spring season filter (factor: {seasonal_factor})")
            
            # Additional balanced filtering for specific problematic month combinations
            # Use signal-strength aware filtering based on research best practices
            ultra_problematic_combinations = [
                (1, 7), (2, 8), (3, 9), (4, 9),    # Winter/spring to monsoon (dry to wet)
                (1, 6), (2, 7), (3, 8), (4, 8),    # More dry to wet combinations
                (12, 6), (12, 7), (12, 8), (11, 7), (11, 8), (11, 9)  # Late year to wet season
            ]
            
            if (before_month, after_month) in ultra_problematic_combinations:
                # Smart filtering: preserve strong signals (likely real change), filter weak ones
                try:
                    score_stats = score_image.reduceRegion(
                        reducer=ee.Reducer.mean(),
                        scale=100,
                        maxPixels=1000
                    ).getInfo()
                    avg_score = list(score_stats.values())[0] if score_stats and list(score_stats.values()) else 0
                    avg_score = avg_score or 0
                    print(f"DEBUG: Average score for smart filtering: {avg_score}")
                    
                    if avg_score > 0.6:  # Strong signal - likely real change
                        seasonal_factor = 0.8  # Minimal filtering to preserve real signals
                        print(f"DEBUG: Strong signal detected ({avg_score:.3f}), applying minimal seasonal filter (factor: {seasonal_factor})")
                    elif avg_score > 0.3:  # Medium signal
                        seasonal_factor = 0.5  # Moderate filtering
                        print(f"DEBUG: Medium signal detected ({avg_score:.3f}), applying moderate seasonal filter (factor: {seasonal_factor})")
                    else:  # Weak signal - likely false positive
                        seasonal_factor = 0.2  # More aggressive filtering for weak signals
                        print(f"DEBUG: Weak signal detected ({avg_score:.3f}), applying stronger seasonal filter (factor: {seasonal_factor})")
                except:
                    # Fallback to balanced approach if stats fail
                    seasonal_factor = 0.5
                    print(f"DEBUG: Could not get signal strength, applying balanced filter (factor: {seasonal_factor})")
            else:
                # Default balanced filtering for other combinations
                seasonal_factor = min(seasonal_factor, 0.7)
                print(f"DEBUG: Applying balanced filter for month combination (factor: {seasonal_factor})")
            
            # Additional filtering for other problematic month combinations
            # Use moderate, research-based filtering factors
            problematic_combinations = [
                (1, 3), (2, 4), (11, 1), (12, 2),  # Winter transitions
                (3, 6), (4, 7), (5, 8),            # Spring to monsoon
                (9, 12), (10, 1), (8, 11)          # Monsoon to winter
            ]
            
            if (before_month, after_month) in problematic_combinations:
                # Moderate filtering for these combinations, preserving strong signals
                try:
                    score_stats = score_image.reduceRegion(
                        reducer=ee.Reducer.mean(),
                        scale=100,
                        maxPixels=1000
                    ).getInfo()
                    avg_score = list(score_stats.values())[0] if score_stats and list(score_stats.values()) else 0
                    avg_score = avg_score or 0
                    
                    if avg_score > 0.5:  # Strong signal
                        seasonal_factor = min(seasonal_factor, 0.8)
                        print(f"DEBUG: Strong signal in problematic period ({avg_score:.3f}), applying light seasonal filter (factor: {seasonal_factor})")
                    else:  # Weak signal
                        seasonal_factor = min(seasonal_factor, 0.4)
                        print(f"DEBUG: Weak signal in problematic period ({avg_score:.3f}), applying moderate seasonal filter (factor: {seasonal_factor})")
                except:
                    seasonal_factor = min(seasonal_factor, 0.6)  # Balanced fallback
                    print(f"DEBUG: Could not assess signal strength, applying balanced filter (factor: {seasonal_factor})")
            
            # Apply seasonal adjustment
            adjusted_score = score_image.multiply(seasonal_factor)
            
            print(f"DEBUG: Balanced month-aware filtering applied - Before: {before_month}, After: {after_month}, Factor: {seasonal_factor}")
            return adjusted_score
            
        except Exception as e:
            print(f"Warning: Balanced month-aware filtering failed: {e}")
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
        """BALANCED post-processing false positive filtering for optimal detection performance"""
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
        
        # First create a binary mask from the score (BALANCED threshold)
        # Use moderate confidence threshold to balance detection and false positives
        binary_mask = change_image.select(score_band).gte(0.3)  # Balanced threshold
        
        # Remove isolated pixels (more aggressive - require larger connected areas)
        kernel = ee.Kernel.square(radius=2)  # 5x5 kernel instead of 3x3
        
        # Opening operation (erosion followed by dilation) on binary mask - more aggressive
        eroded = binary_mask.focal_min(kernel=kernel, iterations=2)  # 2 iterations instead of 1
        opened = eroded.focal_max(kernel=kernel, iterations=2)
        
        # Only keep changes larger than minimum area (much more aggressive)
        min_area_pixels = 25  # Minimum 25 pixels (roughly 2500 sq meters) instead of 9
        connected_pixels = opened.connectedPixelCount(maxSize=512)  # Increased search area
        size_filtered_mask = connected_pixels.gte(min_area_pixels)
        
        # Additional edge filtering - remove changes too close to boundaries
        # This helps eliminate edge effects that are common in seasonal variation
        buffered_aoi = aoi_geometry.buffer(-60)  # 60m buffer inward
        edge_mask = ee.Image.constant(1).clip(buffered_aoi).mask()
        
        # Combine size and edge filters
        combined_mask = size_filtered_mask.And(edge_mask)
        
        # Apply the VERY AGGRESSIVE filter to the original score
        size_filtered_score = change_image.select(score_band).updateMask(combined_mask)
        
        # Final aggressive threshold - only keep very high confidence detections
        final_threshold = 0.7  # Very high threshold for final output
        final_mask = size_filtered_score.gte(final_threshold)
        final_filtered_score = size_filtered_score.updateMask(final_mask)
        
        # Update the change image with the filtered result
        return change_image.addBands(final_filtered_score.rename('final_deforestation_score'), None, True)
    
    def _enhanced_temporal_filtering(self, before_indices, after_indices, aoi_geometry):
        """Enhanced temporal consistency filtering based on recent research"""
        try:
            ndvi_before = before_indices.select('NDVI')
            ndvi_after = after_indices.select('NDVI')
            evi_before = before_indices.select('EVI')
            evi_after = after_indices.select('EVI')
            
            # 1. Check for abrupt vs gradual change patterns
            ndvi_change = ndvi_before.subtract(ndvi_after)
            evi_change = evi_before.subtract(evi_after)
            
            # 2. Deforestation should show consistent change across indices
            consistent_change = ndvi_change.gt(0.2).And(evi_change.gt(0.1))
            
            # 3. Check for extreme changes that might be sensor artifacts
            extreme_change = ndvi_change.gt(0.8).Or(evi_change.gt(0.6))
            
            # 4. Temporal consistency score (higher = more likely false positive)
            consistency_score = consistent_change.multiply(0.2).add(extreme_change.multiply(0.8))
            
            return consistency_score.clamp(0, 1)
            
        except Exception as e:
            print(f"DEBUG: Enhanced temporal filtering failed: {e}")
            return ee.Image.constant(0)
    
    def _enhanced_texture_filtering(self, before_indices, after_indices):
        """Enhanced entropy-based texture filtering for natural forest detection"""
        try:
            ndvi_before = before_indices.select('NDVI')
            
            # 1. Calculate local texture using entropy
            # Convert NDVI to integer for entropy calculation
            ndvi_int = ndvi_before.multiply(100).add(100).int8()
            entropy = ndvi_int.entropy(ee.Kernel.square(3))
            
            # 2. Calculate local variance (another texture measure)
            variance = ndvi_before.reduceNeighborhood(
                reducer=ee.Reducer.variance(),
                kernel=ee.Kernel.square(3)
            )
            
            # 3. Natural forests have higher texture (entropy) and variance
            # Low texture might indicate agricultural areas or non-forest
            low_texture = entropy.lt(1.5).Or(variance.lt(0.01))
            
            # 4. Texture filter score (higher = more likely false positive)
            texture_score = low_texture.multiply(0.7)
            
            return texture_score.clamp(0, 1)
            
        except Exception as e:
            print(f"DEBUG: Enhanced texture filtering failed: {e}")
            return ee.Image.constant(0)
    
    def _enhanced_seasonal_filtering(self, before_indices, after_indices):
        """Enhanced seasonal pattern analysis to reduce false positives"""
        try:
            ndvi_before = before_indices.select('NDVI')
            ndvi_after = after_indices.select('NDVI')
            ndmi_before = before_indices.select('NDMI')
            ndmi_after = after_indices.select('NDMI')
            
            # 1. Check for seasonal vegetation patterns
            # Moderate NDVI drops might be seasonal
            moderate_drop = ndvi_before.subtract(ndvi_after).gt(0.2).And(
                ndvi_before.subtract(ndvi_after).lt(0.5)
            )
            
            # 2. Check moisture patterns - seasonal changes affect moisture differently
            moisture_change = ndmi_before.subtract(ndmi_after)
            seasonal_moisture = moisture_change.abs().lt(0.1)  # Little moisture change
            
            # 3. Remaining vegetation after change (seasonal changes leave some vegetation)
            some_vegetation_remains = ndvi_after.gt(0.2)
            
            # 4. Seasonal pattern score (higher = more likely seasonal/false positive)
            seasonal_score = moderate_drop.And(seasonal_moisture).And(some_vegetation_remains).multiply(0.8)
            
            return seasonal_score.clamp(0, 1)
            
        except Exception as e:
            print(f"DEBUG: Enhanced seasonal filtering failed: {e}")
            return ee.Image.constant(0)
    
    def _adaptive_threshold_filtering(self, before_indices, after_indices, aoi_geometry):
        """Adaptive threshold based on local statistics"""
        try:
            ndvi_before = before_indices.select('NDVI')
            ndvi_after = after_indices.select('NDVI')
            
            # 1. Calculate local mean and std of NDVI change
            ndvi_change = ndvi_before.subtract(ndvi_after)
            
            # 2. Local statistics in neighborhood
            local_mean = ndvi_change.reduceNeighborhood(
                reducer=ee.Reducer.mean(),
                kernel=ee.Kernel.circle(radius=2)
            )
            
            local_std = ndvi_change.reduceNeighborhood(
                reducer=ee.Reducer.stdDev(),
                kernel=ee.Kernel.circle(radius=2)
            )
            
            # 3. Adaptive threshold: mean + 1.5 * std
            adaptive_threshold = local_mean.add(local_std.multiply(1.5))
            
            # 4. Check if change exceeds adaptive threshold
            exceeds_adaptive = ndvi_change.gt(adaptive_threshold)
            
            # 5. Confidence score (higher = more confident detection)
            confidence_score = exceeds_adaptive.multiply(0.8)
            
            return confidence_score.clamp(0, 1)
            
        except Exception as e:
            print(f"DEBUG: Adaptive threshold filtering failed: {e}")
            return ee.Image.constant(0)
    
    def _spatial_consistency_filtering(self, score, aoi_geometry):
        """Multi-scale spatial consistency filtering"""
        try:
            # 1. Check consistency at different spatial scales
            # Small scale (3x3)
            small_scale_mean = score.reduceNeighborhood(
                reducer=ee.Reducer.mean(),
                kernel=ee.Kernel.square(radius=1)
            )
            
            # Medium scale (5x5)
            medium_scale_mean = score.reduceNeighborhood(
                reducer=ee.Reducer.mean(),
                kernel=ee.Kernel.square(radius=2)
            )
            
            # 2. Consistency across scales
            scale_consistency = small_scale_mean.subtract(medium_scale_mean).abs().lt(0.2)
            
            # 3. Local connectivity (connected component analysis)
            binary_score = score.gt(0.3)
            connected = binary_score.connectedPixelCount(maxSize=100)
            sufficient_connectivity = connected.gt(5)  # At least 5 connected pixels
            
            # 4. Spatial consistency score
            spatial_score = scale_consistency.And(sufficient_connectivity).multiply(0.7)
            
            return spatial_score.clamp(0, 1)
            
        except Exception as e:
            print(f"DEBUG: Spatial consistency filtering failed: {e}")
            return ee.Image.constant(0)
