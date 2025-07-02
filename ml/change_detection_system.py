"""
ISRO Change Detection System - Core Processing Module

This module implements the core functionality of the change detection system,
making it easier to integrate with the Next.js backend or run as a separate microservice.

Based on the notebook implementation, this module provides a clean API for:
1. Processing AOIs for change detection
2. Registering custom algorithms
3. Generating alerts based on detected changes
"""

import os
import sys
import json
import datetime
import warnings
import numpy as np
import ee
# Import geemap optionally since it's not essential for core functionality
try:
    import geemap
    GEEMAP_AVAILABLE = True
except ImportError as e:
    print(f"Warning: geemap not available: {e}")
    print("Continuing without geemap - core functionality will still work")
    GEEMAP_AVAILABLE = False

try:
    import geopandas as gpd
    GEOPANDAS_AVAILABLE = True
except ImportError:
    print("Warning: geopandas not available - some features may be limited")
    GEOPANDAS_AVAILABLE = False

from typing import Dict, List, Tuple, Union, Optional, Any

# Suppress warnings
warnings.filterwarnings('ignore')

# Initialize Earth Engine
def initialize_earth_engine():
    """Initialize Earth Engine with project 'geeta-432119'."""
    try:
        # Initialize with the specified project
        ee.Initialize(project='geeta-432119')
        print("Earth Engine initialized successfully with project: geeta-432119")
    except Exception as e:
        print(f"Error initializing Earth Engine with project geeta-432119: {e}")
        print("Please ensure you have authenticated with Earth Engine and have access to project geeta-432119")
        print("Run: earthengine authenticate")
        raise RuntimeError("Failed to initialize Earth Engine")

# Initialize Earth Engine
initialize_earth_engine()


# Algorithm registry and base class
class AlgorithmRegistry:
    """Registry of change detection algorithms."""
    
    def __init__(self):
        self.algorithms = {}
    
    def register(self, name, algorithm_class):
        """Register a new algorithm."""
        self.algorithms[name] = algorithm_class
    
    def get_algorithm(self, name):
        """Get an algorithm by name."""
        if name not in self.algorithms:
            raise ValueError(f"Algorithm '{name}' not found in registry.")
        return self.algorithms[name]
    
    def list_algorithms(self):
        """List all registered algorithms."""
        return list(self.algorithms.keys())


# Base algorithm class
class ChangeDetectionAlgorithm:
    """Base class for change detection algorithms."""
    
    def __init__(self, config=None):
        self.config = config or {}
    
    def detect_change(self, before_image, after_image, aoi_geometry):
        """
        Detect changes between before and after images.
        
        Args:
            before_image: EE Image representing the before state
            after_image: EE Image representing the after state
            aoi_geometry: EE Geometry defining the area of interest
            
        Returns:
            EE Image with change detection results
        """
        raise NotImplementedError("Subclasses must implement detect_change()")
    
    def get_visualization_params(self):
        """Get visualization parameters for the change detection results."""
        raise NotImplementedError("Subclasses must implement get_visualization_params()")
    
    def get_threshold_range(self):
        """Get the valid range for thresholds for this algorithm."""
        return (0.1, 1.0)  # Default range
    
    def filter_false_positives(self, change_image, aoi_geometry):
        """
        Filter out false positives from change detection results.
        
        Args:
            change_image: EE Image with change detection results
            aoi_geometry: EE Geometry defining the area of interest
            
        Returns:
            Filtered EE Image with change detection results
        """
        return change_image  # Default: no filtering


# Create a global algorithm registry
algorithm_registry = AlgorithmRegistry()


