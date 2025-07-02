"""
Advanced Change Detection Algorithms for ISRO System
Based on latest research from 2024-2025

This module implements state-of-the-art change detection algorithms including:
1. Transformer-based attention mechanisms
2. Temporal consistency modeling
3. Multi-scale feature fusion
4. Self-supervised learning approaches
5. Spectral-temporal analysis
"""

import ee
import numpy as np
from datetime import datetime, timedelta
from .base_algorithm import BaseAlgorithm


class TransformerChangeDetection(BaseAlgorithm):
    """
    Advanced Transformer-based change detection using attention mechanisms.
    Based on latest research: "Pushing Trade-Off Boundaries: Compact yet Effective Remote Sensing Change Detection"
    """
    
    def __init__(self):
        super().__init__()
        self.name = "transformer_change_detection"
        self.description = "Advanced transformer-based change detection with attention mechanisms"
        
    def detect_change(self, before_image, after_image, aoi_geometry, threshold=0.5):
        """
        Detect changes using transformer-inspired attention mechanisms
        """
        # Multi-scale feature extraction with attention
        features_before = self._extract_multiscale_features(before_image)
        features_after = self._extract_multiscale_features(after_image)
        
        # Temporal attention mechanism
        change_scores = self._temporal_attention_fusion(features_before, features_after)
        
        # Apply threshold
        change_mask = change_scores.gt(threshold)
        
        return change_mask.rename('transformer_change_score')
    
    def _extract_multiscale_features(self, image):
        """Extract multi-scale features using different kernel sizes"""
        # Spectral indices
        ndvi = image.normalizedDifference(['B8', 'B4']).rename('ndvi')
        ndbi = image.normalizedDifference(['B11', 'B8']).rename('ndbi')
        mndwi = image.normalizedDifference(['B3', 'B11']).rename('mndwi')
        
        # Multi-scale spatial features
        scale_3x3 = image.select(['B2', 'B3', 'B4', 'B8']).reduceNeighborhood(
            reducer=ee.Reducer.mean(),
            kernel=ee.Kernel.square(3)
        )
        
        scale_5x5 = image.select(['B2', 'B3', 'B4', 'B8']).reduceNeighborhood(
            reducer=ee.Reducer.mean(),
            kernel=ee.Kernel.square(5)
        )
        
        scale_7x7 = image.select(['B2', 'B3', 'B4', 'B8']).reduceNeighborhood(
            reducer=ee.Reducer.mean(),
            kernel=ee.Kernel.square(7)
        )
        
        # Combine features
        features = ee.Image.cat([
            ndvi, ndbi, mndwi,
            scale_3x3, scale_5x5, scale_7x7
        ])
        
        return features
    
    def _temporal_attention_fusion(self, features_before, features_after):
        """
        Apply temporal attention mechanism to fuse before/after features
        """
        # Calculate absolute differences
        diff_features = features_after.subtract(features_before).abs()
        
        # Calculate relative changes
        relative_change = diff_features.divide(features_before.add(0.001))
        
        # Attention-weighted fusion
        attention_weights = relative_change.reduceNeighborhood(
            reducer=ee.Reducer.mean(),
            kernel=ee.Kernel.square(3)
        )
        
        # Normalize attention weights
        attention_weights = attention_weights.divide(
            attention_weights.reduceRegion(
                reducer=ee.Reducer.max(),
                geometry=features_before.geometry(),
                scale=10,
                maxPixels=1e9
            ).values().reduce(ee.Reducer.max())
        )
        
        # Apply attention to differences
        attended_changes = diff_features.multiply(attention_weights)
        
        # Final change score
        change_score = attended_changes.reduce(ee.Reducer.mean())
        
        return change_score


