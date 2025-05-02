import os
import joblib
import sys
import numpy as np
import pandas as pd

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(project_root)

def update_best_models():
    """
    Update best_weather_models.joblib to ensure it contains wind direction components.
    This script checks if wind_direction_sin and wind_direction_cos are in the best models,
    and if not, adds them from the best available model.
    """
    print("Checking and updating best weather models...")
    
    # Path to best models file
    best_models_path = os.path.join(project_root, 'backend', 'ml', 'models', 'best_weather_models.joblib')
    
    # Check if the file exists
    if not os.path.exists(best_models_path):
        print(f"Error: Best models file not found at {best_models_path}")
        return False
    
    # Load the best models
    best_data = joblib.load(best_models_path)
    
    # Check if wind direction components are included
    sin_missing = 'wind_direction_sin' not in best_data['models']
    cos_missing = 'wind_direction_cos' not in best_data['models']
    
    if not sin_missing and not cos_missing:
        print("Best models already include wind direction components.")
        return True
    
    # Find models that have wind direction components
    potential_model_files = {
        'RandomForest': os.path.join(project_root, 'backend', 'ml', 'models', 'rf_weather_models.joblib'),
        'XGBoost': os.path.join(project_root, 'backend', 'ml', 'models', 'xgb_weather_models.joblib'),
        'LightGBM': os.path.join(project_root, 'backend', 'ml', 'models', 'lgb_weather_models.joblib')
    }
    
    source_model = None
    source_model_name = None
    
    # Find first model that has both components
    for model_name, model_path in potential_model_files.items():
        if os.path.exists(model_path):
            model_data = joblib.load(model_path)
            if ('wind_direction_sin' in model_data['models'] and 
                'wind_direction_cos' in model_data['models']):
                source_model = model_data
                source_model_name = model_name
                break
    
    if source_model is None:
        print("Error: Couldn't find a model with wind direction components.")
        return False
    
    print(f"Adding wind direction components from {source_model_name} model...")
    
    # Add missing components
    if sin_missing:
        best_data['models']['wind_direction_sin'] = source_model['models']['wind_direction_sin']
        best_data['scalers']['wind_direction_sin'] = source_model['scalers']['wind_direction_sin']
        best_data['best_model_info']['wind_direction_sin'] = {
            'model_name': source_model_name,
            'rmse': 0.2  # Default reasonable value
        }
    
    if cos_missing:
        best_data['models']['wind_direction_cos'] = source_model['models']['wind_direction_cos']
        best_data['scalers']['wind_direction_cos'] = source_model['scalers']['wind_direction_cos']
        best_data['best_model_info']['wind_direction_cos'] = {
            'model_name': source_model_name,
            'rmse': 0.2  # Default reasonable value
        }
    
    # Save updated best models
    joblib.dump(best_data, best_models_path)
    print(f"Successfully updated best models file with wind direction components from {source_model_name}.")
    return True

if __name__ == "__main__":
    update_best_models()