# Main processing class
class ChangeDetectionSystem:
    """
    Main class for the change detection system.
    
    This class coordinates the entire process of:
    - Loading AOI data
    - Fetching satellite imagery
    - Applying change detection algorithms
    - Filtering false positives
    - Generating alerts
    """
    
    def __init__(self, config_path=None):
        """
        Initialize the change detection system.
        
        Args:
            config_path: Path to a configuration file (optional)
        """
        self.config_path = config_path
        self.config = self._load_config()
        
        # Load algorithms
        self._load_algorithms()
    
    def _load_config(self):
        """Load configuration from file or use defaults."""
        if not self.config_path:
            # Use default configuration
            return {
                "imagery": {
                    "source": "Sentinel-2",
                    "max_cloud_percentage": 20,
                    "baseline_months_back": 6,
                    "current_period_days": 90
                },
                "processing": {
                    "scale": 10,  # meters per pixel
                    "max_pixels": 1e9
                },
                "alerts": {
                    "severity_thresholds": {
                        "high": 20,  # % of AOI affected
                        "medium": 5
                    }
                }
            }
        
        # In a real implementation, we would load from the file
        # with open(self.config_path, 'r') as f:
        #     return json.load(f)
    
    def _load_algorithms(self):
        """Load and register change detection algorithms."""
        # Import algorithm classes
        try:
            # First try to import from our algorithms package (relative import)
            try:
                from .algorithms import (
                    DeforestationDetection,
                    UrbanDevelopmentDetection,
                    WaterBodyChangeDetection,
                    LandUseChangeDetection
                )
            except ImportError:
                # If relative import fails, try absolute import for direct execution
                import sys
                import os
                algorithms_path = os.path.join(os.path.dirname(__file__), 'algorithms')
                sys.path.insert(0, algorithms_path)
                
                from deforestation import DeforestationDetection
                from urban_development import UrbanDevelopmentDetection
                from water_body_change import WaterBodyChangeDetection
                from land_use_change import LandUseChangeDetection
            
            # Register with the global registry
            algorithm_registry.register('deforestation', DeforestationDetection)
            algorithm_registry.register('urban_development', UrbanDevelopmentDetection)
            algorithm_registry.register('water_body_change', WaterBodyChangeDetection)
            algorithm_registry.register('land_use_change', LandUseChangeDetection)
            
            # Try to load advanced algorithms
            try:
                from advanced_algorithms import (
                    TransformerChangeDetection,
                    TemporalConsistencyDetection, 
                    MultiSensorFusionDetection,
                    SpectralTemporalAnalysis,
                    register_advanced_algorithms
                )
                register_advanced_algorithms(algorithm_registry)
                print("Successfully loaded built-in and advanced algorithms")
            except ImportError as e:
                print(f"Advanced algorithms not available: {e}")
                print("Successfully loaded built-in algorithms")
        except ImportError as e:
            print(f"Warning: Could not load built-in algorithms: {e}")
            print("You may need to create the algorithm implementation files")
        
        # In a real implementation, we would also load custom algorithms
        # from configuration or database
    
    def process_aoi(self, aoi_data):
        """
        Process an AOI for change detection.
        
        Args:
            aoi_data: Dictionary containing AOI data with the following keys:
                - geometry: The GeoJSON geometry object
                - alertType: Type of change to detect
                - threshold: Confidence threshold (0.1 to 1.0)
                - aoi_id: ID of the AOI (optional)
                - user_id: ID of the user (optional)
        
        Returns:
            Dictionary containing detection results and alert data
        """
        # 1. Process AOI input
        processed_aoi = self._process_aoi_input(aoi_data)
        
        # 2. Fetch multi-temporal imagery
        imagery = self._prepare_multitemporal_imagery(processed_aoi)
        
        # 3. Apply cloud and shadow masking
        masked_imagery = self._apply_cloud_shadow_masking(imagery)
        
        # 4. Select the appropriate algorithm
        algorithm = self._select_change_detection_algorithm(processed_aoi['alert_type'])
        
        # 5. Apply the algorithm
        detection_results = self._detect_changes(
            masked_imagery, 
            algorithm, 
            processed_aoi['ee_geometry'], 
            processed_aoi['threshold']
        )
        
        # 6. Apply advanced false positive filtering
        filtered_results = self._apply_advanced_false_positive_filtering(detection_results)
        
        # 7. Generate change maps and alert data
        change_maps_and_alerts = self._generate_change_maps_and_alerts(
            filtered_results, 
            processed_aoi
        )
        
        # 8. Prepare exports (if needed)
        # In a real implementation, we might start export tasks here
        
        # Return the results
        return {
            'processed_aoi': processed_aoi,
            'detection_results': filtered_results,
            'alert_data': change_maps_and_alerts['alert_data'],
            'change_maps': change_maps_and_alerts['change_maps']
        }
    
    # Helper methods (implementations would be adapted from the notebook)
    def _process_aoi_input(self, aoi_data):
        """
        Process user's AOI input data.
        
        Args:
            aoi_data: Dictionary containing AOI data with the following keys:
                - geometry: The GeoJSON geometry object (Polygon, Circle, or Rectangle)
                - alertType: Type of change to detect
                - threshold: Confidence threshold (0.1 to 1.0)
                - customDates: Optional custom date range for monitoring
                - monitoringDates: Optional monitoring schedule with start/end dates
                - frequency: Optional monitoring frequency (continuous, daily, weekly)
        
        Returns:
            Processed AOI data ready for change detection
        """
        # Validate inputs
        required_keys = ['geometry', 'alertType', 'threshold']
        for key in required_keys:
            # Handle both camelCase and snake_case for compatibility
            if key not in aoi_data:
                snake_case_key = ''.join(['_' + c.lower() if c.isupper() else c for c in key]).lstrip('_')
                if snake_case_key not in aoi_data:
                    raise ValueError(f"Missing required key: {key} or {snake_case_key}")
                else:
                    # Copy snake_case to camelCase for internal consistency
                    aoi_data[key] = aoi_data[snake_case_key]
        
        # Extract geometry
        geometry = aoi_data['geometry']
        
        # Handle different geometry types (from our frontend)
        if geometry['type'] == 'Circle':
            # Convert circle to polygon for EE compatibility
            center = geometry['center']
            radius = geometry['radius']  # in meters
            
            # Create a circle as an EE geometry
            ee_geometry = ee.Geometry.Point(center).buffer(radius)
            
        elif geometry['type'] in ['Polygon', 'Rectangle']:
            # Convert to EE polygon
            coords = geometry['coordinates'][0]
            ee_geometry = ee.Geometry.Polygon(coords)
        
        else:
            raise ValueError(f"Unsupported geometry type: {geometry['type']}")
        
        # Get alert type
        alert_type = aoi_data['alertType']
        valid_alert_types = ['deforestation', 'urban_development', 'water_body_change', 'land_use_change']
        if alert_type not in valid_alert_types:
            raise ValueError(f"Invalid alert type: {alert_type}. Must be one of {valid_alert_types}")
        
        # Get threshold (should be between 0.1 and 1.0)
        threshold = float(aoi_data['threshold'])
        if threshold < 0.1 or threshold > 1.0:
            raise ValueError(f"Invalid threshold: {threshold}. Must be between 0.1 and 1.0")
        
        # Check for date ranges - multiple formats supported
        custom_dates = aoi_data.get('customDates')  # Direct format
        date_config = aoi_data.get('date_config', {})  # Nested format
        monitoring_dates = aoi_data.get('monitoringDates')  # AOI model format
        frequency = aoi_data.get('frequency', date_config.get('frequency', 'continuous'))
        
        # Prepare monitoring schedule data
        final_date_config = {}
        
        # First check direct customDates (from API requests)
        if custom_dates:
            final_date_config = {
                'custom_dates': custom_dates,
                'frequency': frequency
            }
        # Then check date_config.custom_dates (from test cases)
        elif date_config.get('custom_dates'):
            final_date_config = {
                'custom_dates': date_config['custom_dates'],
                'frequency': frequency
            }
        # Then check monitoringDates (from AOI model)
        elif monitoring_dates:
            final_date_config = {
                'custom_dates': {
                    'startDate': monitoring_dates.get('start'),
                    'endDate': monitoring_dates.get('end')
                },
                'frequency': frequency
            }
            
        # Return processed data
        processed_data = {
            'ee_geometry': ee_geometry,
            'alert_type': alert_type,
            'threshold': threshold,
            'original_geometry': geometry,
            'aoi_id': aoi_data.get('aoi_id', 'unknown'),
            'user_id': aoi_data.get('user_id', 'unknown'),
            'frequency': frequency
        }
        
        # Add date configuration if available
        if final_date_config:
            if 'custom_dates' in final_date_config:
                processed_data['custom_dates'] = final_date_config['custom_dates']
            if 'frequency' in final_date_config:
                processed_data['frequency'] = final_date_config['frequency']
        
        return processed_data
    
    def _get_sentinel2_imagery(self, geometry, start_date, end_date, max_cloud_percentage=20):
        """
        Fetch Sentinel-2 imagery for a specified time period and area with band harmonization.
        
        Args:
            geometry: Earth Engine geometry object defining the AOI
            start_date: Start date string in 'YYYY-MM-DD' format
            end_date: End date string in 'YYYY-MM-DD' format
            max_cloud_percentage: Maximum cloud cover percentage (0-100)
            
        Returns:
            Earth Engine image collection filtered by date and area with harmonized bands
        """
        # Get Sentinel-2 Level-2A data (surface reflectance)
        s2_collection = ee.ImageCollection('COPERNICUS/S2_SR') \
            .filterBounds(geometry) \
            .filterDate(start_date, end_date) \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', max_cloud_percentage))
        
        # If no images found, try with higher cloud percentage
        if s2_collection.size().getInfo() == 0:
            print(f"No images found with cloud cover < {max_cloud_percentage}%. Trying with 50% cloud cover...")
            s2_collection = ee.ImageCollection('COPERNICUS/S2_SR') \
                .filterBounds(geometry) \
                .filterDate(start_date, end_date) \
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 50))
        
        # If still no images found, try with any cloud cover
        if s2_collection.size().getInfo() == 0:
            print("No images found with cloud cover < 50%. Getting all available images...")
            s2_collection = ee.ImageCollection('COPERNICUS/S2_SR') \
                .filterBounds(geometry) \
                .filterDate(start_date, end_date)
        
        # Apply band harmonization to handle different Sentinel-2 product generations
        def debug_and_harmonize(image):
            try:
                # Debug: Print available bands for first image
                bands = image.bandNames().getInfo()
                if bands:
                    print(f"Available bands in image: {bands[:10]}...")  # Show first 10 bands
                return self._harmonize_sentinel2_bands(image)
            except Exception as e:
                print(f"Error in band harmonization: {e}")
                return self._harmonize_sentinel2_bands(image)
        
        # Only debug the first image to avoid spam
        first_image = s2_collection.first()
        if first_image:
            try:
                bands = first_image.bandNames().getInfo()
                print(f"Sample available bands: {bands}")
            except Exception as e:
                print(f"Could not inspect bands: {e}")
        
        harmonized_collection = s2_collection.map(self._harmonize_sentinel2_bands)
        
        # Print information about the collected imagery
        count = harmonized_collection.size().getInfo()
        
        if count > 0:
            print(f"Found {count} Sentinel-2 images for the time period {start_date} to {end_date}")
        else:
            print(f"No Sentinel-2 images found for the time period {start_date} to {end_date}")
            
        return harmonized_collection
    
    def _harmonize_sentinel2_bands(self, image):
        """
        Harmonize Sentinel-2 bands across different product generations and processing baselines.
        
        Args:
            image: Sentinel-2 image
            
        Returns:
            Image with standardized bands
        """
        # Standard bands we need for change detection
        required_bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12']
        
        # Get available bands
        available_bands = image.bandNames()
        
        # First, try to select only the spectral bands and exclude QA/mask bands
        spectral_bands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B9', 'B10', 'B11', 'B12']
        
        # Filter to only include spectral bands that exist
        existing_spectral = available_bands.filter(ee.Filter.inList('item', spectral_bands))
        
        # Select only the spectral bands first
        spectral_image = image.select(existing_spectral)
        
        # Function to safely select required bands
        def safe_select_band(band_name):
            return ee.Algorithms.If(
                existing_spectral.contains(band_name),
                spectral_image.select(band_name),
                ee.Image.constant(0).rename(band_name)
            )
        
        # Create harmonized image with all required bands
        harmonized_bands = []
        for band in required_bands:
            band_image = ee.Image(safe_select_band(band))
            harmonized_bands.append(band_image)
        
        # Combine all bands
        harmonized_image = ee.Image.cat(harmonized_bands)
        
        # Copy metadata from original image
        return harmonized_image.copyProperties(image, ['system:time_start', 'system:time_end', 'CLOUDY_PIXEL_PERCENTAGE'])
    
    def _prepare_multitemporal_imagery(self, processed_aoi):
        """
        Prepare before and after Sentinel-2 imagery for change detection.
        
        Args:
            processed_aoi: Processed AOI data from process_aoi_input()
            
        Returns:
            Dictionary containing before and after imagery
        """
        # Get date ranges
        before_start, before_end, after_start, after_end = self._get_date_ranges(processed_aoi)
        
        print(f"Fetching 'before' imagery for period: {before_start} to {before_end}")
        print(f"Fetching 'after' imagery for period: {after_start} to {after_end}")
        
        # Get the AOI geometry
        geometry = processed_aoi['ee_geometry']
        
        # Get "before" imagery
        before_collection = self._get_sentinel2_imagery(geometry, before_start, before_end)
        
        # Get "after" imagery
        after_collection = self._get_sentinel2_imagery(geometry, after_start, after_end)
        
        # If either collection is empty, exit with error
        if before_collection.size().getInfo() == 0 or after_collection.size().getInfo() == 0:
            raise ValueError("Unable to obtain sufficient imagery for change detection.")
        
        # Select the relevant bands for change detection
        # B2: Blue, B3: Green, B4: Red, B8: NIR, B11: SWIR1, B12: SWIR2
        bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12']
        
        # Create a median composite for "before" and "after" periods
        before_image = before_collection.median().select(bands)
        after_image = after_collection.median().select(bands)
        
        # Return the prepared imagery
        return {
            'before_image': before_image,
            'after_image': after_image,
            'before_period': {'start': before_start, 'end': before_end},
            'after_period': {'start': after_start, 'end': after_end},
            'bands': bands
        }
    
    def _get_date_ranges(self, processed_aoi):
        """
        Get appropriate date ranges for before/after imagery.
        
        Args:
            processed_aoi: Processed AOI data
            
        Returns:
            Tuple of (before_start, before_end, after_start, after_end) dates as strings
        """
        # Check if custom dates were provided
        custom_dates = processed_aoi.get('custom_dates')
        
        if custom_dates:
            try:
                # Parse the custom dates - handle both formats
                start_date_str = custom_dates.get('startDate') or custom_dates.get('start')
                end_date_str = custom_dates.get('endDate') or custom_dates.get('end')
                
                if start_date_str:
                    # Handle simple date strings (YYYY-MM-DD) and ISO strings
                    if 'T' in start_date_str or 'Z' in start_date_str:
                        user_start = datetime.datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                        if user_start.tzinfo is not None:
                            user_start = user_start.replace(tzinfo=None)
                    else:
                        user_start = datetime.datetime.strptime(start_date_str, '%Y-%m-%d')
                else:
                    # Default start date if not provided
                    user_start = datetime.datetime.now() - datetime.timedelta(days=180)
                
                if end_date_str and end_date_str != 'null' and end_date_str.strip():
                    # Handle simple date strings (YYYY-MM-DD) and ISO strings
                    if 'T' in end_date_str or 'Z' in end_date_str:
                        user_end = datetime.datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                        if user_end.tzinfo is not None:
                            user_end = user_end.replace(tzinfo=None)
                    else:
                        user_end = datetime.datetime.strptime(end_date_str, '%Y-%m-%d')
                else:
                    # For continuous monitoring, use current date as end
                    user_end = datetime.datetime.now()
                    print(f"No end date provided, using current date: {user_end.strftime('%Y-%m-%d')}")
                
                # Ensure we have at least 60 days difference for meaningful analysis
                total_days = (user_end - user_start).days
                if total_days <= 0:
                    print(f"Warning: Invalid date range (end before start). Using default 180-day period.")
                    user_end = datetime.datetime.now()
                    user_start = user_end - datetime.timedelta(days=180)
                    total_days = 180
                elif total_days < 60:
                    print(f"Warning: Date range too short ({total_days} days). Extending to minimum 180 days.")
                    # Extend the range to at least 180 days for proper before/after comparison
                    user_start = user_end - datetime.timedelta(days=180)
                    total_days = 180
                
                # Calculate periods: first 70% for "before", last 30% for "after"
                # This ensures enough historical data for baseline comparison
                before_duration = int(total_days * 0.7)
                after_duration = total_days - before_duration
                
                # Ensure minimum 30 days for each period
                if before_duration < 30:
                    before_duration = 30
                if after_duration < 30:
                    after_duration = 30
                    
                # If we had to adjust durations, extend the total range
                if before_duration + after_duration > total_days:
                    total_needed = before_duration + after_duration
                    user_start = user_end - datetime.timedelta(days=total_needed)
                    print(f"Extended date range to {total_needed} days to ensure minimum periods")
                
                # Calculate the split point
                split_point = user_start + datetime.timedelta(days=before_duration)
                
                # Define the "before" period
                before_start = user_start.strftime('%Y-%m-%d')
                before_end = split_point.strftime('%Y-%m-%d')
                
                # Define the "after" period
                after_start = split_point.strftime('%Y-%m-%d')
                after_end = user_end.strftime('%Y-%m-%d')
                
                print(f"Using custom date range:")
                print(f"Before period: {before_start} to {before_end} ({before_duration} days)")
                print(f"After period: {after_start} to {after_end} ({after_duration} days)")
                
                return before_start, before_end, after_start, after_end
            except (ValueError, KeyError) as e:
                print(f"Error parsing custom dates: {e}, falling back to default dates")
                return self._get_default_date_ranges()
        else:
            # Use default date ranges
            return self._get_default_date_ranges()
    
    def _get_default_date_ranges(self):
        """Get default date ranges for before/after imagery"""
        # Get the current date
        today = datetime.datetime.now()
        
        # Define the "after" period (most recent 3 months)
        after_end = today.strftime('%Y-%m-%d')
        after_start = (today - datetime.timedelta(days=90)).strftime('%Y-%m-%d')
        
        # Define the "before" period (baseline from 6 months back)
        before_end = (today - datetime.timedelta(days=90)).strftime('%Y-%m-%d')
        before_start = (today - datetime.timedelta(days=30*6)).strftime('%Y-%m-%d')
        
        print(f"Using default date ranges:")
        print(f"Before period: {before_start} to {before_end}")
        print(f"After period: {after_start} to {after_end}")
        
        return before_start, before_end, after_start, after_end
        
        print(f"Fetching 'before' imagery for period: {before_start} to {before_end}")
        print(f"Fetching 'after' imagery for period: {after_start} to {after_end}")
        
        # Get the AOI geometry
        geometry = processed_aoi['ee_geometry']
        
        # Get "before" imagery
        before_collection = self._get_sentinel2_imagery(geometry, before_start, before_end)
        
        # Get "after" imagery
        after_collection = self._get_sentinel2_imagery(geometry, after_start, after_end)
        
        # If either collection is empty, exit with error
        if before_collection.size().getInfo() == 0 or after_collection.size().getInfo() == 0:
            raise ValueError("Unable to obtain sufficient imagery for change detection.")
        
        # Select the relevant bands for change detection
        # B2: Blue, B3: Green, B4: Red, B8: NIR, B11: SWIR1, B12: SWIR2
        bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12']
        
        # Create a median composite for "before" and "after" periods
        before_image = before_collection.median().select(bands)
        after_image = after_collection.median().select(bands)
        
        # Return the prepared imagery
        return {
            'before_image': before_image,
            'after_image': after_image,
            'before_period': {'start': before_start, 'end': before_end},
            'after_period': {'start': after_start, 'end': after_end},
            'bands': bands
        }
    
    def _mask_clouds_and_shadows(self, image):
        """
        Apply cloud and shadow masking to a Sentinel-2 image.
        
        Args:
            image: A Sentinel-2 image from the SR collection
            
        Returns:
            Cloud-masked Sentinel-2 image
        """
        # Try to use SCL (Scene Classification Layer) for newer Sentinel-2 data
        try:
            scl = image.select('SCL')
            # SCL values: 3=cloud shadows, 8=cloud medium probability, 9=cloud high probability, 10=thin cirrus
            cloud_shadow_mask = scl.neq(3).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10))
            masked_image = image.updateMask(cloud_shadow_mask)
        except:
            # Fallback to QA60 for older data
            try:
                qa = image.select('QA60')
                # Create cloud and cirrus masks
                cloud_mask = qa.bitwiseAnd(1 << 10).eq(0)  # Bit 10: Opaque clouds
                cirrus_mask = qa.bitwiseAnd(1 << 11).eq(0)  # Bit 11: Cirrus clouds
                # Combine the cloud and cirrus masks
                mask = cloud_mask.And(cirrus_mask)
                masked_image = image.updateMask(mask)
            except:
                # If no quality bands available, use the image as-is but apply simple shadow detection
                masked_image = image
        
        # Additional shadow detection using NDVI and SWIR
        try:
            ndvi = masked_image.normalizedDifference(['B8', 'B4'])  # (NIR - RED) / (NIR + RED)
            dark_pixels = masked_image.select('B11').lt(300)        # Dark in SWIR1
            potential_shadows = ndvi.lt(0.1).And(dark_pixels)       # Low NDVI and dark in SWIR1
            
            # Apply the shadow mask
            masked_image = masked_image.updateMask(potential_shadows.Not())
        except:
            # If shadow detection fails, continue with cloud-masked image
            pass
        
        return masked_image
    
    def _apply_cloud_shadow_masking(self, imagery):
        """
        Apply cloud and shadow masking to the before and after imagery.
        
        Args:
            imagery: Dictionary containing before_image and after_image
            
        Returns:
            Dictionary with masked before_image and after_image
        """
        # We need to get the original Sentinel-2 images with QA bands for masking
        before_start = imagery['before_period']['start']
        before_end = imagery['before_period']['end']
        after_start = imagery['after_period']['start']
        after_end = imagery['after_period']['end']
        
        # Get the geometry from the original images
        geometry = imagery['before_image'].geometry()
        
        # Get the full Sentinel-2 collections
        before_collection = ee.ImageCollection('COPERNICUS/S2_SR') \
            .filterBounds(geometry) \
            .filterDate(before_start, before_end)
        
        after_collection = ee.ImageCollection('COPERNICUS/S2_SR') \
            .filterBounds(geometry) \
            .filterDate(after_start, after_end)
        
        # Apply cloud masking to each image in the collections
        masked_before_collection = before_collection.map(self._mask_clouds_and_shadows)
        masked_after_collection = after_collection.map(self._mask_clouds_and_shadows)
        
        # Create median composites from the masked collections
        masked_before_image = masked_before_collection.median().select(imagery['bands'])
        masked_after_image = masked_after_collection.median().select(imagery['bands'])
        
        # Return the updated imagery
        return {
            'before_image': masked_before_image,
            'after_image': masked_after_image,
            'before_period': imagery['before_period'],
            'after_period': imagery['after_period'],
            'bands': imagery['bands']
        }
    
    def _select_change_detection_algorithm(self, alert_type, additional_config=None):
        """
        Select and configure the appropriate change detection algorithm.
        
        Args:
            alert_type: Type of change to detect (e.g., 'deforestation')
            additional_config: Optional additional configuration parameters
            
        Returns:
            Configured algorithm instance
        """
        # Validate alert type
        valid_alert_types = algorithm_registry.list_algorithms()
        if alert_type not in valid_alert_types:
            raise ValueError(f"Invalid alert type: {alert_type}. Must be one of {valid_alert_types}")
        
        # Get the algorithm class
        algorithm_class = algorithm_registry.get_algorithm(alert_type)
        
        # Create and configure the algorithm
        config = additional_config or {}
        algorithm = algorithm_class(config)
        
        return algorithm
    
    def _detect_changes(self, masked_imagery, algorithm, aoi_geometry, threshold):
        """
        Apply a change detection algorithm and threshold the results.
        
        Args:
            masked_imagery: Dictionary with masked before_image and after_image
            algorithm: Change detection algorithm to apply
            aoi_geometry: Earth Engine geometry defining the AOI
            threshold: Confidence threshold for change detection (0.1 to 1.0)
            
        Returns:
            Change detection results
        """
        # Extract before and after images
        before_image = masked_imagery['before_image']
        after_image = masked_imagery['after_image']
        
        # Apply the change detection algorithm
        print(f"Applying change detection algorithm...")
        
        # Pass date information to algorithms that support seasonal filtering
        if hasattr(algorithm, 'detect_change_with_dates'):
            change_image = algorithm.detect_change_with_dates(
                before_image, after_image, aoi_geometry, 
                masked_imagery['before_period'], masked_imagery['after_period']
            )
        else:
            change_image = algorithm.detect_change(before_image, after_image, aoi_geometry)
        
        # Determine the appropriate band to threshold based on the algorithm
        alert_type = algorithm.__class__.__name__.lower().replace('detection', '')
        score_band = f"{alert_type}_score"
        
        # Apply the threshold to the score band
        print(f"Applying threshold {threshold} to score band: {score_band}")
        # Use the user's threshold directly - they set it as the confidence level they want
        thresholded_image = change_image.select(score_band).gte(threshold)
        
        # Debug: Check how much area passes the threshold
        try:
            # Sample the threshold result
            threshold_count = thresholded_image.reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=aoi_geometry,
                scale=30,
                maxPixels=1e6
            ).getInfo()
            print(f"Pixels passing threshold {threshold}: {threshold_count}")
        except Exception as e:
            print(f"Could not count threshold pixels: {e}")
        
        # Add the thresholded result to the change image
        change_image = change_image.addBands(thresholded_image.rename('thresholded_change'))
        
        # Filter false positives
        print("Filtering false positives...")
        filtered_image = algorithm.filter_false_positives(change_image, aoi_geometry)
        
        # Clip to AOI
        clipped_image = filtered_image.clip(aoi_geometry)
        
        # Return the results
        return {
            'change_image': clipped_image,
            'alert_type': alert_type,
            'threshold': threshold,
            'before_period': masked_imagery['before_period'],
            'after_period': masked_imagery['after_period']
        }
    
    def _apply_advanced_false_positive_filtering(self, detection_results):
        """
        Apply advanced false positive filtering to change detection results.
        
        Args:
            detection_results: Change detection results from detect_changes()
            
        Returns:
            Updated change detection results with additional filtering
        """
        change_image = detection_results['change_image']
        alert_type = detection_results['alert_type']
        aoi_geometry = None  # This would be accessed from the instance state in a full implementation
        
        # Get the thresholded change band
        thresholded = change_image.select('thresholded_change')
        
        # 1. Filter by minimum mapping unit (smaller than this will be considered noise)
        # Calculate connected pixel counts
        connected = thresholded.connectedPixelCount(100, True)
        
        # Different thresholds based on alert type
        mmu_thresholds = {
            'deforestation': 15,       # 15 pixels (1500 sq meters at 10m resolution)
            'urban_development': 10,   # 10 pixels (1000 sq meters)
            'water_body_change': 8,    # 8 pixels (800 sq meters)
            'land_use_change': 12      # 12 pixels (1200 sq meters)
        }
        
        mmu_threshold = mmu_thresholds.get(alert_type, 10)  # Default to 10 if not found
        print(f"DEBUG: Applying MMU filtering with threshold {mmu_threshold} pixels for {alert_type}")
        
        # Count pixels before MMU filtering
        try:
            aoi_geometry = change_image.geometry()
            before_mmu_count = thresholded.reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=aoi_geometry,
                scale=30,
                maxPixels=1e6
            ).getInfo()
            print(f"DEBUG: Pixels before MMU filter: {before_mmu_count}")
        except Exception as e:
            print(f"DEBUG: Could not count before MMU: {e}")
        
        mmu_filtered = thresholded.updateMask(connected.gte(mmu_threshold))
        
        # Count pixels after MMU filtering
        try:
            after_mmu_count = mmu_filtered.reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=aoi_geometry,
                scale=30,
                maxPixels=1e6
            ).getInfo()
            print(f"DEBUG: Pixels after MMU filter: {after_mmu_count}")
        except Exception as e:
            print(f"DEBUG: Could not count after MMU: {e}")
        
        # 2. Context-based filtering specific to each alert type
        if alert_type == 'deforestation':
            # Check for agricultural patterns using improved entropy analysis
            # This distinguishes natural forests (high texture) from agricultural areas (uniform)
            try:
                ndvi_before = change_image.select('NDVI_before')
                ndvi_after = change_image.select('NDVI_after')
                
                print(f"DEBUG: Applying improved entropy-based filtering for deforestation")
                
                # Get AOI geometry from change image properties
                aoi_geometry = change_image.geometry()
                
                # Sample NDVI values first for debugging
                try:
                    ndvi_sample = ndvi_before.sample(aoi_geometry.centroid(), 30).first().getInfo()
                    print(f"DEBUG: NDVI_before at center: {ndvi_sample}")
                except Exception as e:
                    print(f"DEBUG: Could not sample NDVI_before: {e}")
                
                # Improved NDVI preprocessing for entropy calculation
                # 1. Ensure NDVI values are in valid range and have sufficient contrast
                ndvi_clipped = ndvi_before.clamp(-1, 1)
                
                # 2. Apply a small amount of smoothing to reduce noise but preserve texture
                ndvi_smoothed = ndvi_clipped.focal_median(radius=1)
                
                # 3. Enhance contrast for better entropy calculation
                ndvi_stats = ndvi_smoothed.reduceRegion(
                    reducer=ee.Reducer.minMax(),
                    geometry=aoi_geometry,
                    scale=30,
                    maxPixels=1e6,
                    bestEffort=True
                )
                
                try:
                    stats_info = ndvi_stats.getInfo()
                    ndvi_min = stats_info.get('NDVI_before_min', -1)
                    ndvi_max = stats_info.get('NDVI_before_max', 1)
                    ndvi_range = ndvi_max - ndvi_min
                    
                    print(f"DEBUG: NDVI range: {ndvi_min} to {ndvi_max} (range: {ndvi_range})")
                    
                    # Only proceed with entropy if we have sufficient NDVI variation
                    if ndvi_range > 0.1:  # Need at least 0.1 NDVI range for meaningful texture
                        # Stretch NDVI to full 0-255 range for better entropy calculation
                        ndvi_stretched = ndvi_smoothed.subtract(ndvi_min).divide(ndvi_range).multiply(255).int8()
                        
                        # Calculate entropy with multiple kernel sizes and take the maximum
                        # This captures texture at different scales
                        kernel_small = ee.Kernel.square(radius=1)  # 3x3
                        kernel_medium = ee.Kernel.square(radius=2)  # 5x5
                        
                        entropy_small = ndvi_stretched.entropy(kernel_small)
                        entropy_medium = ndvi_stretched.entropy(kernel_medium)
                        
                        # Take the maximum entropy across scales
                        ndvi_entropy = entropy_small.max(entropy_medium)
                        
                        # Sample entropy values for debugging
                        try:
                            entropy_sample = ndvi_entropy.sample(aoi_geometry.centroid(), 30).first().getInfo()
                            print(f"DEBUG: Multi-scale entropy at center: {entropy_sample}")
                            
                            # Get entropy statistics
                            entropy_stats = ndvi_entropy.reduceRegion(
                                reducer=ee.Reducer.minMax().combine(ee.Reducer.mean(), sharedInputs=True),
                                geometry=aoi_geometry,
                                scale=30,
                                maxPixels=1e6,
                                bestEffort=True
                            ).getInfo()
                            print(f"DEBUG: Entropy stats: {entropy_stats}")
                            
                            entropy_mean = entropy_stats.get('NDVI_before_mean', 0)
                            entropy_max = entropy_stats.get('NDVI_before_max', 0)
                            
                            if entropy_max > 0 and entropy_mean > 0:
                                # Use adaptive threshold based on the entropy distribution
                                # Use 25th percentile as threshold (keeps 75% of pixels)
                                entropy_threshold = max(0.1, entropy_mean * 0.5)  # At least 0.1, but usually half the mean
                                print(f"DEBUG: Using adaptive entropy threshold: {entropy_threshold}")
                                
                                natural_forest_mask = ndvi_entropy.gt(entropy_threshold)
                            else:
                                print(f"DEBUG: Entropy calculation produced no variation. Skipping entropy filter.")
                                natural_forest_mask = ee.Image(1)  # Accept all pixels
                                
                        except Exception as e:
                            print(f"DEBUG: Could not analyze entropy statistics: {e}")
                            # Use a very conservative threshold
                            natural_forest_mask = ndvi_entropy.gt(0.05)
                            
                    else:
                        print(f"DEBUG: Insufficient NDVI variation ({ndvi_range}) for entropy analysis. Skipping entropy filter.")
                        natural_forest_mask = ee.Image(1)  # Accept all pixels
                        
                except Exception as e:
                    print(f"DEBUG: Could not get NDVI statistics: {e}")
                    # Fallback: use basic entropy with very low threshold
                    ndvi_int = ndvi_clipped.multiply(100).add(100).int8()
                    ndvi_entropy = ndvi_int.entropy(ee.Kernel.square(3))
                    natural_forest_mask = ndvi_entropy.gt(0.05)  # Very low threshold
                
                # Count pixels before and after entropy filtering
                try:
                    before_count = mmu_filtered.reduceRegion(
                        reducer=ee.Reducer.sum(),
                        geometry=aoi_geometry,
                        scale=30,
                        maxPixels=1e6
                    ).getInfo()
                    
                    after_entropy = mmu_filtered.updateMask(natural_forest_mask)
                    after_count = after_entropy.reduceRegion(
                        reducer=ee.Reducer.sum(),
                        geometry=aoi_geometry,
                        scale=30,
                        maxPixels=1e6
                    ).getInfo()
                    
                    print(f"DEBUG: Pixels before entropy filter: {before_count}")
                    print(f"DEBUG: Pixels after entropy filter: {after_count}")
                    
                    # If entropy filtering removes more than 95% of pixels, it's probably too aggressive
                    before_pixel_count = before_count.get('thresholded_change', 0)
                    after_pixel_count = after_count.get('thresholded_change', 0)
                    
                    if before_pixel_count > 0:
                        retention_rate = after_pixel_count / before_pixel_count
                        print(f"DEBUG: Entropy filter retention rate: {retention_rate:.2%}")
                        
                        if retention_rate < 0.05:  # If less than 5% of pixels remain
                            print(f"DEBUG: Entropy filter too aggressive ({retention_rate:.2%} retention). Using relaxed filter.")
                            # Use a much more relaxed entropy threshold
                            relaxed_mask = ndvi_entropy.gt(0.01) if 'ndvi_entropy' in locals() else ee.Image(1)
                            context_filtered = mmu_filtered.updateMask(relaxed_mask)
                        else:
                            context_filtered = after_entropy
                    else:
                        context_filtered = after_entropy
                        
                except Exception as e:
                    print(f"DEBUG: Could not count entropy filtering: {e}")
                    context_filtered = mmu_filtered.updateMask(natural_forest_mask)
                
            except Exception as e:
                print(f"Warning: Could not apply entropy-based filtering: {e}")
                # Fall back to just using MMU filtering
                context_filtered = mmu_filtered
            
        elif alert_type == 'urban_development':
            # Filter out changes that may be temporary (like construction sites)
            # Look for consistent increases in built-up indices
            ndbi_diff = change_image.select('NDBI_diff')
            ui_diff = change_image.select('UI_diff')
            
            # Require both indices to show significant increases
            consistent_change = ndbi_diff.gt(0.1).And(ui_diff.gt(0.1))
            context_filtered = mmu_filtered.updateMask(consistent_change)
            
        elif alert_type == 'water_body_change':
            # Handle specific water body change filtering
            # For water reclamation - ensure it was actually water before
            # For water expansion - ensure it wasn't water before
            try:
                water_reclamation = change_image.select('water_reclamation_indicator')
                water_expansion = change_image.select('water_expansion_indicator')
                
                ndwi_before = change_image.select('NDWI_before')
                ndwi_after = change_image.select('NDWI_after')
                
                # For reclamation, ensure it was water before (high NDWI)
                reclamation_filtered = water_reclamation.updateMask(ndwi_before.gt(0.2))
                
                # For expansion, ensure it wasn't water before (low NDWI)
                expansion_filtered = water_expansion.updateMask(ndwi_before.lt(0))
                
                # Combine both types
                context_filtered = ee.Image.cat([
                    reclamation_filtered.rename('water_reclamation_indicator'),
                    expansion_filtered.rename('water_expansion_indicator')
                ])
            except Exception as e:
                print(f"Warning: Error in water body filtering: {e}")
                context_filtered = mmu_filtered
            
        else:  # land_use_change or any other type
            # Generic context filtering for land use change
            # Focus on areas with the most significant changes
            change_magnitude = change_image.select('change_magnitude')
            significant_change = change_magnitude.gt(0.3)  # Higher threshold for significance
            context_filtered = mmu_filtered.updateMask(significant_change)
        
        # 3. Temporal consistency check (if we had more than two dates, we'd check for consistency over time)
        # In a production system, we would look at multiple time points to confirm changes
        # For now, we'll use our current filtering
        
        # Add the filtered result to the change image
        filtered_change_image = change_image.addBands(context_filtered.rename('filtered_change'), ['filtered_change'], True)
        
        # Update the detection results
        filtered_detection_results = detection_results.copy()
        filtered_detection_results['change_image'] = filtered_change_image
        filtered_detection_results['filtered'] = True
        
        return filtered_detection_results
    
    def _generate_change_maps_and_alerts(self, filtered_results, processed_aoi):
        """
        Generate change maps and structured alert data.
        
        Args:
            filtered_results: Filtered change detection results
            processed_aoi: Processed AOI data
            
        Returns:
            Dictionary containing change maps and alert data
        """
        # Get the change image
        change_image = filtered_results['change_image']
        
        # Get the AOI geometry
        aoi_geometry = processed_aoi['ee_geometry']
        
        # Get the alert type
        alert_type = filtered_results['alert_type']
        
        # Visualization parameters for true color imagery
        vis_params_true_color = {
            'bands': ['B4', 'B3', 'B2'],
            'min': 0,
            'max': 3000,
            'gamma': 1.4
        }
        
        # Get before and after images from the masked imagery
        # In a real implementation, these would be properly passed through the pipeline
        # Here we assume they are available from the previous steps
        try:
            before_image = change_image.select(['B4', 'B3', 'B2'])
            after_image = change_image.select(['B4', 'B3', 'B2'])
            
            # Generate RGB visualization for before and after images
            before_vis = before_image.visualize(**vis_params_true_color)
            after_vis = after_image.visualize(**vis_params_true_color)
        except Exception as e:
            print(f"Warning: Could not visualize before/after images: {e}")
            # Create placeholder images
            before_vis = ee.Image(0).visualize()
            after_vis = ee.Image(0).visualize()
        
        # Generate change visualization - find the best binary change band
        available_bands = change_image.bandNames().getInfo()
        print(f"DEBUG: Available bands for area calculation: {available_bands}")
        
        # Priority order for binary change bands
        band_candidates = ['filtered_change', 'thresholded_change_1', 'thresholded_change']
        change_band = None
        
        for candidate in band_candidates:
            if candidate in available_bands:
                change_band = candidate
                print(f"DEBUG: Using '{candidate}' band for area calculation")
                break
        
        if change_band is None:
            # Fallback: use any binary band that exists
            for band in available_bands:
                if 'thresholded' in band or 'filtered' in band or 'binary' in band:
                    change_band = band
                    print(f"DEBUG: Fallback using '{band}' band for area calculation")
                    break
        
        if change_band is None:
            print("WARNING: No suitable binary change band found, will try to create one from score bands")
            change_band = 'thresholded_change'  # Will be created later if needed
        
        # Special case for water body change
        if alert_type == 'water_body_change':
            try:
                # Create a composite visualization for water changes
                # Red = reclamation (water loss), Blue = expansion (water gain)
                reclamation = change_image.select('water_reclamation_indicator').visualize(**{
                    'min': 0, 
                    'max': 1, 
                    'palette': ['transparent', 'red']
                })
                
                expansion = change_image.select('water_expansion_indicator').visualize(**{
                    'min': 0, 
                    'max': 1, 
                    'palette': ['transparent', 'blue']
                })
                
                change_vis = ee.Image.cat([
                    reclamation.select('vis-red'),
                    reclamation.select('vis-green'),
                    expansion.select('vis-blue')
                ])
                
            except Exception as e:
                print(f"Warning: Could not create water change visualization: {e}")
                # Fall back to generic visualization
                change_vis = change_image.select(change_band).visualize(**{
                    'min': 0, 
                    'max': 1, 
                    'palette': ['transparent', 'red']
                })
        else:
            # Standard visualization for other change types
            change_vis = change_image.select(change_band).visualize(**{
                'min': 0, 
                'max': 1, 
                'palette': ['transparent', 'red']
            })
        
        # Create a before/after/change composite
        before_thumbnail = before_vis.clip(aoi_geometry)
        after_thumbnail = after_vis.clip(aoi_geometry)
        change_thumbnail = change_vis.clip(aoi_geometry)
        
        # In a production system, we'd create URLs for these images
        # For this module, we'll return the EE images themselves
        
        # Calculate change statistics
        # 1. Total AOI area
        aoi_area = ee.Number(aoi_geometry.area()).divide(1000 * 1000)  # Convert to sq km
        
        # 2. Area with detected change
        # First ensure we have a binary change image for area calculation
        # Use adaptive scale and pixel limits based on AOI size
        aoi_area_approx = aoi_geometry.area().divide(1000 * 1000).getInfo()  # Rough area in sq km
        
        # Adaptive scaling: use coarser resolution for larger areas to avoid memory limits
        if aoi_area_approx < 10:
            scale = 10  # High resolution for small areas
            max_pixels = 1e8
        elif aoi_area_approx < 100:
            scale = 20  # Medium resolution
            max_pixels = 1e8
        elif aoi_area_approx < 1000:
            scale = 30  # Standard resolution
            max_pixels = 1e7
        else:
            scale = 50  # Coarse resolution for very large areas
            max_pixels = 1e6
        
        try:
            # Use the change_band - should be binary (0/1)
            print(f"DEBUG: Calculating area using band '{change_band}'")
            
            # First check if the band exists and get some stats
            try:
                band_info = change_image.select(change_band).getInfo()
                print(f"DEBUG: Selected band info: {band_info.get('bands', [{}])[0].get('data_type', 'unknown')}")
            except Exception as e:
                print(f"DEBUG: Could not get band info: {e}")
            
            # Check if there are any non-zero pixels in the band
            pixel_count = change_image.select(change_band).reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=aoi_geometry,
                scale=scale,
                maxPixels=max_pixels,
                bestEffort=True
            )
            
            pixel_count_value = pixel_count.getInfo()
            print(f"DEBUG: Total non-zero pixels in '{change_band}': {pixel_count_value}")
            
            if pixel_count_value.get(change_band, 0) > 0:
                # Calculate area
                change_area_image = change_image.select(change_band).multiply(ee.Image.pixelArea())
                change_area = change_area_image.reduceRegion(
                    reducer=ee.Reducer.sum(),
                    geometry=aoi_geometry,
                    scale=scale,
                    maxPixels=max_pixels,
                    bestEffort=True,  # Allow approximation if needed
                    tileScale=4  # Use tiling to reduce memory usage
                )
                print(f"DEBUG: Area calculation result: {change_area.getInfo()}")
            else:
                print(f"DEBUG: No non-zero pixels found in '{change_band}', area will be 0")
                change_area = {change_band: 0}
        except Exception as e:
            print(f"Warning: Error in area calculation with {change_band}: {e}")
            # Fallback to creating a binary mask from any available score band
            try:
                score_bands = ['filtered_deforestation_score', 'deforestation_score', 
                              'urban_development_score', 'water_body_change_score', 
                              'land_use_change_score']
                
                selected_band = None
                for band in score_bands:
                    try:
                        change_image.select(band)
                        selected_band = band
                        break
                    except:
                        continue
                
                if selected_band:
                    # Create binary mask from score (threshold > 0.3 for conservative estimate)
                    binary_change = change_image.select(selected_band).gt(0.3)
                    change_area_image = binary_change.multiply(ee.Image.pixelArea())
                    change_area = change_area_image.reduceRegion(
                        reducer=ee.Reducer.sum(),
                        geometry=aoi_geometry,
                        scale=scale,
                        maxPixels=max_pixels,
                        bestEffort=True,
                        tileScale=4
                    )
                    change_band = selected_band  # Update for later use
                else:
                    raise Exception("No suitable change band found")
            except Exception as e2:
                print(f"Warning: Fallback area calculation also failed: {e2}")
                change_area = {change_band: 0}
        
        # Get the area in square meters and convert to square kilometers
        try:
            change_area_value = ee.Number(change_area.get(change_band)).divide(1000 * 1000)
            
            # Calculate percentage of AOI affected
            percent_affected = change_area_value.divide(aoi_area).multiply(100)
            
            # Compute these values
            change_area_value = change_area_value.getInfo()
            percent_affected = percent_affected.getInfo()
            aoi_area_value = aoi_area.getInfo()
        except Exception as e:
            print(f"Warning: Could not calculate area statistics: {e}")
            change_area_value = 0
            percent_affected = 0
            aoi_area_value = 0
        
        # 3. Get change coordinates (bounding boxes of detected changes)
        # In a production system, we would extract the exact polygons of detected changes
        # Here we'll just use the AOI geometry as an approximation
        
        # 4. Calculate confidence and severity
        # For now, use a simplified approach
        if percent_affected > 20:
            severity = "high"
        elif percent_affected > 5:
            severity = "medium"
        else:
            severity = "low"
        
        # Confidence is based on the user's threshold
        confidence = filtered_results['threshold']
        
        # Extract monitoring schedule from the processed AOI data
        monitoring_schedule = {}
        if 'custom_dates' in processed_aoi:
            monitoring_schedule = {
                'monitoringSchedule': {
                    'start_date': processed_aoi['custom_dates'].get('startDate'),
                    'end_date': processed_aoi['custom_dates'].get('endDate'),
                    'frequency': processed_aoi.get('frequency', 'continuous')
                }
            }
            
        # Create an alert data structure (similar to the Alert model in the database)
        alert_data = {
            'type': alert_type,
            'severity': severity,
            'confidence': confidence,
            'description': f"Detected {alert_type.replace('_', ' ')} affecting {percent_affected:.2f}% of the AOI",
            'detectedChange': {
                'area': change_area_value,  # Area in sq km
                'percentage': percent_affected,  # Percentage of AOI affected
                'coordinates': processed_aoi['original_geometry']['coordinates'],  # For simplicity, using the AOI coordinates
                'beforeImageUrl': "URL would be generated in production",
                'afterImageUrl': "URL would be generated in production",
                'changeMapUrl': "URL would be generated in production"
            },
            'aoiArea': aoi_area_value,
            'beforePeriod': filtered_results['before_period'],
            'afterPeriod': filtered_results['after_period'],
            'metadata': {
                'satelliteSource': 'Sentinel-2',
                'processingTime': 0,  # Would be measured in production
                'algorithmVersion': '1.0'
            },
            'aoiId': processed_aoi.get('aoi_id', 'unknown'),
            'userId': processed_aoi.get('user_id', 'unknown'),
            'createdAt': datetime.datetime.now().isoformat(),
            'status': 'new'
        }
        
        # Add monitoring schedule to alert data if available
        if monitoring_schedule:
            alert_data.update(monitoring_schedule)
        
        # Return the change maps and alert data
        return {
            'change_maps': {
                'before': before_thumbnail,
                'after': after_thumbnail,
                'change': change_thumbnail
            },
            'alert_data': alert_data
        }
    
    def _serialize_ee_object(self, obj):
        """Convert Earth Engine objects to JSON-serializable format"""
        if hasattr(obj, 'getInfo'):
            try:
                return obj.getInfo()
            except Exception as e:
                print(f"Warning: Could not serialize EE object: {e}")
                return str(obj)
        return obj


