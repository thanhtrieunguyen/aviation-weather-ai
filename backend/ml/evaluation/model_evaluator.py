import os
import sys
import pandas as pd
import numpy as np
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import logging

# Thêm đường dẫn gốc của dự án vào sys.path
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(project_root)


class ModelEvaluator:
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.metrics = {}
        self.feature_list_for_scale = None
        self.models_dir = os.path.join(project_root, 'backend', 'ml', 'models')
        self.categorical_targets = ['condition_code']
        self.numeric_targets = ['temperature', 'humidity', 'wind_speed', 'pressure',
                              'precipitation', 'cloud', 'uv_index', 'visibility',
                              'rain_probability', 'dewpoint', 'gust_speed',
                              'snow_probability']
        self.special_targets = {
            'wind_direction': {
                'sin': 'wind_direction_sin',
                'cos': 'wind_direction_cos'
            }
        }

    def load_models(self):
        """Load các model đã được train"""
        model_files = {
            'RandomForest': 'rf_weather_models.joblib',
            'XGBoost': 'xgb_weather_models.joblib',
            'LightGBM': 'lgb_weather_models.joblib'
        }
        
        for model_name, file_name in model_files.items():
            file_path = os.path.join(self.models_dir, file_name)
            if os.path.exists(file_path):
                model_data = joblib.load(file_path)
                self.models[model_name] = model_data['models']
                self.scalers[model_name] = model_data['scalers']
                
                # Lưu feature_list riêng cho từng mô hình
                if 'feature_list_for_scale' in model_data:
                    if not hasattr(self, 'feature_lists_for_models'):
                        self.feature_lists_for_models = {}
                    self.feature_lists_for_models[model_name] = model_data['feature_list_for_scale']
                    
                    # Vẫn giữ feature_list_for_scale chung (cho phương thức cũ)
                    if self.feature_list_for_scale is None:
                        self.feature_list_for_scale = model_data['feature_list_for_scale']
                
                print(f"Đã load model {model_name} từ {file_path}")
            else:
                print(f"Không tìm thấy file model {file_path}")

    def prepare_data(self, data_path, model_name=None):
        """Chuẩn bị dữ liệu để đánh giá với features phù hợp cho từng mô hình"""
        df = pd.read_csv(data_path)
        
        # Chuyển đổi hướng gió từ góc sang dạng vector (sin, cos)
        df['wind_direction_sin'] = np.sin(np.radians(df['wind_direction']))
        df['wind_direction_cos'] = np.cos(np.radians(df['wind_direction']))
        
        # Sử dụng feature list cụ thể cho mô hình được chỉ định
        feature_columns = None
        if model_name and hasattr(self, 'feature_lists_for_models') and model_name in self.feature_lists_for_models:
            feature_columns = self.feature_lists_for_models[model_name]
        else:
            feature_columns = self.feature_list_for_scale
        
        # Kiểm tra và xử lý các cột bị thiếu
        if feature_columns:
            missing_cols = [col for col in feature_columns if col not in df.columns]
            if missing_cols:
                print(f"Cảnh báo: Đang thêm các cột bị thiếu cho model {model_name}: {missing_cols}")
                for col in missing_cols:
                    df[col] = 0
        
        # Tách features và targets
        target_columns = self.numeric_targets + self.categorical_targets + list(self.special_targets.keys())
        
        if feature_columns:
            X = df[feature_columns]
        else:
            # Fallback nếu không có feature_columns
            X = df.drop(columns=target_columns, errors='ignore') 
        
        y_dict = {target: df[target] for target in target_columns if target in df.columns}
        
        # Thêm các targets đặc biệt (như wind_direction_sin, wind_direction_cos)
        for target, components in self.special_targets.items():
            for component_name, df_col in components.items():
                if df_col in df.columns:
                    y_dict[f"{target}_{component_name}"] = df[df_col]
        
        return X, y_dict

    # Thêm hàm mới để xử lý việc scale và định dạng dữ liệu phù hợp cho từng loại mô hình
    def _prepare_scaled_data(self, model_name, target, model_X, scaler, features):
        """Chuẩn bị dữ liệu đã scale với định dạng phù hợp cho từng loại mô hình"""
        # Scale dữ liệu
        X_scaled_values = scaler.transform(model_X[features])
        
        # Với LightGBM, cần trả về DataFrame với tên cột để tránh cảnh báo
        if model_name == 'LightGBM':
            return pd.DataFrame(
                X_scaled_values,
                columns=features,
                index=model_X.index
            )
        # Với RandomForest và XGBoost, có thể dùng numpy array
        else:
            return X_scaled_values

    def evaluate_models(self, data_path, X, y_dict):
        """Đánh giá từng mô hình với danh sách feature phù hợp"""
        for model_name in self.models.keys():
            print(f"\nĐang đánh giá model {model_name}...")
            
            # Chuẩn bị dữ liệu riêng cho từng mô hình
            model_X, model_y_dict = self.prepare_data(data_path, model_name)
            
            self.metrics[model_name] = {}
            
            # Đánh giá cho các biến số thông thường
            for target in self.numeric_targets:
                if target not in model_y_dict:
                    continue
                
                try:
                    # Đảm bảo có danh sách tính năng phù hợp
                    feature_list = None
                    if hasattr(self, 'feature_lists_for_models') and model_name in self.feature_lists_for_models:
                        feature_list = self.feature_lists_for_models[model_name]
                    else:
                        feature_list = self.feature_list_for_scale
                    
                    # Đảm bảo tất cả tính năng đều có trong dữ liệu
                    available_features = [f for f in feature_list if f in model_X.columns]
                    
                    # Dùng hàm mới để chuẩn bị dữ liệu đã scale với định dạng phù hợp
                    X_scaled = self._prepare_scaled_data(
                        model_name, 
                        target, 
                        model_X, 
                        self.scalers[model_name][target], 
                        available_features
                    )
                    
                    # Dự đoán
                    y_pred = self.models[model_name][target].predict(X_scaled)
                    y_true = model_y_dict[target]
                    
                    # Tính metrics
                    self.metrics[model_name][target] = self._calculate_metrics(y_true, y_pred)
                except Exception as e:
                    print(f"Lỗi khi đánh giá {model_name} cho {target}: {e}")
                    # Thiết lập metric mặc định
                    self.metrics[model_name][target] = {
                        'rmse': float('inf'),
                        'r2': 0,
                        'mae': float('inf')
                    }

    def _evaluate_wind_direction(self, model_name, X, y_true):
        """Đánh giá riêng cho wind_direction"""
        try:
            # Scale features
            X_scaled = self.scalers[model_name]['wind_direction_sin'].transform(X[self.feature_list_for_scale])
            
            # Dự đoán sin và cos
            y_pred_sin = self.models[model_name]['wind_direction_sin'].predict(X_scaled)
            y_pred_cos = self.models[model_name]['wind_direction_cos'].predict(X_scaled)
            
            # Chuyển từ sin/cos về góc
            y_pred = np.degrees(np.arctan2(y_pred_sin, y_pred_cos)) % 360
            
            # Tính circular metrics cho wind direction
            mae = self._calculate_circular_mae(y_true, y_pred)
            rmse = self._calculate_circular_rmse(y_true, y_pred)
            
            self.metrics[model_name]['wind_direction'] = {
                'MAE': mae,
                'RMSE': rmse
            }
            
            # Lưu kết quả vào file csv
            self._save_prediction_results('wind_direction', y_true, y_pred, model_name)
            
            return mae, rmse
        except Exception as e:
            print(f"Lỗi khi đánh giá wind_direction cho {model_name}: {str(e)}")
            self.metrics[model_name]['wind_direction'] = {
                'MAE': float('inf'),
                'RMSE': float('inf')
            }
            return float('inf'), float('inf')

    def _calculate_metrics(self, y_true, y_pred):
        """Tính các metrics cơ bản"""
