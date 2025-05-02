import joblib
import os

# Define model path
models_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'weather_models.joblib')
data = joblib.load(models_path)

print("Keys in model file:", data.keys())
if 'feature_list_for_scale' in data:
    print("Feature list for scale:", data['feature_list_for_scale'])
else:
    print("Feature list for scale is missing!")

if 'models' in data:
    print("Models found:", list(data['models'].keys()))
else:
    print("Models are missing!")

if 'scalers' in data:
    print("Scalers found:", list(data['scalers'].keys()))
else:
    print("Scalers are missing!")

# Check if all models are present
expected_models = ['temperature', 'humidity', 'wind_speed', 'pressure', 'precipitation', 
                   'cloud', 'uv_index', 'visibility', 'rain_probability', 'dewpoint', 
                   'gust_speed', 'snow_probability', 'condition_code', 'wind_direction']
for model in expected_models:
    if model not in data['models']:
        print(f"Model for {model} is missing!")
    else:
        print(f"Model for {model} found.")
        