# Example usage
if __name__ == "__main__":
    import argparse
    import json
    
    # Set up command line argument parsing
    parser = argparse.ArgumentParser(description='ISRO Change Detection System')
    parser.add_argument('--input', required=True, help='Path to input JSON file with AOI data')
    parser.add_argument('--output', required=True, help='Path to output JSON file for results')
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    
    args = parser.parse_args()
    
    try:
        # Read AOI data from input file
        with open(args.input, 'r') as f:
            aoi_data = json.load(f)
        
        if args.debug:
            print(f"Processing AOI: {aoi_data.get('aoi_id', 'unknown')}")
            print(f"Alert Type: {aoi_data.get('alertType', 'unknown')}")
            print(f"Threshold: {aoi_data.get('threshold', 'unknown')}")
        
        # Initialize the change detection system
        change_system = ChangeDetectionSystem()
        
        # Process the AOI
        results = change_system.process_aoi(aoi_data)
        
        # Write results to output file
        with open(args.output, 'w') as f:
            json.dump({
                'success': True,
                'message': 'Change detection completed successfully',
                'alert_data': results['alert_data']
            }, f, indent=2, default=str)
        
        if args.debug:
            print(f"Results written to: {args.output}")
            print(f"Detection completed successfully")
        
    except Exception as e:
        # Write error to output file
        error_result = {
            'success': False,
            'error': str(e),
            'message': 'Change detection failed'
        }
        
        try:
            with open(args.output, 'w') as f:
                json.dump(error_result, f, indent=2)
        except:
            pass
        
        print(f"Error in change detection: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    # 2. Generate URLs for the change maps
    # 3. Send notifications to the user
    # 4. Return or log the results
