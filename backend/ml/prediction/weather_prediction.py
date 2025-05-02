import os
import json
import requests
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
import sys
import math
import warnings

# Update the warning filter to be more specific and comprehensive
warnings.filterwarnings("ignore", category=UserWarning, 
                       message="X does not have valid feature names")
# Add specific filter for LightGBM warnings
warnings.filterwarnings("ignore", category=UserWarning, 
                       message="X does not have valid feature names, but LGBMRegressor was fitted with feature names")

current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(project_root)


from backend.ml.data.data_preprocessing import WeatherDataPreprocessor
from backend.ml.utils.condition_code_mapper import ConditionCodeMapper
from backend.ml.config.feature_config import FeatureManager
from backend.ml.utils.wind_direction_utils import convert_wind_components_to_direction, convert_wind_direction_to_symbol

# Đường dẫn đến các file dữ liệu
current_dir = os.path.dirname(os.path.abspath(__file__))
conditions_path = os.path.join(project_root, 'backend', 'ml', 'data', 'conditions.json')
airports_path = os.path.join(project_root, 'backend', 'ml', 'data', 'airports.json')

def get_current_weather(api_key, location):
    """Lấy thông tin thời tiết hiện tại từ API."""
    try:
        response = requests.get(
            f"http://api.weatherapi.com/v1/current.json?key={api_key}&q={location}&aqi=no"
        )
        data = response.json()
        
        current = data["current"]
        location_info = data["location"]
        
        result = {
            "timestamp": location_info["localtime"],
            "temperature": current["temp_c"],
            "humidity": current["humidity"],
            "wind_speed": current["wind_kph"],
            "wind_direction": current["wind_degree"],
            "wind_direction_symbol": current["wind_dir"],
            "pressure": current["pressure_mb"],
            "precipitation": current["precip_mm"],
            "cloud": current["cloud"],
            "visibility": current["vis_km"],
            "uv_index": current["uv"],
            "condition": {
                "code": current["condition"]["code"],
                "text": current["condition"]["text"],
                "icon": current["condition"]["icon"]
            },
            "gust_speed": current["gust_kph"],
            "dewpoint": current.get("dewpoint_c", 0),  # Có thể không có trong API
            "rain_probability": 0,  # Không có trong API current
            "snow_probability": 0,  # Không có trong API current
            "condition_code": current["condition"]["code"],
            "name": location_info["name"],
            "region": location_info["region"],
            "country": location_info["country"],
            "lat": location_info["lat"],
            "lon": location_info["lon"],
            "tz_id": location_info["tz_id"]
        }
        
        return result
    except Exception as e:
        print(f"Error fetching current weather: {e}")
        return None