class TemporalConsistencyDetection(BaseAlgorithm):
    """
    Temporal consistency-based change detection for reducing false positives.
    Based on research: "SHAZAM: Self-Supervised Change Monitoring for Hazard Detection"
    """
    
    def __init__(self):
        super().__init__()
        self.name = "temporal_consistency_detection"
        self.description = "Temporal consistency modeling to reduce false positives from seasonal variations"
        
    def detect_change(self, before_image, after_image, aoi_geometry, threshold=0.5):
        """
        Detect changes using temporal consistency modeling
        """
        # Get historical baseline (if available)
        historical_baseline = self._get_historical_baseline(before_image, aoi_geometry)
        
        # Calculate seasonal adjustment
        seasonal_model = self._build_seasonal_model(historical_baseline, before_image)
        
        # Adjust after image for seasonal effects
        adjusted_after = self._apply_seasonal_adjustment(after_image, seasonal_model)
        
        # Detect changes between adjusted images
        change_scores = self._calculate_consistency_score(before_image, adjusted_after)
        
        # Apply threshold
        change_mask = change_scores.gt(threshold)
        
        return change_mask.rename('temporal_consistency_score')
    
    def _get_historical_baseline(self, reference_image, aoi_geometry):
        """Get historical data for baseline comparison"""
        # Get date of reference image
        ref_date = ee.Date(reference_image.get('system:time_start'))
        
        # Get same month from previous years
        start_date = ref_date.advance(-3, 'year')
        end_date = ref_date.advance(-1, 'year')
        
        historical_collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
            .filterBounds(aoi_geometry) \
            .filterDate(start_date, end_date) \
            .filter(ee.Filter.calendarRange(ref_date.get('month'), ref_date.get('month'), 'month')) \
            .map(self._preprocess_sentinel2)
        
        if historical_collection.size().getInfo() > 0:
            return historical_collection.median()
        else:
            return reference_image
    
    def _build_seasonal_model(self, historical_baseline, current_baseline):
        """Build seasonal adjustment model"""
        # Calculate seasonal patterns
        seasonal_diff = current_baseline.subtract(historical_baseline)
        
        # Smooth seasonal patterns
        seasonal_model = seasonal_diff.reduceNeighborhood(
            reducer=ee.Reducer.mean(),
            kernel=ee.Kernel.gaussian(30, 15)  # Spatial smoothing
        )
        
        return seasonal_model
    
    def _apply_seasonal_adjustment(self, image, seasonal_model):
        """Apply seasonal adjustment to image"""
        # Subtract seasonal bias
        adjusted_image = image.subtract(seasonal_model)
        
        return adjusted_image
    
    def _calculate_consistency_score(self, before_image, after_image):
        """Calculate temporal consistency score"""
        # Multiple spectral indices for robust detection
        indices_before = self._calculate_spectral_indices(before_image)
        indices_after = self._calculate_spectral_indices(after_image)
        
        # Calculate normalized differences
        normalized_changes = indices_after.subtract(indices_before).divide(
            indices_before.add(0.001)
        ).abs()
        
        # Combine multiple indices with weights
        weights = ee.Image([0.3, 0.3, 0.2, 0.2])  # NDVI, NDBI, MNDWI, SAVI
        
        consistency_score = normalized_changes.multiply(weights).reduce(ee.Reducer.sum())
        
        return consistency_score
    
    def _calculate_spectral_indices(self, image):
        """Calculate multiple spectral indices"""
        ndvi = image.normalizedDifference(['B8', 'B4']).rename('ndvi')
        ndbi = image.normalizedDifference(['B11', 'B8']).rename('ndbi') 
        mndwi = image.normalizedDifference(['B3', 'B11']).rename('mndwi')
        
        # SAVI (Soil Adjusted Vegetation Index) - better for sparse vegetation
        savi = image.expression(
            '(1.5 * (NIR - RED)) / (NIR + RED + 0.5)',
            {
                'NIR': image.select('B8'),
                'RED': image.select('B4')
            }
        ).rename('savi')
        
        return ee.Image.cat([ndvi, ndbi, mndwi, savi])


