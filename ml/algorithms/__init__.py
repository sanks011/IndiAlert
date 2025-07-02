# Import all algorithm implementations
from .deforestation import DeforestationDetection
from .urban_development import UrbanDevelopmentDetection
from .water_body_change import WaterBodyChangeDetection
from .land_use_change import LandUseChangeDetection

__all__ = [
    'DeforestationDetection',
    'UrbanDevelopmentDetection',
    'WaterBodyChangeDetection',
    'LandUseChangeDetection'
]