class WeatherPredictionService:
    def __init__(self, model_path=None):
        """Khởi tạo dịch vụ dự báo thời tiết."""
        if model_path is None:
            # Mặc định sử dụng mô hình tốt nhất nếu có
            model_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            best_model_path = os.path.join(model_dir, 'models', 'best_weather_models.joblib')
            if os.path.exists(best_model_path):
                self.path = best_model_path
                print(f"Sử dụng mô hình tốt nhất từ: {best_model_path}")
            else:
                self.path = os.path.join(model_dir, 'models', 'rf_weather_models.joblib')
                print(f"Sử dụng mô hình RandomForest từ: {self.path}")
        else:
            self.path = model_path
        
        self.preprocessor = WeatherDataPreprocessor()
        # Model sẽ được load khi cần thiết để tiết kiệm bộ nhớ
        self.models = None
        self.scalers = None
        self.feature_list_for_scale = None
        self.best_model_info = None
        
        # Load model metadata để có thông tin về feature_list_for_scale
        self._load_model_metadata()

    def _load_model_metadata(self):
        """Load chỉ metadata của model mà không load toàn bộ model vào memory"""
        try:
            data = joblib.load(self.path)
            self.feature_list_for_scale = data.get('feature_list_for_scale')
            self.best_model_info = data.get('best_model_info')
            # Lấy loại mô hình
            self.model_type = data.get('model_type', 'RandomForest')  # Default to RandomForest if not specified
            
            if self.best_model_info:
                print("Đã tải thông tin mô hình tốt nhất:")
                for target, info in self.best_model_info.items():
                    print(f" - {target}: {info['model_name']} (RMSE = {info['rmse']:.4f})")
            return True
        except Exception as e:
            print(f"Không thể load model metadata từ {self.path}: {e}")
            return False

    def load_models(self):
        """Load models into memory when needed, with improved error handling and memory efficiency"""
        try:
            print(f"Loading models from {self.path}...")
            # Use 'mmap_mode' to reduce memory usage by memory-mapping the file
            data = joblib.load(self.path, mmap_mode='r')
            
            # Store only what's necessary
            self.models = data['models']
            self.scalers = data['scalers']
            self.feature_list_for_scale = data.get('feature_list_for_scale')
            self.best_model_info = data.get('best_model_info')
            self.model_type = data.get('model_type', 'RandomForest')
            
            # Log success
            print(f"Successfully loaded {self.model_type} models")
            return True
        except (FileNotFoundError, KeyError) as e:
            print(f"Error: Could not load model from {self.path}: {str(e)}")
            return False
        except Exception as e:
            print(f"Unexpected error loading model from {self.path}: {str(e)}")
            return False

    def get_historical_weather(self, api_key, location, hours=12):
        """Lấy dữ liệu thời tiết lịch sử trong n giờ qua."""
        try:
            # Lấy thời tiết hiện tại
            current_weather = get_current_weather(api_key, location)
            if not current_weather:
                return []
            
            # Lấy thời tiết lịch sử
            now = datetime.now()
            historical_data = [current_weather]  # Bắt đầu với thời tiết hiện tại
            
            # Đảm bảo lấy ít nhất 12 giờ để tính toán đầy đủ các đặc trưng lag và rolling
            required_hours = max(hours, 12)
            print(f"Fetching {required_hours} hours of historical data for feature calculation...")
            
            for i in range(1, required_hours):
                past_time = now - timedelta(hours=i)
                
                # Chuyển đổi định dạng ngày
                date_str = past_time.strftime("%Y-%m-%d")
                
                # Sử dụng API history
                try:
                    history_url = f"http://api.weatherapi.com/v1/history.json?key={api_key}&q={location}&dt={date_str}"
                    response = requests.get(history_url)
                    data = response.json()
                    
                    if 'forecast' in data and 'forecastday' in data['forecast']:
                        forecastday = data['forecast']['forecastday'][0]
                        hour_data = forecastday['hour'][past_time.hour]
                        
                        historical_point = {
                            "timestamp": hour_data['time'],
                            "airport_code": location,
                            "temperature": hour_data['temp_c'],
                            "humidity": hour_data['humidity'],
                            "wind_speed": hour_data['wind_kph'],
                            "wind_direction": hour_data['wind_degree'],
                            "wind_direction_symbol": hour_data['wind_dir'],
                            "pressure": hour_data['pressure_mb'],
                            "precipitation": hour_data['precip_mm'],
                            "cloud": hour_data['cloud'],
                            "visibility": hour_data['vis_km'],
                            "uv_index": hour_data.get('uv', 0),
                            "dewpoint": hour_data.get('dewpoint_c', 0),
                            "gust_speed": hour_data['gust_kph'],
                            "rain_probability": hour_data.get('chance_of_rain', 0),
                            "snow_probability": hour_data.get('chance_of_snow', 0),
                            "condition_code": hour_data['condition']['code'],
                        }
                        
                        historical_data.append(historical_point)
                except Exception as e:
                    print(f"Error fetching historical data for {date_str}, hour {past_time.hour}: {e}")
                    continue
            
            # Sắp xếp dữ liệu theo thời gian
            historical_data.sort(key=lambda x: x['timestamp'])
            
            # Verify we have enough data
            if len(historical_data) < 12:
                print(f"Warning: Only obtained {len(historical_data)} historical data points. " +
                      f"This may impact lag and rolling feature calculations.")
            else:
                print(f"Successfully collected {len(historical_data)} historical data points.")
            
            return historical_data
        except Exception as e:
            print(f"Error in get_historical_weather: {e}")
            return []

    def prepare_input(self, historical_data, future_time):
        """Chuẩn bị dữ liệu đầu vào cho dự báo từ dữ liệu lịch sử."""
        # Tạo DataFrame từ historical_data
        df = pd.DataFrame(historical_data)
        
        # Thêm các đặc trưng thời gian
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = self.preprocessor.extract_time_features(df)
        
        # Thêm đặc trưng mùa
        df = self.preprocessor.extract_season_features(df)
        
        # Xử lý các đặc trưng địa hình nếu cần
        df = self.preprocessor.add_terrain_features(df)
        
        # Mã hóa các biến categorical
        df = self.preprocessor.encode_categorical(df)
        
        # Tạo các đặc trưng lag và rolling
        columns = ['temperature', 'humidity', 'wind_speed', 'pressure', 'precipitation', 
                   'cloud', 'uv_index', 'visibility', 'rain_probability', 'dewpoint']
        df = self.preprocessor.create_lag_and_rolling_features(df, columns)
        
        # Xử lý giá trị thiếu
        df = self.preprocessor.handle_missing_values(df)
        
        # Chọn hàng dữ liệu cuối cùng (mới nhất) để dự báo
        last_row = df.iloc[-1:].copy()
        
        # Cập nhật timestamp thành thời gian tương lai cần dự báo
        # Đảm bảo future_time là đối tượng datetime
        if isinstance(future_time, (int, float, str)):
            try:
                future_time = pd.to_datetime(future_time)
            except:
                # Nếu không thể convert, sử dụng datetime hiện tại
                future_time = datetime.now()
        
        last_row['timestamp'] = future_time
        
        # Cập nhật các đặc trưng thời gian
        last_row = self.preprocessor.extract_time_features(last_row)
        last_row = self.preprocessor.extract_season_features(last_row)
        
        # Chọn các cột cần thiết
        input_features = [col for col in last_row.columns if col in self.feature_list_for_scale]
        input_data = last_row[input_features]
        return input_data

    def convert_wind_direction_to_symbol(self, degree):
        """Chuyển đổi hướng gió từ độ sang ký hiệu la bàn."""
        return convert_wind_direction_to_symbol(degree)

    def convert_wind_components_to_direction(self, wind_sin, wind_cos):
        """Chuyển đổi từ các giá trị sin, cos sang hướng gió (độ)"""
        return convert_wind_components_to_direction(wind_sin, wind_cos)

    def get_condition_info(self, condition_code, is_day=1):
        """
        Get condition information (text description and icon) based on condition code
        
        Args:
            condition_code (int): Weather condition code
            is_day (int): Whether it's daytime (1) or nighttime (0)
            
        Returns:
            dict: Condition information including text description and icon
        """
        # Get the condition text from the mapper
        condition_text = ConditionCodeMapper.get_condition_text(condition_code)
        
        # Map condition code to appropriate icon
        # Default icon naming pattern (most weather services use this pattern)
        base_icon_name = f"{condition_code:03d}"
        icon_time = "day" if is_day else "night"
        icon = f"{base_icon_name}_{icon_time}"
        
        return {
            "condition_text": condition_text,
            "icon": icon,
            "condition_code": condition_code
        }
        
    def fix_timestamp_handling(self, historical_data):
        """Standardize timestamp format in historical data to avoid parsing errors"""
        for item in historical_data:
            if isinstance(item['timestamp'], str):
                try:
                    dt = pd.to_datetime(item['timestamp'])
                    item['timestamp'] = dt.isoformat()
                except Exception as e:
                    print(f"Error standardizing timestamp '{item['timestamp']}': {e}")
                    # Nếu không chuyển đổi được, sử dụng thời gian hiện tại
                    item['timestamp'] = datetime.now().isoformat()
        return historical_data

    def predict(self, api_key, location, prediction_hours=24):
        """Dự báo thời tiết cho n giờ tiếp theo."""
        # Apply warning filter directly in the prediction method
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=UserWarning)
            warnings.filterwarnings("ignore", category=UserWarning, 
                                 message="X does not have valid feature names, but LGBMRegressor was fitted with feature names")
            
            if not self.models:
                # Load model ngay khi cần
                if not self.load_models():
                    return {"error": "Không thể tải mô hình dự báo"}
            
            # Extract lat, lon from the user input for precision
            lat, lon = map(float, location.split(','))
            
            # Lấy dữ liệu thời tiết lịch sử
            historical_data = self.get_historical_weather(api_key, location, hours=12)
            if not historical_data:
                return {"error": "Không lấy được dữ liệu lịch sử"}
            
            historical_data = self.fix_timestamp_handling(historical_data)
            
            # Updated location_data using precise input coordinates instead of possibly rounded values from API
            location_info = historical_data[0]
            location_data = {
                "name": location_info.get("name", "Unknown"),
                "region": location_info.get("region", ""),
                "country": location_info.get("country", ""),
                "lat": lat,
                "lon": lon,
                "tz_id": location_info.get("tz_id", ""),
                "localtime": location_info.get("timestamp", ""),
            }

            # Thêm thông tin airport nếu có
            try:
                with open(airports_path, 'r', encoding='utf-8') as file:
                    airports = json.load(file)
                
                for airport in airports:
                    airport_lat = airport.get('latitude')
                    airport_lon = airport.get('longitude')
                    if airport_lat and airport_lon and abs(lat - float(airport_lat)) < 0.01 and abs(lon - float(airport_lon)) < 0.01:
                        location_data["airport"] = {
                            "name": airport.get("name", ""),
                            "icao": airport.get("icao", ""),
                            "iata": airport.get("iata", ""),
                            "elevation": airport.get("elevation", 0),
                            "terrain": airport.get("terrain", "")
                        }
                        break
            except Exception as e:
                print(f"Lỗi khi tìm thông tin sân bay: {e}")
            
            # Tạo timestamp cho các thời điểm dự báo
            current_time = datetime.now().replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
            future_times = [current_time + timedelta(hours=i) for i in range(prediction_hours)]
            
            predictions = []

            for future_time in future_times:
                # Chuẩn bị dữ liệu đầu vào (dựa trên historical_data hiện tại)
                input_data = self.prepare_input(historical_data, future_time)
                # Convert column names to strings to avoid .replace error
                

                # Dự báo cho từng mục tiêu (temperature, humidity, ...) ngoại trừ condition_code
                prediction = {}
                
                # Track whether we need to calculate wind direction from components
                has_wind_direction = False
                has_wind_components = False
                
                for target, model in self.models.items():
                    # Bỏ qua dự đoán condition_code từ model
                    if target == 'condition_code':
                        continue
                        
                    try:
                        # Add another nested warning filter specifically for the predict call
                        with warnings.catch_warnings():
                            warnings.filterwarnings("ignore", category=UserWarning)
                            
                            scaler = self.scalers[target]
                            target_input = input_data.copy()
                            # Đảm bảo thứ tự các tính năng đúng như lúc huấn luyện
                            target_input = FeatureManager.ensure_feature_order(input_data.copy(), target, self.model_type)
                            is_lgbm = 'lightgbm' in str(type(model)).lower()
                
                            if is_lgbm:
                                # Special handling for LightGBM models
                                # Get feature names from the model if available
                                feature_names = getattr(model, 'feature_name_', None)
                                
                                if feature_names is not None:
                                    # Ensure input data has exactly these columns in this order
                                    features_to_use = [col for col in feature_names if col in input_data.columns]
                                    
                                    # Create data frame with expected column names
                                    model_input = input_data[features_to_use].copy()
                                    # Scale the data
                                    model_input_scaled = scaler.transform(model_input)
                                    
                                    # If we need to pass feature names to predict
                                    prediction[target] = round(float(model.predict(model_input_scaled)[0]), 1)
                                else:
                                    # Fallback to standard approach
                                    input_data_for_model = FeatureManager.ensure_feature_order(input_data.copy(), target, self.model_type)
                                    input_data_scaled = scaler.transform(input_data_for_model)
                                    prediction[target] = round(float(model.predict(input_data_scaled)[0]), 1)
                            else:
                                # Standard approach for non-LightGBM models
                                input_data_for_model = FeatureManager.ensure_feature_order(input_data.copy(), target, self.model_type)
                                input_data_scaled = scaler.transform(input_data_for_model)
                                prediction[target] = round(float(model.predict(input_data_scaled)[0]), 1)
                        
                        # Track wind direction related values
                        if target == 'wind_direction':
                            has_wind_direction = True
                            prediction['wind_direction_symbol'] = self.convert_wind_direction_to_symbol(prediction[target])
                        elif target == 'wind_direction_sin':
                            has_wind_components = True
                        elif target == 'wind_direction_cos':
                            has_wind_components = True
                        
                    except Exception as e:
                        print(f"Lỗi khi tạo dự báo cho {target} với mô hình {self.model_type}: {str(e)}")
                        # If we can't predict this target, skip it but continue with others
                        if target in ['wind_direction_sin', 'wind_direction_cos']:
                            has_wind_components = False
                
                # Handle wind direction calculation/fallback
                if not has_wind_direction:
                    # Try to calculate wind direction from components
                    if has_wind_components and 'wind_direction_sin' in prediction and 'wind_direction_cos' in prediction:
                        try:
                            wind_dir = self.convert_wind_components_to_direction(
                                prediction['wind_direction_sin'], 
                                prediction['wind_direction_cos']
                            )
                            prediction['wind_direction'] = round(wind_dir, 0)
                            prediction['wind_direction_symbol'] = self.convert_wind_direction_to_symbol(prediction['wind_direction'])
                        except Exception as e:
                            print(f"Lỗi khi tính toán hướng gió từ sin/cos: {str(e)}")
                            prediction['wind_direction'] = 0.0
                            prediction['wind_direction_symbol'] = 'N'
                    else:
                        # If neither direct wind direction nor components are available, use default
                        print(f"Thiếu thành phần hướng gió sin/cos trong dự báo. Sử dụng giá trị mặc định.")
                        prediction['wind_direction'] = 0.0
                        prediction['wind_direction_symbol'] = 'N'
                        # To ensure consistency, also provide sin/cos components
                        prediction['wind_direction_sin'] = 0.0
                        prediction['wind_direction_cos'] = 1.0  # North = 0 degrees = cos(0)=1, sin(0)=0

                # Đảm bảo giá trị không âm
                for key in ['temperature', 'humidity', 'wind_speed', 'pressure', 'visibility', 'uv_index']:
                    if key in prediction and prediction[key] < 0:
                        prediction[key] = 0
                        
                # Giá trị humidity không vượt quá 100%
                if 'humidity' in prediction and prediction['humidity'] > 100:
                    prediction['humidity'] = 100
                    
                # Xác định condition_code dựa trên các thông số dự báo
                temp = prediction.get('temperature', 0)
                humidity = prediction.get('humidity', 0)
                wind_speed = prediction.get('wind_speed', 0)
                precip_mm = prediction.get('precipitation', 0)
                cloud = prediction.get('cloud', 0)
                visibility = prediction.get('visibility', 10) # giá trị mặc định 10km nếu không có
                pressure = prediction.get('pressure', 1013) # giá trị mặc định 1013hPa nếu không có
                is_day = 1 if 6 <= future_time.hour <= 18 else 0
                
                # Sử dụng ConditionCodeMapper để xác định condition_code
                condition_code = ConditionCodeMapper.get_condition_code(
                    precipitation=precip_mm,
                    temp=temp,
                    humidity=humidity,
                    wind_speed=wind_speed,
                    cloud_cover=cloud,
                    visibility=visibility,
                    pressure=pressure,
                    is_day=is_day
                )
                
                # Lấy thông tin chi tiết về condition
                condition_info = self.get_condition_info(condition_code, is_day)
                
                condition = {
                    "code": condition_info["condition_code"],
                    "text": condition_info["condition_text"],
                    "icon": condition_info["icon"]
                }

                # Thêm condition_code vào dữ liệu dự báo để dùng cho historical_data
                prediction['condition_code'] = condition_code
                    
                # Lưu kết quả dự báo vào historical_data
                historical_data.append({
                    'timestamp': future_time.isoformat(),  # Lưu dưới dạng chuỗi ISO format
                    'airport_code': location,
                    **prediction,  # Thêm các giá trị dự báo vào historical_data
                    'wind_direction_symbol': prediction.get('wind_direction_symbol', 'N'),
                })

                # Cập nhật lại các đặc trưng lag và rolling
                df_historical = pd.DataFrame(historical_data)
                # Explicitly specify ISO8601 format for timestamp parsing
                df_historical['timestamp'] = pd.to_datetime(df_historical['timestamp']) 
                df_historical = self.preprocessor.extract_time_features(df_historical)
                columns = ['temperature', 'humidity', 'wind_speed', 'pressure', 
                        'precipitation', 'cloud', 'uv_index', 'visibility', 
                        'rain_probability', 'dewpoint']
                df_historical = self.preprocessor.create_lag_and_rolling_features(df_historical, columns)
                df_historical = self.preprocessor.handle_missing_values(df_historical)
                historical_data = df_historical.to_dict(orient='records')  # Cập nhật lại historical_data

                # Lưu kết quả dự báo
                predictions.append({
                    "timestamp": future_time.isoformat(),
                    "temperature": prediction.get("temperature", 0),
                    "humidity": prediction.get("humidity", 0),
                    "wind_speed": prediction.get("wind_speed", 0),
                    "wind_direction": prediction.get("wind_direction", 0),
                    "wind_direction_symbol": prediction.get("wind_direction_symbol", "N"),
                    "pressure": prediction.get("pressure", 1013),
                    "precipitation": prediction.get("precipitation", 0),
                    "cloud": prediction.get("cloud", 0),
                    "uv_index": prediction.get("uv_index", 0),
                    "visibility": prediction.get("visibility", 10),
                    "condition": condition,
                    "condition_code": condition_code,  # Thêm condition_code vào kết quả
                    "dewpoint": prediction.get("dewpoint", 0),
                    "gust_speed": prediction.get("gust_speed", 0),
                    "rain_probability": prediction.get("rain_probability", 0),
                    "snow_probability": prediction.get("snow_probability", 0),
                    # Chọn một model_info phù hợp để hiển thị
                    "model_info": self.best_model_info.get("temperature", {}) if self.best_model_info else {}
                })
            
            # Trả về kết quả dự báo kèm thông tin địa điểm
            return {
                "location": location_data,
                "current_weather": historical_data[0] if len(historical_data) > 0 else {},
                "forecasts": predictions
            }

# Example usage
if __name__ == "__main__":
    # model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models', 'weather_models.joblib'))
    # prediction_service = WeatherPredictionService(model_path)
    # api_key = 'a5b32b6e884e4b5aa5b95910241712'
    # location = '12.668299675,108.120002747'
    # output = prediction_service.predict(api_key, location, prediction_hours=24)
    # print(json.dumps(output, indent=4, ensure_ascii=False))
    pass
