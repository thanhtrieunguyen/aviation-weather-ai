import joblib
import os

# Đường dẫn đến tệp mô hình

# Define model path
models_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'weather_models.joblib')

# Tải tệp mô hình
data = joblib.load(models_path)

# Kiểm tra nếu 'feature_list_for_scale' đang là None
if data['feature_list_for_scale'] is None:
    # Cập nhật danh sách đặc trưng
    data['feature_list_for_scale'] = [
        'hour', 'day', 'month', 'day_of_week', 'day_of_year',
        'temperature_lag_1', 'temperature_lag_2', 'temperature_lag_3',
        'temperature_rolling_mean_3', 'temperature_rolling_mean_6', 'temperature_rolling_mean_12',
        'humidity_lag_1', 'humidity_lag_2', 'humidity_lag_3',
        'humidity_rolling_mean_3', 'humidity_rolling_mean_6', 'humidity_rolling_mean_12',
        'wind_speed_lag_1', 'wind_speed_lag_2', 'wind_speed_lag_3',
        'wind_speed_rolling_mean_3', 'wind_speed_rolling_mean_6', 'wind_speed_rolling_mean_12',
        'pressure_lag_1', 'pressure_lag_2', 'pressure_lag_3',
        'pressure_rolling_mean_3', 'pressure_rolling_mean_6', 'pressure_rolling_mean_12',
        'precipitation_lag_1', 'precipitation_lag_2', 'precipitation_lag_3',
        'precipitation_rolling_mean_3', 'precipitation_rolling_mean_6', 'precipitation_rolling_mean_12',
        'cloud_lag_1', 'cloud_lag_2', 'cloud_lag_3',
        'cloud_rolling_mean_3', 'cloud_rolling_mean_6', 'cloud_rolling_mean_12',
        'uv_index_lag_1', 'uv_index_lag_2', 'uv_index_lag_3',
        'uv_index_rolling_mean_3', 'uv_index_rolling_mean_6', 'uv_index_rolling_mean_12',
        'visibility_lag_1', 'visibility_lag_2', 'visibility_lag_3',
        'visibility_rolling_mean_3', 'visibility_rolling_mean_6', 'visibility_rolling_mean_12',
        'rain_probability_lag_1', 'rain_probability_lag_2', 'rain_probability_lag_3',
        'rain_probability_rolling_mean_3', 'rain_probability_rolling_mean_6', 'rain_probability_rolling_mean_12',
        'dewpoint_lag_1', 'dewpoint_lag_2', 'dewpoint_lag_3',
        'dewpoint_rolling_mean_3', 'dewpoint_rolling_mean_6', 'dewpoint_rolling_mean_12',
        'airport_code_encoded'
    ]

    # Lưu lại tệp mô hình sau khi sửa
    joblib.dump(data, models_path)
    print("Successfully updated 'feature_list_for_scale' in the model file.")
else:
    print("'feature_list_for_scale' already has a value:", data['feature_list_for_scale'])
