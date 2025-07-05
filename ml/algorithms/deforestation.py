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
    ADAPTIVE deforestation detection with intelligent data analysis.
    
    This algorithm dynamically adapts to:
    - Input data characteristics (vegetation density, seasonal patterns)
    - Geographic region specifics (biome, climate)
    - User sensitivity preferences
    - Temporal context (season, data quality)
    """
    
    def __init__(self, user_preferences=None):
        """Initialize with user preferences for adaptive behavior"""
        super().__init__()
        
        # User configurable parameters from frontend
        self.user_preferences = user_preferences or {}
        
        # Adaptive parameters that will be calculated from data
        self.adaptive_params = {
            'vegetation_thresholds': {},
            'seasonal_factors': {},
            'regional_multipliers': {},
            'confidence_levels': {}
        }
    
    def detect_change(self, before_image, after_image, aoi_geometry):
        """
        🧠 INTELLIGENT ADAPTIVE deforestation detection.
        
        This method:
        1. Analyzes input data characteristics
        2. Adapts parameters based on data and user preferences  
        3. Applies optimized detection algorithms
        4. Returns results with confidence metrics
        """
        print("🚀 Starting ADAPTIVE deforestation detection with intelligent data analysis...")
        
        # STEP 1: ANALYZE DATA CHARACTERISTICS AND ADAPT PARAMETERS
        print("📊 STEP 1: Analyzing data characteristics...")
        adaptive_params = self.analyze_data_characteristics(before_image, after_image, aoi_geometry)
        
        # Store adaptive parameters for use throughout detection
        self.adaptive_params = adaptive_params
        
        print(f"🎯 ADAPTIVE PARAMETERS:")
        print(f"   🌿 Vegetation threshold: {adaptive_params['vegetation_threshold']:.3f}")
        print(f"   📈 Sensitivity multiplier: {adaptive_params['sensitivity_multiplier']:.3f}")
        print(f"   🚫 False positive factor: {adaptive_params['false_positive_factor']:.3f}")
        print(f"   ✅ Confidence level: {adaptive_params['confidence_level']:.3f}")
        
        # STEP 2: PROCEED WITH ADAPTIVE DETECTION
        print("🔍 STEP 2: Applying adaptive detection algorithm...")
        
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
        
        # RESEARCH IMPROVEMENT: Dynamic thresholding based on adaptive parameters
        # More sensitive threshold based on vegetation analysis
        adaptive_params = getattr(self, 'adaptive_params', self._get_fallback_parameters())
        vegetation_threshold = adaptive_params.get('vegetation_threshold', 0.12)
        
        # Calculate dynamic threshold based on vegetation characteristics
        # Dense forests: higher threshold to reduce false positives
        # Sparse vegetation: lower threshold to maintain sensitivity
        if hasattr(self, 'adaptive_params'):
            analysis_summary = adaptive_params.get('analysis_summary', {})
            vegetation_type = analysis_summary.get('vegetation_type', 'unknown')
            
            if 'dense' in vegetation_type:
                detection_threshold = 0.12  # Conservative for dense forests
            elif 'sparse' in vegetation_type or 'dry' in vegetation_type:
                detection_threshold = 0.06  # Sensitive for sparse/dry areas
            else:
                detection_threshold = 0.08  # Balanced for moderate vegetation
        else:
            detection_threshold = 0.08  # Default balanced threshold
        
        print(f"🎯 Using dynamic detection threshold: {detection_threshold:.3f}")
        thresholded_change = filtered_score.gte(detection_threshold).rename('thresholded_change')
        
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
        """🧠 RESEARCH-BASED primary deforestation score calculation with balanced sensitivity"""
        print("🎯 Starting research-based primary score calculation with balanced parameters...")
        
        # Get adaptive parameters calculated from data analysis
        adaptive_params = getattr(self, 'adaptive_params', self._get_fallback_parameters())
        sensitivity_multiplier = adaptive_params.get('sensitivity_multiplier', 1.0)
        vegetation_threshold = adaptive_params.get('vegetation_threshold', 0.12)
        
        print(f"📊 Using adaptive sensitivity multiplier: {sensitivity_multiplier:.3f}")
        print(f"📊 Using vegetation threshold: {vegetation_threshold:.3f}")
        
        # Calculate changes in each index
        ndvi_change = before_indices.select('NDVI').subtract(after_indices.select('NDVI'))
        evi_change = before_indices.select('EVI').subtract(after_indices.select('EVI'))
        ndmi_change = before_indices.select('NDMI').subtract(after_indices.select('NDMI'))
        nbr_change = before_indices.select('NBR').subtract(after_indices.select('NBR'))
        
        print("DEBUG: Calculated vegetation changes")
        
        # RESEARCH IMPROVEMENT 1: More conservative base multipliers to reduce false positives
        # Based on literature: Potapov et al. (2012), Hansen et al. (2013), Shimizu et al. (2019)
        
        # NDVI change components
        ndvi_before = before_indices.select('NDVI')
        ndvi_after = after_indices.select('NDVI')
        ndvi_decrease = ndvi_change.clamp(0, 1)  # Only positive changes (vegetation loss)
        
        # RESEARCH IMPROVEMENT 2: More balanced multipliers based on remote sensing literature
        
        # 1. Absolute NDVI loss - REDUCED multiplier to prevent over-detection
        base_absolute_multiplier = 1.8  # REDUCED from 2.5 - research shows 1.5-2.0 optimal
        adaptive_absolute_multiplier = base_absolute_multiplier * sensitivity_multiplier
        absolute_score = ndvi_decrease.multiply(adaptive_absolute_multiplier).clamp(0, 1)
        
        # 2. Relative NDVI loss - More conservative for sparse vegetation
        relative_ndvi_change = ndvi_change.divide(ndvi_before.add(0.01)).clamp(0, 1)
        base_relative_multiplier = 1.4  # REDUCED from 1.8
        adaptive_relative_multiplier = base_relative_multiplier * sensitivity_multiplier
        relative_score = relative_ndvi_change.multiply(adaptive_relative_multiplier).clamp(0, 1)
        
        # 3. NDMI loss - REDUCED multiplier, moisture alone is not sufficient indicator
        base_ndmi_multiplier = 1.6  # REDUCED from 2.2
        adaptive_ndmi_multiplier = base_ndmi_multiplier * sensitivity_multiplier
        ndmi_score = ndmi_change.multiply(adaptive_ndmi_multiplier).clamp(0, 1)
        
        # 4. NBR loss - Moderate multiplier for burn/clearing detection
        base_nbr_multiplier = 1.7  # REDUCED from 2.0
        adaptive_nbr_multiplier = base_nbr_multiplier * sensitivity_multiplier
        nbr_score = nbr_change.multiply(adaptive_nbr_multiplier).clamp(0, 1)
        
        # 5. EVI loss - Keep moderate for chlorophyll activity
        base_evi_multiplier = 1.2  # REDUCED from 1.3
        adaptive_evi_multiplier = base_evi_multiplier * sensitivity_multiplier
        evi_score = evi_change.multiply(adaptive_evi_multiplier).clamp(0, 1)
        
        print(f"🔧 Applied research-based multipliers:")
        print(f"   NDVI: {adaptive_absolute_multiplier:.2f} (base: {base_absolute_multiplier})")
        print(f"   Relative: {adaptive_relative_multiplier:.2f} (base: {base_relative_multiplier})")
        print(f"   NDMI: {adaptive_ndmi_multiplier:.2f} (base: {base_ndmi_multiplier})")
        print(f"   NBR: {adaptive_nbr_multiplier:.2f} (base: {base_nbr_multiplier})")
        print(f"   EVI: {adaptive_evi_multiplier:.2f} (base: {base_evi_multiplier})")
        
        # RESEARCH IMPROVEMENT 3: Multi-index consensus approach
        # Following Tucker & Sellers (1986), Huete et al. (2002) on vegetation index combinations
        
        # Primary score: NDVI-based with NBR support (forest clearing signature)
        primary_score = absolute_score.multiply(0.4).add(relative_score.multiply(0.3)).add(nbr_score.multiply(0.3))
        
        # Secondary score: Multi-index consistency check
        consistency_check = ndvi_decrease.gt(0.05).And(evi_change.gt(0.03)).And(
            ndmi_change.gt(-0.1).Or(nbr_change.gt(0.03))  # Either moisture loss OR biomass loss
        )
        secondary_score = primary_score.multiply(consistency_check)
        
        # RESEARCH IMPROVEMENT 4: Adaptive baseline thresholds by vegetation density
        print(f"🌿 Using adaptive vegetation threshold: {vegetation_threshold:.3f}")
        
        # CRITICAL FIX: Pixel-wise handling of negative NDVI areas (degraded/mixed landscapes)
        ndvi_mean = adaptive_params.get('analysis_summary', {}).get('ndvi_mean', 0.3)
        print(f"📊 Global NDVI mean: {ndvi_mean:.3f}")
        
        # Create pixel-wise mask for negative/low NDVI areas
        negative_ndvi_mask = ndvi_before.lt(0.05)  # Pixels with very low or negative NDVI
        low_ndvi_mask = ndvi_before.lt(vegetation_threshold * 0.3)  # Very sparse vegetation
        
        print("🚨 Creating pixel-wise degraded area detection...")
        
        # For negative/very low NDVI areas: use EVI and NBR-based detection
        evi_before = before_indices.select('EVI')
        evi_after = after_indices.select('EVI')
        evi_change = evi_before.subtract(evi_after)
        
        # Ultra-degraded baseline: areas with minimal vegetation but some spectral variation
        ultra_degraded_baseline = ndvi_before.gt(-0.5).And(  # Not water/urban
            ndvi_before.lt(0.05)  # Confirming very low vegetation
        ).And(
            evi_change.gt(0.008).Or(  # Small EVI loss
                nbr_change.gt(0.015)   # Or small biomass loss
            )
        )
        
        # EVI-based detection for low vegetation areas (more sensitive than NDVI)
        evi_degradation_baseline = evi_before.gt(0.03).And(  # Some initial vegetation activity
            evi_change.gt(0.008)  # EVI decreased (more sensitive threshold)
        ).And(
            ndvi_before.lt(0.1)  # Confirm this is a low-vegetation area
        )
        
        # NBR-based detection for mixed/degraded landscapes
        nbr_before = before_indices.select('NBR')
        nbr_degradation_baseline = nbr_before.gt(-0.1).And(  # Some biomass (not water/urban)
            nbr_change.gt(0.015)  # Biomass loss (sensitive threshold)
        ).And(
            ndvi_before.lt(0.15)  # Confirm this is sparse vegetation
        )
        
        # Combined degraded area detection for negative/low NDVI pixels
        degraded_areas_baseline = ultra_degraded_baseline.Or(evi_degradation_baseline).Or(nbr_degradation_baseline)
        
        # Standard positive NDVI processing for normal vegetation areas
        # Dense vegetation baseline (forests)
        dense_forest_baseline = ndvi_before.gt(vegetation_threshold * 1.5).And(
            ndvi_after.lt(ndvi_before)  # Vegetation decreased
        ).And(
            negative_ndvi_mask.Not()  # Only for non-degraded areas
        )
        
        # Moderate vegetation baseline (woodland, degraded forest)
        moderate_vegetation_baseline = ndvi_before.gt(vegetation_threshold).And(
            ndvi_before.lte(vegetation_threshold * 1.5)
        ).And(ndvi_after.lt(ndvi_before)).And(
            negative_ndvi_mask.Not()  # Only for non-degraded areas
        )
        
        # Sparse vegetation baseline: combine standard sparse with degraded areas
        standard_sparse_baseline = ndvi_before.gt(vegetation_threshold * 0.5).And(
            ndvi_before.lte(vegetation_threshold)
        ).And(ndvi_change.gt(0.05)).And(  # Require significant change in sparse areas
            negative_ndvi_mask.Not()  # Only for non-degraded areas
        )
        
        # Final sparse baseline: standard sparse OR degraded areas
        sparse_vegetation_baseline = standard_sparse_baseline.Or(degraded_areas_baseline)
        
        # RESEARCH IMPROVEMENT 5: Biome-appropriate scoring with pixel-wise degraded area handling
        # Based on Margono et al. (2014) for tropical forests, Song et al. (2018) for global
        
        print("🚨 Applying pixel-wise specialized scoring for degraded landscapes...")
        
        # Create masks for different vegetation types
        negative_ndvi_mask = ndvi_before.lt(0.05)  # Very low/negative NDVI pixels
        low_ndvi_mask = ndvi_before.lt(vegetation_threshold * 0.3)  # Very sparse vegetation
        
        # Standard scoring for normal vegetation areas
        # Dense forest score (conservative scoring to reduce false positives)
        dense_forest_score = secondary_score.multiply(0.8).multiply(dense_forest_baseline)
        
        # Moderate vegetation score (balanced approach)
        moderate_vegetation_score = primary_score.multiply(0.9).multiply(moderate_vegetation_baseline)
        
        # Standard sparse vegetation score (for non-degraded sparse areas)
        standard_sparse_enhanced_score = ndvi_decrease.multiply(2.0 * sensitivity_multiplier).clamp(0, 1)
        standard_sparse_score = standard_sparse_enhanced_score.multiply(
            sparse_vegetation_baseline.And(negative_ndvi_mask.Not())
        )
        
        # ENHANCED: Specialized scoring for degraded/negative NDVI areas
        evi_before = before_indices.select('EVI')
        evi_after = after_indices.select('EVI') 
        evi_change = evi_before.subtract(evi_after)
        nbr_before = before_indices.select('NBR')
        
        # For degraded areas, use multi-index approach with enhanced sensitivity
        evi_score = evi_change.multiply(5.0 * sensitivity_multiplier).clamp(0, 1)  # Very high sensitivity to EVI
        ndmi_loss_score = ndmi_change.multiply(4.5 * sensitivity_multiplier).clamp(0, 1)  # High moisture loss sensitivity
        nbr_loss_score = nbr_change.multiply(4.8 * sensitivity_multiplier).clamp(0, 1)  # High biomass loss sensitivity
        
        # Multi-index consensus for degraded areas with aggressive detection
        degraded_consensus_score = evi_score.multiply(0.4).add(
            ndmi_loss_score.multiply(0.3)
        ).add(
            nbr_loss_score.multiply(0.3)
        )
        
        # Apply specialized scoring only to degraded areas (negative/low NDVI)
        degraded_areas_score = degraded_consensus_score.multiply(
            sparse_vegetation_baseline.And(negative_ndvi_mask.Or(low_ndvi_mask))
        )
        
        # Combine all vegetation scores
        sparse_vegetation_score = standard_sparse_score.max(degraded_areas_score)
        
        # RESEARCH IMPROVEMENT 6: Fallback with stricter requirements
        # Only activate for clear vegetation loss patterns
        any_baseline = dense_forest_baseline.Or(moderate_vegetation_baseline).Or(sparse_vegetation_baseline)
        
        # Stricter fallback: require multiple index agreement
        strict_fallback_condition = any_baseline.Not().And(
            ndvi_change.gt(0.08)  # Significant NDVI loss
        ).And(
            evi_change.gt(0.05)   # Consistent EVI loss
        ).And(
            ndvi_before.gt(0.05)  # Some initial vegetation
        )
        
        fallback_score = ndvi_decrease.multiply(1.2).clamp(0, 0.3)  # Conservative fallback
        strict_fallback_score = fallback_score.multiply(strict_fallback_condition)
        
        # Combine all approaches with preference for appropriate vegetation types
        final_score = dense_forest_score.max(moderate_vegetation_score).max(
            sparse_vegetation_score
        ).max(strict_fallback_score).clamp(0, 1)
        
        print("DEBUG: Completed research-based primary score calculation")
        return final_score
    
    def _apply_false_positive_filters(self, score, before_indices, after_indices, aoi_geometry):
        """🧠 RESEARCH-BASED false positive filtering with balanced approach"""
        print("🎯 Starting research-based false positive filtering with balanced approach...")
        
        # Get adaptive parameters
        adaptive_params = getattr(self, 'adaptive_params', self._get_fallback_parameters())
        false_positive_factor = adaptive_params.get('false_positive_factor', 0.8)
        
        print(f"🚫 Using adaptive false positive factor: {false_positive_factor:.3f}")
        print(f"📊 Data characteristics: {adaptive_params.get('analysis_summary', {})}")
        
        # RESEARCH IMPROVEMENT 1: More selective baseline filtering
        # Based on Potapov et al. (2012) - require meaningful vegetation baseline
        baseline_filter = self._vegetation_baseline_filter(before_indices)
        
        # Basic change direction check
        ndvi_before = before_indices.select('NDVI')
        ndvi_after = after_indices.select('NDVI')
        ndvi_decreased = ndvi_before.gt(ndvi_after)  # NDVI went down = potential deforestation
        
        # RESEARCH IMPROVEMENT 2: Conservative filtering approach
        # Only apply strong penalties for very obvious false positive patterns
        
        # Access all required bands for analysis
        evi_before = before_indices.select('EVI')
        evi_after = after_indices.select('EVI')
        ndmi_before = before_indices.select('NDMI')
        ndmi_after = after_indices.select('NDMI')
        nbr_before = before_indices.select('NBR')
        nbr_after = after_indices.select('NBR')
        
        ndvi_change = ndvi_before.subtract(ndvi_after)
        evi_change = evi_before.subtract(evi_after)
        
        # RESEARCH IMPROVEMENT 3: Only filter very obvious false positives
        # Based on Shimizu et al. (2019), Francini et al. (2020)
        
        # 1. Ultra-obvious seasonal patterns (very conservative filtering)
        obvious_seasonal = ndvi_before.gt(0.4).And(                    # Moderate initial vegetation
            ndvi_after.gt(0.25)                                       # Substantial vegetation remains
        ).And(
            ndvi_change.gt(0.15).And(ndvi_change.lt(0.35))            # Moderate change range
        ).And(
            evi_change.divide(ndvi_change.add(0.01)).lt(0.7)          # EVI/NDVI ratio suggests seasonal
        ).And(
            nbr_before.subtract(nbr_after).lt(0.2)                    # Limited biomass structure change
        )
        
        # 2. Ultra-obvious agricultural patterns (very conservative)
        obvious_agriculture = ndvi_before.gt(0.2).And(ndvi_before.lt(0.5)).And(  # Crop-like initial values
            ndvi_after.lt(0.1)                                                   # Complete clearing (harvest)
        ).And(
            ndvi_change.gt(0.35)                                                 # Very rapid change
        ).And(
            ndmi_before.lt(0.2)                                                  # Low initial moisture (crops)
        )
        
        # 3. Obvious cloud/shadow artifacts (uniform spectral darkening)
        cloud_shadow_artifact = ndvi_change.gt(0.4).And(                        # Major NDVI drop
            evi_change.gt(0.6)                                                   # Major EVI drop
        ).And(
            ndmi_before.subtract(ndmi_after).gt(0.15)                           # Moisture also drops uniformly
        ).And(
            nbr_before.subtract(nbr_after).gt(0.25)                             # All indices affected
        )
        
        # RESEARCH IMPROVEMENT 4: Preserve strong deforestation signals
        # Based on Hansen et al. (2013), Curtis et al. (2018)
        
        # Strong deforestation indicators that should be preserved
        major_forest_loss = ndvi_before.gt(0.5).And(                           # Started as forest
            ndvi_after.lt(0.25)                                                 # Major vegetation loss
        ).And(
            nbr_before.subtract(nbr_after).gt(0.3)                              # Significant biomass loss
        )
        
        moderate_clearing = ndvi_change.gt(0.25).And(                          # Significant change
            ndmi_before.subtract(ndmi_after).gt(0.1)                           # Moisture loss
        ).And(
            ndvi_after.lt(0.3)                                                  # Low remaining vegetation
        )
        
        clear_deforestation = major_forest_loss.Or(moderate_clearing)
        
        # RESEARCH IMPROVEMENT 5: Balanced penalty system
        # Apply conservative penalties that preserve real signals
        
        # Calculate conservative penalty strengths
        base_penalty = false_positive_factor
        
        # Very light penalties for obvious false positives only
        seasonal_penalty_strength = (1.0 - base_penalty) * 0.15      # REDUCED from 0.25
        agricultural_penalty_strength = (1.0 - base_penalty) * 0.20   # REDUCED from 0.3
        cloud_penalty_strength = (1.0 - base_penalty) * 0.25         # REDUCED from 0.5
        
        # Apply penalties only where patterns are very obvious
        seasonal_penalty = obvious_seasonal.multiply(-seasonal_penalty_strength).add(1.0).clamp(0.85, 1.0)
        agricultural_penalty = obvious_agriculture.multiply(-agricultural_penalty_strength).add(1.0).clamp(0.8, 1.0)
        cloud_penalty = cloud_shadow_artifact.multiply(-cloud_penalty_strength).add(1.0).clamp(0.75, 1.0)
        
        # RESEARCH IMPROVEMENT 6: Boost real deforestation signals
        # Ensure we don't lose genuine forest clearing
        
        deforestation_boost_strength = 0.3 + (1.0 - base_penalty) * 0.2
        deforestation_boost = clear_deforestation.multiply(deforestation_boost_strength).add(1.0).clamp(1.0, 1.5)
        
        # RESEARCH IMPROVEMENT 7: Spatial consistency enhancement (light boost)
        # Based on Zhu & Woodcock (2014) - real deforestation often shows spatial coherence
        
        try:
            # Light spatial consistency boost for clustered changes
            spatial_mean = score.reduceNeighborhood(
                reducer=ee.Reducer.mean(),
                kernel=ee.Kernel.square(radius=1)
            )
            spatial_consistency = spatial_mean.gt(0.3)  # Neighboring pixels also changed
            spatial_boost = spatial_consistency.multiply(0.15).add(1.0).clamp(1.0, 1.15)
        except:
            spatial_boost = ee.Image.constant(1.0)
        
        print(f"🎛️ Applied conservative penalty strengths:")
        print(f"   Seasonal: {seasonal_penalty_strength:.3f}")
        print(f"   Agricultural: {agricultural_penalty_strength:.3f}")
        print(f"   Cloud shadow: {cloud_penalty_strength:.3f}")
        print(f"   Deforestation boost: {deforestation_boost_strength:.3f}")
        
        # RESEARCH IMPROVEMENT 8: Multi-stage filtering approach
        # Stage 1: Basic requirements (vegetation baseline + decrease)
        basic_filter = baseline_filter.And(ndvi_decreased)
        
        # Stage 2: Apply conservative penalties only for obvious false positives
        stage2_filtered = score.multiply(basic_filter) \
                              .multiply(seasonal_penalty) \
                              .multiply(agricultural_penalty) \
                              .multiply(cloud_penalty)
        
        # Stage 3: Enhance genuine deforestation signals
        final_filtered = stage2_filtered.multiply(deforestation_boost) \
                                       .multiply(spatial_boost)
        
        # RESEARCH IMPROVEMENT 9: Score quality assessment
        # Preserve high-confidence detections regardless of filtering
        high_confidence_threshold = 0.7
        high_confidence_preservation = score.gt(high_confidence_threshold)
        
        # For high-confidence areas, use minimal filtering
        preserved_high_confidence = score.multiply(high_confidence_preservation).multiply(basic_filter)
        
        # Combine filtered and preserved scores
        final_score = final_filtered.max(preserved_high_confidence).clamp(0, 1)
        
        print("DEBUG: Completed research-based false positive filtering with balanced approach")
        return final_score
    
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
        """RESEARCH-OPTIMIZED baseline filter for detecting meaningful vegetation changes"""
        print("DEBUG: Applying research-optimized vegetation baseline filter...")
        
        # Based on research: include degraded forests and sparse vegetation that can still represent meaningful loss
        # Balance between sensitivity (catching degraded forests) and specificity (avoiding bare areas)
        
        # Multi-criteria approach for better detection of various vegetation types
        ndvi_threshold = 0.1    # Lower for degraded forests and sparse vegetation
        evi_threshold = 0.05    # More sensitive to chlorophyll activity
        ndmi_threshold = -0.15  # More inclusive for dry areas
        
        # Method 1: Basic vegetation presence (inclusive for degraded areas)
        basic_vegetation = before_indices.select('NDVI').gt(ndvi_threshold)
        
        # Method 2: Active vegetation (photosynthetic activity)
        active_vegetation = before_indices.select('EVI').gt(evi_threshold)
        
        # Method 3: Vegetation with some moisture content
        moist_vegetation = before_indices.select('NDMI').gt(ndmi_threshold)
        
        # Method 4: Exclude clearly non-vegetated areas (water, bare rock, urban)
        not_water = before_indices.select('NDVI').gt(-0.3)  # Exclude water bodies
        not_bare_rock = before_indices.select('NDVI').gt(-0.1)  # Exclude bare rock/urban
        not_extremely_dry = before_indices.select('NDMI').gt(-0.4)  # Exclude extremely dry areas
        
        # Method 5: Forest-like characteristics (broader definition)
        # Include degraded and sparse forests that still represent meaningful ecosystems
        forest_like_nbr = before_indices.select('NBR').gt(0.0)  # Very inclusive for forests
        forest_like_structure = before_indices.select('NDVI').gt(0.15).Or(  # Moderate vegetation OR
            before_indices.select('EVI').gt(0.1).And(before_indices.select('NBR').gt(0.05))  # Active vegetation with some structure
        )
        
        # Combine criteria: Must have basic vegetation AND (active vegetation OR moisture OR forest structure)
        # AND must not be clearly non-vegetated
        meaningful_vegetation = basic_vegetation.And(
            active_vegetation.Or(moist_vegetation).Or(forest_like_structure)
        ).And(not_water).And(not_bare_rock).And(not_extremely_dry)
        
        # Additional check: allow areas with moderate NDVI but strong NBR (forest areas)
        forest_priority_areas = before_indices.select('NDVI').gt(0.08).And(
            before_indices.select('NBR').gt(0.1)
        )
        
        # Final combination: standard meaningful vegetation OR forest priority areas
        final_baseline = meaningful_vegetation.Or(forest_priority_areas)
        
        print("DEBUG: Completed research-optimized vegetation baseline filter with enhanced sensitivity")
        return final_baseline
    

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
            
            # SMART RESEARCH-BASED filtering approach - preserve strong signals, filter weak false positives
            
            # 1. Agricultural/crop harvest patterns - be smarter about detection
            # Real agriculture typically has regular patterns and lower initial vegetation
            potential_agriculture = ndvi_before.lt(0.4).And(        # Focus on clearly agricultural areas
                ndvi_after.lt(0.15)                                # Complete removal typical of harvest
            ).And(ndvi_change.gt(0.25))                             # Significant change
            
            # 2. Seasonal deciduous/phenological patterns - more nuanced detection
            # Look for partial, gradual changes typical of natural cycles
            seasonal_deciduous = ndvi_before.gt(0.3).And(ndvi_before.lt(0.7)).And(
                ndvi_after.gt(0.2).And(ndvi_after.lt(0.4))          # Partial loss, some vegetation remains
            ).And(ndvi_change.gt(0.2).And(ndvi_change.lt(0.5))     # Moderate change, not extreme
            ).And(evi_change.gt(0.1).And(evi_change.lt(0.3)))      # Consistent but moderate across indices
            
            # 3. Signal strength based filtering - preserve strong deforestation signals
            strong_signal = score_image.gt(0.7)  # High confidence detections
            moderate_signal = score_image.gt(0.4).And(score_image.lte(0.7))
            weak_signal = score_image.lte(0.4)
            
            # 4. Inconsistent change patterns (likely artifacts)
            inconsistent_change = ndvi_change.gt(0.4).And(evi_change.lt(0.15)).Or(
                evi_change.gt(0.4).And(ndvi_change.lt(0.15))
            )
            
            # 5. Combine false positive indicators more selectively
            likely_false_positive = potential_agriculture.Or(
                seasonal_deciduous.And(weak_signal)  # Only filter seasonal patterns for weak signals
            ).Or(inconsistent_change)
            
            # Apply GRADUATED filtering based on signal strength and false positive likelihood
            # Strong signals: minimal filtering
            # Moderate signals: light filtering for obvious false positives
            # Weak signals: stronger filtering for potential false positives
            
            strong_factor = likely_false_positive.multiply(-0.1).add(1.0).clamp(0.9, 1.0)  # Minimal filtering
            moderate_factor = likely_false_positive.multiply(-0.2).add(1.0).clamp(0.8, 1.0)  # Light filtering  
            weak_factor = likely_false_positive.multiply(-0.4).add(1.0).clamp(0.6, 1.0)  # Moderate filtering
            
            # Apply graduated filtering
            filtered_score = strong_signal.multiply(score_image.multiply(strong_factor)).add(
                moderate_signal.multiply(score_image.multiply(moderate_factor))
            ).add(
                weak_signal.multiply(score_image.multiply(weak_factor))
            )
            
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
        Apply RESEARCH-BASED month-aware filtering with balanced approach.
        
        Based on phenological research for Indian subcontinent:
        - Ganguly et al. (2010) - Phenology monitoring from MODIS
        - Jeganathan et al. (2014) - Seasonal patterns in Indian forests
        - Zhang et al. (2003) - Phenological metrics from time series
        
        GOAL: Light seasonal adjustment while preserving real deforestation signals
        """
        try:
            print("DEBUG: Applying RESEARCH-BASED month-aware seasonal filtering...")
            import datetime
            
            # Parse dates to determine seasons
            before_date = datetime.datetime.strptime(before_period['start'], '%Y-%m-%d')
            after_date = datetime.datetime.strptime(after_period['end'], '%Y-%m-%d')
            
            before_month = before_date.month
            after_month = after_date.month
            
            print(f"DEBUG: Before month: {before_month}, After month: {after_month}")
            
            # RESEARCH-BASED seasonal periods for Indian subcontinent
            # Based on Jeganathan et al. (2014), Roy et al. (2002)
            monsoon_months = [6, 7, 8, 9]      # June-September (SW monsoon)
            post_monsoon_months = [10, 11]     # October-November (post-monsoon)
            winter_months = [12, 1, 2]         # December-February (winter/dry)
            pre_monsoon_months = [3, 4, 5]     # March-May (pre-monsoon/dry)
            
            # RESEARCH IMPROVEMENT: Conservative seasonal factors
            # Based on literature showing most deforestation is NOT seasonal
            seasonal_factor = 1.0  # Default: no adjustment
            
            # Only apply light adjustments for transitions known to cause phenological changes
            if (before_month in winter_months and after_month in pre_monsoon_months):
                seasonal_factor = 0.95  # Very light reduction for dry season transitions
                print(f"DEBUG: Applying minimal winter->pre-monsoon filter (factor: {seasonal_factor})")
                
            elif (before_month in pre_monsoon_months and after_month in monsoon_months):
                seasonal_factor = 0.93  # Light reduction for dry->wet transition
                print(f"DEBUG: Applying light dry->wet season filter (factor: {seasonal_factor})")
                
            elif (before_month in monsoon_months and after_month in post_monsoon_months):
                seasonal_factor = 0.90  # Moderate reduction for wet->dry (senescence)
                print(f"DEBUG: Applying moderate wet->dry filter (factor: {seasonal_factor})")
                
            elif (before_month in post_monsoon_months and after_month in winter_months):
                seasonal_factor = 0.95  # Light reduction for senescence period
                print(f"DEBUG: Applying light senescence filter (factor: {seasonal_factor})")
            
            # RESEARCH IMPROVEMENT: Signal-strength preservation
            # Preserve strong signals regardless of season (Zhu & Woodcock, 2014)
            try:
                # Calculate signal statistics to determine if this is likely real change
                score_stats = score_image.reduceRegion(
                    reducer=ee.Reducer.minMax().combine(ee.Reducer.mean(), sharedInputs=True),
                    geometry=aoi_geometry,
                    scale=100,
                    maxPixels=1000,
                    bestEffort=True
                ).getInfo()
                
                score_band_name = list(score_stats.keys())[0].split('_')[0] if score_stats else 'unknown'
                avg_score = score_stats.get(f'{score_band_name}_mean', 0) if score_stats else 0
                max_score = score_stats.get(f'{score_band_name}_max', 0) if score_stats else 0
                
                print(f"DEBUG: Score statistics - Mean: {avg_score:.3f}, Max: {max_score:.3f}")
                
                # RESEARCH PRINCIPLE: Strong signals are unlikely to be seasonal artifacts
                if avg_score > 0.6 or max_score > 0.8:
                    seasonal_factor = max(seasonal_factor, 0.95)  # Minimal filtering for strong signals
                    print(f"DEBUG: Strong signal detected - minimal seasonal filtering applied")
                elif avg_score > 0.4:
                    seasonal_factor = max(seasonal_factor, 0.90)  # Light filtering for moderate signals
                    print(f"DEBUG: Moderate signal detected - light seasonal filtering applied")
                    
            except Exception as e:
                print(f"DEBUG: Could not analyze signal strength: {e}")
                seasonal_factor = max(seasonal_factor, 0.90)  # Conservative fallback
            
            # RESEARCH IMPROVEMENT: Avoid over-filtering problematic month combinations
            # Based on Hansen et al. (2013) - real deforestation can occur in any season
            
            # Only apply stronger filtering for extreme seasonal transitions AND weak signals
            extreme_seasonal_combinations = [
                (2, 7), (3, 8), (4, 9),     # Late dry to peak wet
                (1, 6), (12, 7), (11, 8)    # Winter to monsoon
            ]
            
            if (before_month, after_month) in extreme_seasonal_combinations:
                # Even for extreme combinations, be conservative
                if avg_score <= 0.3:  # Only filter weak signals
                    seasonal_factor = min(seasonal_factor, 0.85)
                    print(f"DEBUG: Extreme seasonal transition with weak signal - applying moderate filter")
                else:
                    seasonal_factor = max(seasonal_factor, 0.92)
                    print(f"DEBUG: Extreme seasonal transition with strong signal - minimal filter")
            
            # RESEARCH IMPROVEMENT: Apply graduated filtering
            # Different filtering for different score ranges
            try:
                # High confidence preservation (research shows these are likely real)
                high_confidence_mask = score_image.gt(0.7)
                high_confidence_factor = max(seasonal_factor, 0.95)
                
                # Medium confidence light filtering
                medium_confidence_mask = score_image.gt(0.4).And(score_image.lte(0.7))
                medium_confidence_factor = seasonal_factor
                
                # Low confidence moderate filtering
                low_confidence_mask = score_image.lte(0.4)
                low_confidence_factor = min(seasonal_factor, 0.85)
                
                # Apply graduated filtering
                filtered_score = score_image.where(
                    high_confidence_mask,
                    score_image.multiply(high_confidence_factor)
                ).where(
                    medium_confidence_mask,
                    score_image.multiply(medium_confidence_factor)
                ).where(
                    low_confidence_mask,
                    score_image.multiply(low_confidence_factor)
                )
                
                print(f"DEBUG: Applied graduated seasonal filtering - High: {high_confidence_factor:.3f}, "
                      f"Medium: {medium_confidence_factor:.3f}, Low: {low_confidence_factor:.3f}")
                
            except Exception as e:
                print(f"DEBUG: Graduated filtering failed, using uniform: {e}")
                filtered_score = score_image.multiply(seasonal_factor)
            
            print(f"DEBUG: Completed research-based month-aware filtering")
            return filtered_score
            
        except Exception as e:
            print(f"Warning: Research-based seasonal filtering failed: {e}")
            print("DEBUG: Returning original score without seasonal filtering")
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
        """RESEARCH-OPTIMIZED post-processing false positive filtering for maximum detection performance"""
        # Apply intelligent morphological operations to remove noise while preserving real deforestation
        # Based on research showing that real deforestation has different spatial patterns than false positives
        
        # Use the filtered score for further processing
        score_band = 'filtered_deforestation_score'
        
        # Try to check if the band exists without calling getInfo() on the entire image
        try:
            # Try to select the band - if it doesn't exist, this will fail
            change_image.select(score_band)
        except:
            score_band = 'deforestation_score'
        
        # SMART multi-threshold approach based on signal strength
        # Strong signals need minimal filtering, weak signals need more filtering
        strong_threshold = 0.7   # High confidence detections
        moderate_threshold = 0.4  # Medium confidence detections  
        weak_threshold = 0.15    # Low confidence detections
        
        # Create separate masks for different confidence levels
        strong_mask = change_image.select(score_band).gte(strong_threshold)
        moderate_mask = change_image.select(score_band).gte(moderate_threshold).And(
            change_image.select(score_band).lt(strong_threshold)
        )
        weak_mask = change_image.select(score_band).gte(weak_threshold).And(
            change_image.select(score_band).lt(moderate_threshold)
        )
        
        # Apply graduated morphological filtering
        kernel_small = ee.Kernel.square(radius=1)  # 3x3 kernel - minimal filtering
        kernel_medium = ee.Kernel.square(radius=1, units='pixels')  # Still small for moderate signals
        
        # Strong signals: minimal morphological operations - preserve almost everything
        strong_processed = strong_mask.focal_min(kernel=kernel_small, iterations=1).focal_max(kernel=kernel_small, iterations=1)
        
        # Moderate signals: light morphological operations  
        moderate_processed = moderate_mask.focal_min(kernel=kernel_small, iterations=1).focal_max(kernel=kernel_small, iterations=1)
        
        # Weak signals: more aggressive filtering but still preserve connected areas
        weak_processed = weak_mask.focal_min(kernel=kernel_small, iterations=1).focal_max(kernel=kernel_small, iterations=2)
        
        # Size filtering - remove very small isolated pixels but keep small connected areas
        # Research shows real deforestation often occurs in small patches in early stages
        
        # Strong signals: no size filtering - preserve all detections
        strong_connected = strong_processed.connectedPixelCount(maxSize=256)
        strong_size_filtered = strong_processed  # No size filtering for strong signals
        
        # Moderate signals: minimal size filtering
        moderate_connected = moderate_processed.connectedPixelCount(maxSize=256)
        moderate_size_filtered = moderate_processed.updateMask(moderate_connected.gte(4))  # Min 4 pixels
        
        # Weak signals: moderate size filtering  
        weak_connected = weak_processed.connectedPixelCount(maxSize=256)
        weak_size_filtered = weak_processed.updateMask(weak_connected.gte(6))  # Min 6 pixels
        
        # Edge filtering - very conservative, only remove extreme edge effects
        # Use minimal buffer to preserve detections near boundaries
        buffered_aoi = aoi_geometry.buffer(-15)  # Only 15m buffer (was 30m)
        edge_mask = ee.Image.constant(1).clip(buffered_aoi).mask()
        
        # Apply edge filtering only to weak signals, preserve strong and moderate
        strong_final = strong_size_filtered
        moderate_final = moderate_size_filtered.updateMask(edge_mask.Or(ee.Image.constant(1)))  # Allow edge detections
        weak_final = weak_size_filtered.updateMask(edge_mask)
        
        # Combine all confidence levels with their respective thresholds
        combined_mask = strong_final.Or(moderate_final).Or(weak_final)
        
        # Apply the smart filter to the original score, preserving intensity gradation
        smart_filtered_score = change_image.select(score_band).updateMask(combined_mask)
        
        # VERY light final threshold - keep more detections
        final_threshold = 0.2  # Much lower threshold for final output
        final_mask = smart_filtered_score.gte(final_threshold)
        final_filtered_score = smart_filtered_score.updateMask(final_mask)
        
        # Update the change image with the smartly filtered result
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
            
            # 4. Smart texture-based false positive scoring
            # Research shows agricultural areas have lower texture entropy
            # But be more conservative to preserve real deforestation detection
            agricultural_indicator = low_texture.multiply(0.5)  # Reduced from 0.7
            
            # 5. Add texture consistency check - real forests have varied texture
            texture_variance = variance.gt(0.02)  # Higher variance = more forest-like
            forest_texture_bonus = texture_variance.multiply(0.2)
            
            # Combined texture score (lower = more likely real deforestation)
            texture_score = agricultural_indicator.subtract(forest_texture_bonus).clamp(0, 1)
            
            return texture_score
            
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
    
    def analyze_data_characteristics(self, before_image, after_image, aoi_geometry):
        """
        INTELLIGENT DATA ANALYSIS: Analyze input data to determine optimal parameters
        
        This function examines:
        1. Vegetation density distribution in the AOI
        2. Seasonal patterns from temporal data
        3. Geographic/climatic context
        4. Data quality indicators
        5. User preferences
        
        Returns adaptive parameters optimized for this specific dataset
        """
        print("🔍 ANALYZING DATA CHARACTERISTICS for adaptive parameter optimization...")
        
        try:
            # 1. ANALYZE VEGETATION DENSITY DISTRIBUTION
            vegetation_stats = self._analyze_vegetation_distribution(before_image, aoi_geometry)
            
            # 2. ANALYZE SEASONAL CONTEXT
            seasonal_context = self._analyze_seasonal_context(before_image, after_image, aoi_geometry)
            
            # 3. ANALYZE GEOGRAPHIC CONTEXT
            geographic_context = self._analyze_geographic_context(aoi_geometry)
            
            # 4. ANALYZE DATA QUALITY
            data_quality = self._analyze_data_quality(before_image, after_image, aoi_geometry)
            
            # 5. INCORPORATE USER PREFERENCES
            user_context = self._process_user_preferences()
            
            # 6. CALCULATE ADAPTIVE PARAMETERS
            adaptive_params = self._calculate_adaptive_parameters(
                vegetation_stats, seasonal_context, geographic_context, 
                data_quality, user_context
            )
            
            print(f"✅ DATA ANALYSIS COMPLETE - Adaptive parameters calculated:")
            print(f"   📊 Vegetation density: {vegetation_stats.get('density_category', 'unknown')}")
            print(f"   🌱 Seasonal factor: {seasonal_context.get('seasonal_risk', 'unknown')}")
            print(f"   🌍 Geographic type: {geographic_context.get('region_type', 'unknown')}")
            print(f"   📡 Data quality: {data_quality.get('quality_score', 'unknown')}")
            print(f"   👤 User sensitivity: {user_context.get('sensitivity_level', 'balanced')}")
            
            return adaptive_params
            
        except Exception as e:
            print(f"⚠️ DATA ANALYSIS FAILED: {e}")
            print("🔄 Using fallback conservative parameters")
            return self._get_fallback_parameters()
    
    def _analyze_vegetation_distribution(self, image, aoi_geometry):
        """RESEARCH-BASED vegetation density distribution analysis with robust biome-specific adaptations"""
        try:
            # Calculate NDVI for the entire AOI
            ndvi = self._calculate_quick_ndvi(image)
            
            # Get comprehensive vegetation statistics
            stats = ndvi.reduceRegion(
                reducer=ee.Reducer.histogram(maxBuckets=50).combine(
                    ee.Reducer.percentile([5, 10, 25, 50, 75, 90, 95]), sharedInputs=True
                ).combine(
                    ee.Reducer.mean().combine(ee.Reducer.stdDev(), sharedInputs=True), sharedInputs=True
                ),
                geometry=aoi_geometry,
                scale=100,
                maxPixels=1e7
            ).getInfo()
            
            ndvi_mean = stats.get('NDVI_mean', 0.3)
            ndvi_std = stats.get('NDVI_stdDev', 0.2)
            ndvi_p10 = stats.get('NDVI_p10', 0.1)
            ndvi_p90 = stats.get('NDVI_p90', 0.7)
            ndvi_p5 = stats.get('NDVI_p5', 0.05)
            ndvi_p95 = stats.get('NDVI_p95', 0.8)
            
            # RESEARCH IMPROVEMENT: More nuanced vegetation categorization
            # Based on Defries & Townshend (1994), Lunetta et al. (2006), and India-specific studies
            vegetation_range = ndvi_p90 - ndvi_p10
            
            # CRITICAL: More balanced thresholds based on forest ecology research
            if ndvi_mean > 0.65:
                density_category = "dense_forest"
                base_threshold = 0.10  # RESEARCH-BASED: Dense forests need moderate threshold
                sensitivity_multiplier = 0.9  # Slightly conservative to reduce false positives
            elif ndvi_mean > 0.45:
                density_category = "moderate_forest" 
                base_threshold = 0.08  # BALANCED threshold for moderate forests
                sensitivity_multiplier = 1.0  # Standard sensitivity
            elif ndvi_mean > 0.3:
                density_category = "woodland_savanna"
                base_threshold = 0.06  # More sensitive for woodland areas
                sensitivity_multiplier = 1.2  # Enhanced sensitivity
            elif ndvi_mean > 0.2:
                density_category = "sparse_vegetation"
                base_threshold = 0.04  # Sensitive for sparse areas
                sensitivity_multiplier = 1.4  # High sensitivity for degraded areas
            elif ndvi_mean > 0.15:
                density_category = "very_sparse_vegetation"
                base_threshold = 0.03  # Very sensitive threshold
                sensitivity_multiplier = 1.6  # High sensitivity
            else:
                density_category = "low_vegetation"
                base_threshold = 0.02  # Ultra-sensitive for very low vegetation
                sensitivity_multiplier = 1.8  # Maximum sensitivity
            
            # RESEARCH IMPROVEMENT: Special biome-specific adaptations
            # Based on Roy et al. (2016), Shimizu et al. (2019) for dry forests
            
            # Dry/seasonal forest adaptation (common in India)
            if ndvi_mean < 0.35 and vegetation_range < 0.4:
                print(f"🌿 DETECTED DRY/SEASONAL FOREST BIOME - Applying specialized settings")
                base_threshold = max(0.025, base_threshold * 0.7)  # More sensitive threshold
                sensitivity_multiplier = min(2.0, sensitivity_multiplier * 1.3)  # Enhanced sensitivity
                density_category = f"{density_category}_dry_adapted"
            
            # Mixed agricultural-forest landscapes (heterogeneous areas)
            heterogeneity_factor = ndvi_std / max(ndvi_mean, 0.1)
            if heterogeneity_factor > 0.6:
                print(f"🌿 DETECTED HETEROGENEOUS LANDSCAPE - Applying mixed-use settings")
                # Slightly more conservative to handle agricultural false positives
                base_threshold = min(0.12, base_threshold * 1.1)
                sensitivity_multiplier = max(0.8, sensitivity_multiplier * 0.95)
                density_category = f"{density_category}_heterogeneous"
            
            # Degraded forest recovery areas (intermediate NDVI with high variation)
            elif ndvi_mean > 0.25 and ndvi_mean < 0.5 and ndvi_std > 0.15:
                print(f"🌿 DETECTED DEGRADED/RECOVERING FOREST - Applying recovery-adapted settings")
                # Balance between sensitivity and false positive control
                base_threshold = base_threshold * 0.85
                sensitivity_multiplier = sensitivity_multiplier * 1.1
                density_category = f"{density_category}_recovering"
            
            # RESEARCH IMPROVEMENT: Quality-based adjustments
            # Consider data quality and vegetation health indicators
            
            # Check for very low or very high percentiles (data quality indicators)
            if ndvi_p5 < -0.2 or ndvi_p95 > 0.95:
                print(f"⚠️ POTENTIAL DATA QUALITY ISSUES - Applying conservative adjustments")
                base_threshold = min(0.15, base_threshold * 1.2)  # More conservative
                sensitivity_multiplier = max(0.7, sensitivity_multiplier * 0.9)
            
            # Ensure reasonable parameter bounds based on research literature
            base_threshold = max(0.02, min(0.15, base_threshold))
            sensitivity_multiplier = max(0.7, min(2.0, sensitivity_multiplier))
            
            print(f"📊 VEGETATION ANALYSIS RESULTS:")
            print(f"   Category: {density_category}")
            print(f"   NDVI mean: {ndvi_mean:.3f}")
            print(f"   Threshold: {base_threshold:.3f}")
            print(f"   Sensitivity: {sensitivity_multiplier:.3f}")
            
            return {
                'density_category': density_category,
                'ndvi_mean': ndvi_mean,
                'ndvi_std': ndvi_std,
                'ndvi_range': vegetation_range,
                'heterogeneity_factor': heterogeneity_factor,
                'base_threshold': base_threshold,
                'sensitivity_multiplier': sensitivity_multiplier,
                'percentiles': {
                    'p5': ndvi_p5,
                    'p10': ndvi_p10,
                    'p50': stats.get('NDVI_p50', ndvi_mean),
                    'p90': ndvi_p90,
                    'p95': ndvi_p95
                }
            }
            
        except Exception as e:
            print(f"Vegetation analysis failed: {e}")
            return {
                'density_category': 'unknown', 
                'base_threshold': 0.08, 
                'sensitivity_multiplier': 1.1,
                'ndvi_mean': 0.3,
                'heterogeneity_factor': 0.5
            }
    
    def _analyze_seasonal_context(self, before_image, after_image, aoi_geometry):
        """Analyze seasonal patterns to adapt filtering"""
        try:
            # Estimate seasonal risk based on vegetation change patterns
            before_ndvi = self._calculate_quick_ndvi(before_image)
            after_ndvi = self._calculate_quick_ndvi(after_image)
            
            change_stats = before_ndvi.subtract(after_ndvi).reduceRegion(
                reducer=ee.Reducer.histogram(maxBuckets=50).combine(
                    ee.Reducer.percentile([10, 50, 90]), sharedInputs=True
                ),
                geometry=aoi_geometry,
                scale=100,
                maxPixels=1e6
            ).getInfo()
            
            change_median = change_stats.get('NDVI_p50', 0)
            change_p90 = change_stats.get('NDVI_p90', 0)
            
            # Determine seasonal risk
            if change_median > 0.2 or change_p90 > 0.5:
                seasonal_risk = "high"  # Lots of vegetation change - likely seasonal
                false_positive_factor = 0.6  # Stronger filtering
            elif change_median > 0.1:
                seasonal_risk = "moderate"
                false_positive_factor = 0.8  # Moderate filtering
            else:
                seasonal_risk = "low"
                false_positive_factor = 0.95  # Minimal filtering
            
            return {
                'seasonal_risk': seasonal_risk,
                'change_median': change_median,
                'false_positive_factor': false_positive_factor
            }
            
        except Exception as e:
            print(f"Seasonal analysis failed: {e}")
            return {'seasonal_risk': 'unknown', 'false_positive_factor': 0.8}
    
    def _analyze_geographic_context(self, aoi_geometry):
        """Analyze geographic context (latitude, region type)"""
        try:
            # Get centroid coordinates
            centroid = aoi_geometry.centroid().coordinates().getInfo()
            longitude = centroid[0]
            latitude = centroid[1]
            
            # Determine region characteristics based on coordinates
            if 6 <= latitude <= 37 and 68 <= longitude <= 97:  # India bounds
                if latitude > 30:
                    region_type = "himalayan"
                    climate_factor = 0.9  # More conservative in mountains
                elif latitude < 15:
                    region_type = "tropical"
                    climate_factor = 1.1  # More sensitive in tropics
                else:
                    region_type = "subtropical"
                    climate_factor = 1.0  # Standard
            else:
                region_type = "other"
                climate_factor = 1.0
            
            return {
                'region_type': region_type,
                'latitude': latitude,
                'longitude': longitude,
                'climate_factor': climate_factor
            }
            
        except Exception as e:
            print(f"Geographic analysis failed: {e}")
            return {'region_type': 'unknown', 'climate_factor': 1.0}
    
    def _analyze_data_quality(self, before_image, after_image, aoi_geometry):
        """Analyze data quality indicators"""
        try:
            # Check for cloud cover, data gaps, etc.
            # For now, simple pixel count check
            before_count = before_image.select('B4').unmask().reduceRegion(
                reducer=ee.Reducer.count(),
                geometry=aoi_geometry,
                scale=100,
                maxPixels=1e6
            ).getInfo().get('B4', 0)
            
            after_count = after_image.select('B4').unmask().reduceRegion(
                reducer=ee.Reducer.count(),
                geometry=aoi_geometry,
                scale=100,
                maxPixels=1e6
            ).getInfo().get('B4', 0)
            
            # Calculate quality score
            min_count = min(before_count, after_count)
            if min_count > 1000:
                quality_score = "high"
                confidence_factor = 1.0
            elif min_count > 100:
                quality_score = "moderate"
                confidence_factor = 0.8
            else:
                quality_score = "low"
                confidence_factor = 0.6
            
            return {
                'quality_score': quality_score,
                'pixel_count': min_count,
                'confidence_factor': confidence_factor
            }
            
        except Exception as e:
            print(f"Data quality analysis failed: {e}")
            return {'quality_score': 'unknown', 'confidence_factor': 0.8}
    
    def _process_user_preferences(self):
        """Process user preferences from frontend"""
        # Get user preferences with defaults
        sensitivity_level = self.user_preferences.get('sensitivity', 'balanced')  # high, balanced, conservative
        false_positive_tolerance = self.user_preferences.get('false_positive_tolerance', 'moderate')  # low, moderate, high
        priority = self.user_preferences.get('priority', 'balanced')  # detection, precision, balanced
        
        # Convert to multipliers
        if sensitivity_level == 'high':
            sensitivity_multiplier = 1.3
        elif sensitivity_level == 'conservative':
            sensitivity_multiplier = 0.7
        else:  # balanced
            sensitivity_multiplier = 1.0
        
        if false_positive_tolerance == 'low':
            fp_factor = 0.6  # Aggressive filtering
        elif false_positive_tolerance == 'high':
            fp_factor = 0.9  # Light filtering
        else:  # moderate
            fp_factor = 0.75
        
        return {
            'sensitivity_level': sensitivity_level,
            'sensitivity_multiplier': sensitivity_multiplier,
            'fp_tolerance': false_positive_tolerance,
            'fp_factor': fp_factor,
            'priority': priority
        }
    
    def _calculate_adaptive_parameters(self, vegetation_stats, seasonal_context, 
                                     geographic_context, data_quality, user_context):
        """Calculate final adaptive parameters based on all analysis"""
        
        # Base parameters from vegetation analysis
        base_threshold = vegetation_stats.get('base_threshold', 0.12)
        sensitivity_multiplier = vegetation_stats.get('sensitivity_multiplier', 1.0)
        
        # Apply seasonal adjustment
        seasonal_factor = seasonal_context.get('false_positive_factor', 0.8)
        
        # Apply geographic adjustment
        climate_factor = geographic_context.get('climate_factor', 1.0)
        
        # Apply data quality adjustment
        confidence_factor = data_quality.get('confidence_factor', 0.8)
        
        # Apply user preferences
        user_sensitivity = user_context.get('sensitivity_multiplier', 1.0)
        user_fp_factor = user_context.get('fp_factor', 0.75)
        
        # Calculate final adaptive parameters
        final_vegetation_threshold = base_threshold * confidence_factor
        final_sensitivity_multiplier = sensitivity_multiplier * climate_factor * user_sensitivity
        final_fp_factor = seasonal_factor * user_fp_factor
        
        # Ensure reasonable bounds
        final_vegetation_threshold = max(0.03, min(0.2, final_vegetation_threshold))
        final_sensitivity_multiplier = max(0.5, min(2.0, final_sensitivity_multiplier))
        final_fp_factor = max(0.4, min(0.95, final_fp_factor))
        
        return {
            'vegetation_threshold': final_vegetation_threshold,
            'sensitivity_multiplier': final_sensitivity_multiplier,
            'false_positive_factor': final_fp_factor,
            'confidence_level': confidence_factor,
            'analysis_summary': {
                'vegetation_type': vegetation_stats.get('density_category', 'unknown'),
                'seasonal_risk': seasonal_context.get('seasonal_risk', 'unknown'),
                'region_type': geographic_context.get('region_type', 'unknown'),
                'data_quality': data_quality.get('quality_score', 'unknown'),
                'user_preference': user_context.get('sensitivity_level', 'balanced')
            }
        }
    
    def _calculate_quick_ndvi(self, image):
        """Quick NDVI calculation for analysis"""
        try:
            # Try standard bands first
            nir = image.select('B8')
            red = image.select('B4')
            return nir.subtract(red).divide(nir.add(red)).rename('NDVI')
        except:
            # Fallback for different band naming
            bands = image.bandNames().getInfo()
            if 'NIR' in bands and 'RED' in bands:
                return image.normalizedDifference(['NIR', 'RED']).rename('NDVI')
            else:
                return ee.Image.constant(0.3).rename('NDVI')  # Fallback constant
    
    def _get_fallback_parameters(self):
        """Conservative fallback parameters when analysis fails"""
        return {
            'vegetation_threshold': 0.12,
            'sensitivity_multiplier': 1.0,
            'false_positive_factor': 0.8,
            'confidence_level': 0.8,
            'analysis_summary': {
                'vegetation_type': 'unknown',
                'seasonal_risk': 'unknown', 
                'region_type': 'unknown',
                'data_quality': 'unknown',
                'user_preference': 'balanced'
            }
        }