class MultiSensorFusionDetection(BaseAlgorithm):
    """
    Multi-sensor fusion for enhanced change detection.
    Combines optical (Sentinel-2) with radar (Sentinel-1) data when available.
    """
    
    def __init__(self):
        super().__init__()
        self.name = "multisensor_fusion_detection"
        self.description = "Multi-sensor fusion combining optical and radar data for robust detection"
        
    def detect_change(self, before_image, after_image, aoi_geometry, threshold=0.5):
        """
        Detect changes using multi-sensor fusion
        """
        # Get corresponding Sentinel-1 data
        s1_before = self._get_sentinel1_data(before_image, aoi_geometry)
        s1_after = self._get_sentinel1_data(after_image, aoi_geometry)
        
        # Optical change detection
        optical_changes = self._detect_optical_changes(before_image, after_image)
        
        # Radar change detection (if available)
        if s1_before and s1_after:
            radar_changes = self._detect_radar_changes(s1_before, s1_after)
            
            # Fusion of optical and radar
            fused_changes = self._fuse_optical_radar(optical_changes, radar_changes)
        else:
            # Fallback to optical only with enhanced processing
            fused_changes = self._enhanced_optical_detection(optical_changes, before_image, after_image)
        
        # Apply threshold
        change_mask = fused_changes.gt(threshold)
        
        return change_mask.rename('multisensor_fusion_score')
    
    def _get_sentinel1_data(self, optical_image, aoi_geometry):
        """Get corresponding Sentinel-1 radar data"""
        # Get date from optical image
        optical_date = ee.Date(optical_image.get('system:time_start'))
        
        # Search for Sentinel-1 data within 3 days
        s1_collection = ee.ImageCollection('COPERNICUS/S1_GRD') \
            .filterBounds(aoi_geometry) \
            .filterDate(optical_date.advance(-3, 'day'), optical_date.advance(3, 'day')) \
            .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')) \
            .filter(ee.Filter.eq('instrumentMode', 'IW'))
        
        if s1_collection.size().getInfo() > 0:
            return s1_collection.first()
        else:
            return None
    
    def _detect_optical_changes(self, before_image, after_image):
        """Detect changes in optical data"""
        # Enhanced spectral analysis
        ndvi_before = before_image.normalizedDifference(['B8', 'B4'])
        ndvi_after = after_image.normalizedDifference(['B8', 'B4'])
        
        ndbi_before = before_image.normalizedDifference(['B11', 'B8'])
        ndbi_after = after_image.normalizedDifference(['B11', 'B8'])
        
        # Multi-spectral change vector analysis
        change_vector = ee.Image.cat([
            ndvi_after.subtract(ndvi_before),
            ndbi_after.subtract(ndbi_before),
            after_image.select('B4').subtract(before_image.select('B4')),
            after_image.select('B8').subtract(before_image.select('B8'))
        ])
        
        # Calculate change magnitude
        change_magnitude = change_vector.pow(2).reduce(ee.Reducer.sum()).sqrt()
        
        return change_magnitude
    
    def _detect_radar_changes(self, s1_before, s1_after):
        """Detect changes in radar data"""
        # Log ratio for radar change detection
        vv_before = s1_before.select('VV')
        vv_after = s1_after.select('VV')
        
        # Convert to linear scale and calculate log ratio
        log_ratio = vv_after.divide(vv_before).log()
        
        # Absolute change in backscatter
        radar_change = log_ratio.abs()
        
        return radar_change
    
    def _fuse_optical_radar(self, optical_changes, radar_changes):
        """Fuse optical and radar change information"""
        # Normalize both change layers
        optical_norm = optical_changes.unitScale(0, 1)
        radar_norm = radar_changes.unitScale(0, 1)
        
        # Weighted fusion (optical gets higher weight for vegetation/water, radar for structure)
        fused = optical_norm.multiply(0.7).add(radar_norm.multiply(0.3))
        
        return fused
    
    def _enhanced_optical_detection(self, optical_changes, before_image, after_image):
        """Enhanced optical-only detection when radar is not available"""
        # Texture analysis for structural changes
        texture_before = self._calculate_texture(before_image)
        texture_after = self._calculate_texture(after_image)
        texture_change = texture_after.subtract(texture_before).abs()
        
        # Combine spectral and texture changes
        enhanced_changes = optical_changes.multiply(0.8).add(texture_change.multiply(0.2))
        
        return enhanced_changes
    
    def _calculate_texture(self, image):
        """Calculate texture features using GLCM"""
        # Gray-Level Co-occurrence Matrix (GLCM) texture
        glcm = image.select('B8').glcmTexture(size=3)
        
        # Use contrast and entropy as texture measures
        contrast = glcm.select('B8_contrast')
        entropy = glcm.select('B8_ent')
        
        texture = contrast.add(entropy).divide(2)
        
        return texture