# Calculate MAPE, handling division by zero
        with np.errstate(divide='ignore', invalid='ignore'):
            mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
            mape = np.nan_to_num(mape, nan=float('inf'))  # Replace NaN with infinity
        
        return {
            'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
            'r2': r2_score(y_true, y_pred),
            'mae': mean_absolute_error(y_true, y_pred),
            'mape': mape
        }

    def _calculate_circular_mae(self, y_true, y_pred):
        """Tính MAE cho dữ liệu góc"""
        diff = np.abs(y_true - y_pred)
        diff = np.where(diff > 180, 360 - diff, diff)
        return np.mean(diff)

    def _calculate_circular_rmse(self, y_true, y_pred):
        """Tính RMSE cho dữ liệu góc"""
        diff = np.abs(y_true - y_pred)
        diff = np.where(diff > 180, 360 - diff, diff)
        return np.sqrt(np.mean(np.square(diff)))

    def compare_models(self):
        """So sánh các mô hình và trả về kết quả"""
        results = pd.DataFrame()
        
        # Lấy danh sách tất cả các target từ tất cả các mô hình
        all_targets = set()
        for model_name in self.metrics:
            all_targets.update(self.metrics[model_name].keys())
        
        for target_name in sorted(all_targets):
            target_results = []
            
            for model_name in self.models.keys():
                # Kiểm tra xem model có metrics cho target này không
                if target_name in self.metrics.get(model_name, {}):
                    metrics = self.metrics[model_name][target_name]
                    target_results.append({
                        'Target': target_name,
                        'Model': model_name,
                        'RMSE': metrics['rmse'],
                        'R2': metrics['r2'],
                        'MAE': metrics['mae'],
                        'MAPE': metrics.get('mape', float('inf'))  # Sử dụng get để tránh lỗi nếu không có MAPE
                    })
            
            if target_results:  # Chỉ thêm vào kết quả nếu có dữ liệu
                target_df = pd.DataFrame(target_results)
                results = pd.concat([results, target_df], ignore_index=True)
        
        # Lưu kết quả so sánh
        results_dir = os.path.join(project_root, 'backend', 'ml', 'evaluation', 'results')
        os.makedirs(results_dir, exist_ok=True)
        
        # Lưu dưới dạng CSV và Excel
        results.to_csv(os.path.join(results_dir, 'model_comparison.csv'), index=False)
        results.to_excel(os.path.join(results_dir, 'model_comparison.xlsx'), index=False)
        
        return results

    def get_best_models(self):
        """Xác định model tốt nhất cho từng target dựa trên RMSE"""
        best_models = {}
        for target in self.metrics['RandomForest'].keys():
            best_rmse = float('inf')
            best_model = None
            
            for model_name in self.models.keys():
                rmse = self.metrics[model_name][target]['rmse']
                if rmse < best_rmse:
                    best_rmse = rmse
                    best_model = model_name
                    
            best_models[target] = {
                'model_name': best_model,
                'rmse': best_rmse
            }
        
        return best_models

    def save_best_model(self):
        """Lưu model tốt nhất cho từng target"""
        best_models = self.get_best_models()
        result_models = {}
        result_scalers = {}
        
        for target, info in best_models.items():
            model_name = info['model_name']
            result_models[target] = self.models[model_name][target]
            result_scalers[target] = self.scalers[model_name][target]
        
        data_to_save = {
            'models': result_models,
            'scalers': result_scalers,
            'feature_list_for_scale': self.feature_list_for_scale,
            'best_model_info': best_models
        }
        
        best_model_path = os.path.join(self.models_dir, 'best_weather_models.joblib')
        joblib.dump(data_to_save, best_model_path)
        print(f"\nĐã lưu các model tốt nhất vào {best_model_path}")
        return data_to_save

    def evaluate_on_real_data(self, real_data_path=None, historical_data_path=None, prediction_time=None):
        """
        Đánh giá mô hình với dữ liệu thời tiết thực tế từ API.
        
        Parameters:
        -----------
        real_data_path : str, optional
            Đường dẫn file CSV chứa dữ liệu thực tế (không dùng nếu sử dụng API).
        historical_data_path : str
            Đường dẫn đến file dữ liệu lịch sử.
        prediction_time : str
            Thời điểm dự báo (định dạng: 'YYYY-MM-DD HH:MM:SS'). 
            Nếu None, sử dụng thời điểm hiện tại.
        
        Returns:
        --------
        dict
            Dictionary chứa kết quả đánh giá với các chỉ số độ chính xác.
        """
        try:
            # Import các module cần thiết
            from datetime import datetime, timedelta
            from dotenv import load_dotenv
            import os
            import sys
            import json
            import numpy as np
            
            # Custom JSON encoder to handle NumPy data types
            class NumpyEncoder(json.JSONEncoder):
                def default(self, obj):
                    if isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
                        return int(obj)
                    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
                        return float(obj)
                    elif isinstance(obj, np.ndarray):
                        return obj.tolist()
                    return super(NumpyEncoder, self).default(obj)
            
            # Thêm đường dẫn để import module dự báo
            current_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.abspath(os.path.join(current_dir, '../../..'))
            sys.path.append(project_root)
            
            from backend.ml.prediction.weather_prediction import get_current_weather
            
            # Đảm bảo mô hình đã được tải
            if not self.models:
                print("Đang tải mô hình...")
                self.load_models()
                if not self.models:
                    print("Không có mô hình. Vui lòng huấn luyện mô hình trước.")
                    return None

            # Tải biến môi trường và lấy API key
            load_dotenv()
            WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
            if not WEATHER_API_KEY:
                print("Lỗi: Không tìm thấy WEATHER_API_KEY trong biến môi trường")
                return None

            # Xác định thời điểm dự báo (hiện tại)
            current_dt = datetime.now()
            
            # Xác định thời điểm dữ liệu lịch sử (1 giờ trước)
            historical_dt = current_dt - timedelta(hours=1)
            
            if prediction_time and prediction_time.lower() != 'now':
                # Sử dụng thời gian được chỉ định làm thời điểm hiện tại
                current_dt = pd.to_datetime(prediction_time)
                historical_dt = current_dt - timedelta(hours=1)
            
            formatted_current_time = current_dt.strftime('%Y-%m-%d %H:%M:%S')
            formatted_historical_time = historical_dt.strftime('%Y-%m-%d %H:%M:%S')
            
            print(f"Đánh giá mô hình: Sử dụng dữ liệu từ {formatted_historical_time} để dự báo cho {formatted_current_time}")
            
            # Tải dữ liệu lịch sử cho ngữ cảnh
            hist_df = pd.read_csv(historical_data_path)
            
            # Kiểm tra và xử lý cột thời gian (hỗ trợ cả 'datetime' và 'timestamp')
            time_column = None
            if 'datetime' in hist_df.columns:
                time_column = 'datetime'
            elif 'timestamp' in hist_df.columns:
                time_column = 'timestamp'
            else:
                print("Lỗi: Không tìm thấy cột thời gian ('datetime' hoặc 'timestamp') trong dữ liệu lịch sử.")
                return None
            
            # Đảm bảo định dạng datetime nhất quán trong dữ liệu lịch sử
            hist_df[time_column] = pd.to_datetime(hist_df[time_column]).dt.strftime('%Y-%m-%d %H:%M:%S')
            
            # Lấy danh sách vị trí để lấy dữ liệu thực tế
            locations = hist_df[['latitude', 'longitude']].drop_duplicates().values
            
            if len(locations) == 0:
                print("Không tìm thấy vị trí trong dữ liệu lịch sử")
                return None
            
            actual_values = {}   # Dữ liệu thực tế hiện tại
            predictions = {}     # Dự báo từ dữ liệu 1 giờ trước
            model_accuracy = {}
            target_accuracy = {}
            model_count = {}
            
            for lat, lon in locations:
                location = f"{lat},{lon}"
                print(f"Lấy dữ liệu thực tế cho vị trí {location}...")
                
                # Lấy dữ liệu thời tiết hiện tại từ API (tại thời điểm dự báo)
                current_weather = get_current_weather(WEATHER_API_KEY, location)
                if not current_weather:
                    print(f"Không thể lấy dữ liệu thời tiết hiện tại cho vị trí {location}")
                    continue
                
                # Lấy các giá trị thực tế
                targets_map = {
                    'temperature': 'temperature',
                    'humidity': 'humidity',
                    'wind_speed': 'wind_speed',
                    'pressure': 'pressure', 
                    'precipitation': 'precipitation',
                    'cloud': 'cloud',
                    'visibility': 'visibility',
                    'uv_index': 'uv_index',
                    'dewpoint': 'dewpoint',
                    'condition_code': 'condition_code',
                    'wind_direction': 'wind_direction',
                    'gust_speed': 'gust_speed',
                    'rain_probability': 'rain_probability', 
                    'snow_probability': 'snow_probability'
                }
                
                # Ánh xạ giá trị từ API vào actual_values
                for target, api_key in targets_map.items():
                    if api_key in current_weather:
                        if target not in actual_values:
                            actual_values[target] = {}
                        
                        actual_values[target][location] = current_weather[api_key]
                
                # Dự báo cho vị trí này với các mô hình đã tải
                # Sử dụng dữ liệu từ 1 giờ trước để dự báo cho hiện tại
                for target in actual_values:
                    if target not in predictions:
                        predictions[target] = {}
                    
                    for model_name in self.models:
                        if target in self.models[model_name]:
                            # Chuẩn bị dữ liệu cho dự báo
                            # Filter data to only include data before historical time (1 hour ago)
                            hist_filtered = hist_df[(hist_df['latitude'] == lat) & 
                                                (pd.to_datetime(hist_df[time_column]) < formatted_historical_time)]
                            
                            if hist_filtered.empty:
                                print(f"Không có đủ dữ liệu lịch sử cho vị trí {location} trước {formatted_historical_time}")
                                continue
                                
                            X_pred = self._prepare_prediction_data(
                                hist_filtered,
                                historical_dt,  # Dự báo từ điểm thời gian 1 giờ trước
                                model_name, 
                                target,
                                time_column
                            )
                            
                            if X_pred is not None:
                                if target not in predictions:
                                    predictions[target] = {}
                                if model_name not in predictions[target]:
                                    predictions[target][model_name] = {}
                                
                                try:
                                    # Dự báo
                                    pred_value = self.models[model_name][target].predict(X_pred)[0]
                                    # Chuyển đổi tất cả các kiểu NumPy thành kiểu Python cơ bản
                                    if isinstance(pred_value, (np.integer, np.floating)):
                                        pred_value = float(pred_value)
                                    predictions[target][model_name][location] = pred_value
                                except Exception as e:
                                    print(f"Lỗi khi dự báo {target} với {model_name}: {str(e)}")
                                    continue

            # Tính độ chính xác cho từng mô hình và target
            for target in actual_values:
                target_accuracy[target] = {}
                
                for model_name in self.models:
                    if (target in self.models[model_name] and 
                        target in predictions and 
                        model_name in predictions[target]):
                        
                        target_accuracy[target][model_name] = 0
                        valid_predictions = 0
                        
                        for location in actual_values[target]:
                            if location not in predictions[target][model_name]:
                                continue
                                
                            actual = actual_values[target][location]
                            pred = predictions[target][model_name][location]
                            
                            # Tính độ chính xác dựa trên sai số
                            if target == 'wind_direction':
                                # Xử lý đặc biệt cho góc (hướng gió)
                                error = abs(pred - actual)
                                error = min(error, 360 - error)  # Lấy góc nhỏ nhất
                                accuracy = 100 * (1 - min(error / 180.0, 1.0))
                            elif target == 'condition_code':
                                # Với mã condition, chính xác hoặc sai hoàn toàn
                                accuracy = 100 if pred == actual else 0
                            else:
                                # Với các biến số khác, tính % độ chính xác dựa trên sai số tương đối
                                if abs(actual) < 0.001:  # Tránh chia cho 0
                                    error_percent = abs(pred - actual)
                                    accuracy = 100 if error_percent < 0.1 else max(0, 100 - error_percent * 10)
                                else:
                                    error_percent = abs((pred - actual) / actual)
                                    accuracy = max(0, 100 * (1 - min(error_percent, 1.0)))
                            
                            target_accuracy[target][model_name] += accuracy
                            valid_predictions += 1
                            
                            # Thêm vào tổng của model
                            if model_name not in model_accuracy:
                                model_accuracy[model_name] = 0
                                model_count[model_name] = 0
                            
                            model_accuracy[model_name] += accuracy
                            model_count[model_name] += 1
                        
                        # Tính trung bình độ chính xác cho target này
                        if valid_predictions > 0:
                            target_accuracy[target][model_name] /= valid_predictions

            # Tính trung bình độ chính xác cho từng model
            for model_name in model_accuracy:
                if model_count[model_name] > 0:
                    model_accuracy[model_name] /= model_count[model_name]
            
            # Xác định mô hình tốt nhất
            best_model = ("None", 0)
            if model_accuracy:
                best_model = max(model_accuracy.items(), key=lambda x: x[1])
            
            # Chuyển các kiểu dữ liệu NumPy thành kiểu Python cơ bản cho toàn bộ results
            def convert_numpy_types(obj):
                if isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
                    return int(obj)
                elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
                    return float(obj)
                elif isinstance(obj, np.ndarray):
                    return obj.tolist()
                elif isinstance(obj, dict):
                    return {k: convert_numpy_types(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_numpy_types(i) for i in obj]
                else:
                    return obj
            
            # Trả về kết quả
            results = {
                'accuracy': {
                    'target_accuracy': convert_numpy_types(target_accuracy),
                    'model_accuracy': convert_numpy_types(model_accuracy),
                    'best_model': best_model[0],
                    'best_accuracy': float(best_model[1])
                },
                'details': {
                    'actual_values': convert_numpy_types(actual_values),
                    'predictions': convert_numpy_types(predictions),
                    'locations': {str((lat, lon)): f"{lat},{lon}" for lat, lon in locations},
                    'evaluation_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'prediction_time': formatted_current_time,
                    'historical_time': formatted_historical_time
                }
            }
            
            # Lưu kết quả đánh giá
            results_dir = os.path.join(project_root, 'backend', 'ml', 'evaluation', 'results')
            os.makedirs(results_dir, exist_ok=True)
            
            # Lưu kết quả dưới dạng JSON
            evaluation_file = os.path.join(results_dir, f'api_evaluation_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
            with open(evaluation_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=4, cls=NumpyEncoder)
            
            print(f"Đã lưu kết quả đánh giá vào {evaluation_file}")
            
            return results
                
        except Exception as e:
            import traceback
            print(f"Lỗi khi đánh giá với dữ liệu thực tế: {e}")
            print(traceback.format_exc())  # In đầy đủ traceback để debug tốt hơn
            return None

    def _prepare_prediction_data(self, hist_df, prediction_dt, model_name, target, time_column='datetime'):
        """
        Helper method to prepare data for prediction.
        """
        try:
            from backend.ml.data.data_preprocessing import WeatherDataPreprocessor
            preprocessor = WeatherDataPreprocessor()
            
            # Format prediction time consistently
            formatted_prediction_time = prediction_dt.strftime('%Y-%m-%d %H:%M:%S')
            
            # Get data before prediction time
            df_before = hist_df[pd.to_datetime(hist_df[time_column]) < pd.to_datetime(formatted_prediction_time)]
            if len(df_before) == 0:
                print(f"No historical data found before {formatted_prediction_time}")
                return None
            
            # Check if we have enough historical data
            if len(df_before) < 12:
                print(f"Warning: Only {len(df_before)} historical data points found. At least 12 are recommended for lag/rolling features.")
            
            # Sort by time to ensure proper sequence
            df_before = df_before.sort_values(by=time_column)
            
            # Apply basic preprocessing
            df_before = preprocessor.extract_time_features(df_before)
            df_before = preprocessor.extract_season_features(df_before)
            
            # Add terrain features if missing
            if 'elevation_m' not in df_before.columns:
                df_before = preprocessor.add_terrain_features(df_before)
            
            # Calculate lag and rolling features - CRITICAL STEP
            lag_columns = ['temperature', 'humidity', 'wind_speed', 'pressure', 'precipitation', 
                          'cloud', 'uv_index', 'visibility', 'rain_probability', 'dewpoint', 
                          'gust_speed', 'snow_probability']
            
            # Only use columns that exist in our data
            available_columns = [col for col in lag_columns if col in df_before.columns]
            if available_columns:
                df_before = preprocessor.create_lag_and_rolling_features(df_before, available_columns)
            
            # Fill missing values
            df_before = preprocessor.handle_missing_values(df_before)
            
            # Get the last row with all features computed
            latest_data = df_before.iloc[-1:].copy()
            
            # Get feature list
            feature_list = None
            if hasattr(self, 'feature_lists_for_models') and model_name in self.feature_lists_for_models:
                feature_list = self.feature_lists_for_models[model_name]
            else:
                feature_list = self.feature_list_for_scale
            
            # Handle missing features
            missing_features = [f for f in feature_list if f not in latest_data.columns]
            if missing_features:
                print(f"Warning: Adding missing features: {missing_features}")
                for feat in missing_features:
                    latest_data[feat] = 0
            
            # Get features in correct order
            X = latest_data[feature_list]
            
            # Scale features
            if model_name in self.scalers and target in self.scalers[model_name]:
                X_scaled = self.scalers[model_name][target].transform(X)
                
                # Format output based on model type
                if model_name == 'LightGBM':
                    return pd.DataFrame(X_scaled, columns=feature_list, index=X.index)
                else:
                    return X_scaled
            else:
                print(f"Warning: No scaler found for {model_name}/{target}")
                return X.values
        
        except Exception as e:
            import traceback
            print(f"Error preparing prediction data: {e}")
            print(traceback.format_exc())
            return None

def main():
    """Hàm chính để thực thi việc đánh giá model"""
    print("Bắt đầu đánh giá các model dự báo thời tiết...")
    
    # Khởi tạo evaluator
    evaluator = ModelEvaluator()
    
    # Load các model đã train
    print("\nĐang load các model...")
    evaluator.load_models()
    
    # Chuẩn bị dữ liệu để đánh giá
    print("\nĐang chuẩn bị dữ liệu đánh giá...")
    data_path = os.path.join(project_root, 'backend', 'ml', 'data', 'weather_dataset_with_season_terrain.csv')
    X, y_dict = evaluator.prepare_data(data_path)
    
    # Đánh giá các model
    print("\nĐang đánh giá các model...")
    evaluator.evaluate_models(data_path, X, y_dict)
    
    # So sánh các model
    print("\nKết quả so sánh các model:")
    comparison_results = evaluator.compare_models()
    print(comparison_results)
    
    # Xác định và lưu model tốt nhất
    print("\nXác định model tốt nhất cho từng target...")
    best_models = evaluator.get_best_models()
    for target, info in best_models.items():
        print(f"{target}: {info['model_name']} (RMSE = {info['rmse']:.4f})")
    
    # Lưu model tốt nhất
    print("\nĐang lưu các model tốt nhất...")
    evaluator.save_best_model()

if __name__ == "__main__":
    main()