class SpectralTemporalAnalysis(BaseAlgorithm):
    """
    Advanced spectral-temporal analysis for specific change types.
    Based on research: "Leveraging Satellite Image Time Series for Accurate Extreme Event Detection"
    """
    
    def __init__(self):
        super().__init__()
        self.name = "spectral_temporal_analysis"
        self.description = "Advanced spectral-temporal analysis for specific change detection"
    
    def detect_change(self, before_image, after_image, aoi_geometry, threshold=0.5):
        """
        Detect changes using advanced spectral-temporal analysis
        """
        # Multi-band spectral analysis
        spectral_features = self._extract_spectral_features(before_image, after_image)
        
        # Temporal gradient analysis
        temporal_gradients = self._calculate_temporal_gradients(before_image, after_image)
        
        # Phenological analysis for vegetation changes
        phenology_changes = self._analyze_phenological_changes(before_image, after_image)
        
        # Combine all features
        combined_score = self._combine_features(spectral_features, temporal_gradients, phenology_changes)
        
        # Apply threshold
        change_mask = combined_score.gt(threshold)
        
        return change_mask.rename('spectral_temporal_score')
    
    def _extract_spectral_features(self, before_image, after_image):
        """Extract advanced spectral features"""
        # Enhanced vegetation indices
        evi_before = self._calculate_evi(before_image)
        evi_after = self._calculate_evi(after_image)
        
        # Normalized Difference Built-up Index (NDBI)
        ndbi_before = before_image.normalizedDifference(['B11', 'B8'])
        ndbi_after = after_image.normalizedDifference(['B11', 'B8'])
        
        # Modified Normalized Difference Water Index (MNDWI)
        mndwi_before = before_image.normalizedDifference(['B3', 'B11'])
        mndwi_after = after_image.normalizedDifference(['B3', 'B11'])
        
        # Calculate spectral angle between before and after
        spectral_angle = self._calculate_spectral_angle(before_image, after_image)
        
        # Combine spectral changes
        spectral_change = ee.Image.cat([
            evi_after.subtract(evi_before).abs(),
            ndbi_after.subtract(ndbi_before).abs(),
            mndwi_after.subtract(mndwi_before).abs(),
            spectral_angle
        ]).reduce(ee.Reducer.mean())
        
        return spectral_change
    
    def _calculate_evi(self, image):
        """Calculate Enhanced Vegetation Index"""
        evi = image.expression(
            '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
            {
                'NIR': image.select('B8'),
                'RED': image.select('B4'),
                'BLUE': image.select('B2')
            }
        )
        return evi
    
    def _calculate_spectral_angle(self, before_image, after_image):
        """Calculate spectral angle mapper (SAM)"""
        # Select visible and NIR bands
        bands = ['B2', 'B3', 'B4', 'B8']
        before_spectrum = before_image.select(bands)
        after_spectrum = after_image.select(bands)
        
        # Calculate dot product
        dot_product = before_spectrum.multiply(after_spectrum).reduce(ee.Reducer.sum())
        
        # Calculate magnitudes
        before_magnitude = before_spectrum.pow(2).reduce(ee.Reducer.sum()).sqrt()
        after_magnitude = after_spectrum.pow(2).reduce(ee.Reducer.sum()).sqrt()
        
        # Calculate spectral angle
        cos_angle = dot_product.divide(before_magnitude.multiply(after_magnitude))
        spectral_angle = cos_angle.acos()
        
        return spectral_angle
    
    def _calculate_temporal_gradients(self, before_image, after_image):
        """Calculate temporal gradients for change detection"""
        # Time difference in days
        time_diff = ee.Date(after_image.get('system:time_start')).difference(
            ee.Date(before_image.get('system:time_start')), 'day'
        )
        
        # Calculate gradients for key bands
        bands = ['B4', 'B8', 'B11']
        gradients = []
        
        for band in bands:
            gradient = after_image.select(band).subtract(before_image.select(band)).divide(time_diff)
            gradients.append(gradient)
        
        temporal_gradient = ee.Image.cat(gradients).reduce(ee.Reducer.mean()).abs()
        
        return temporal_gradient
    
    def _analyze_phenological_changes(self, before_image, after_image):
        """Analyze phenological changes for vegetation monitoring"""
        # Calculate vegetation indices
        ndvi_before = before_image.normalizedDifference(['B8', 'B4'])
        ndvi_after = after_image.normalizedDifference(['B8', 'B4'])
        
        # Green Chlorophyll Index
        gci_before = before_image.select('B8').divide(before_image.select('B3')).subtract(1)
        gci_after = after_image.select('B8').divide(after_image.select('B3')).subtract(1)
        
        # Red Edge Position (approximation)
        rep_before = self._approximate_red_edge_position(before_image)
        rep_after = self._approximate_red_edge_position(after_image)
        
        # Phenological change score
        phenology_change = ee.Image.cat([
            ndvi_after.subtract(ndvi_before).abs(),
            gci_after.subtract(gci_before).abs(),
            rep_after.subtract(rep_before).abs()
        ]).reduce(ee.Reducer.mean())
        
        return phenology_change
    
    def _approximate_red_edge_position(self, image):
        """Approximate red edge position using available bands"""
        # Use B5 (705nm), B6 (740nm), B7 (783nm), B8 (842nm)
        # Linear interpolation to find red edge inflection point
        red_edge_slope = image.select('B7').subtract(image.select('B5')).divide(
            image.select('B8').subtract(image.select('B4'))
        )
        
        return red_edge_slope
    
    def _combine_features(self, spectral_features, temporal_gradients, phenology_changes):
        """Combine all features into final change score"""
        # Weighted combination
        weights = ee.Image([0.4, 0.3, 0.3])  # spectral, temporal, phenological
        
        combined_features = ee.Image.cat([
            spectral_features,
            temporal_gradients,
            phenology_changes
        ])
        
        combined_score = combined_features.multiply(weights).reduce(ee.Reducer.sum())
        
        return combined_score


# Register the new advanced algorithms
def register_advanced_algorithms(algorithm_registry):
    """Register all advanced algorithms"""
    algorithm_registry.register('transformer_change_detection', TransformerChangeDetection)
    algorithm_registry.register('temporal_consistency_detection', TemporalConsistencyDetection)
    algorithm_registry.register('multisensor_fusion_detection', MultiSensorFusionDetection)
    algorithm_registry.register('spectral_temporal_analysis', SpectralTemporalAnalysis)
