import os
import sys
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, mean_absolute_percentage_error
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
from tqdm import tqdm

# Thêm đường dẫn gốc của dự án vào sys.path
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(project_root)

from backend.ml.data.data_preprocessing import WeatherDataPreprocessor
from backend.ml.config.feature_config import FeatureManager

class RandomForestTrainer:
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=300,           # Tăng số cây để đảm bảo độ chính xác
            max_depth=15,               # Giữ vừa phải để tránh overfitting
            min_samples_split=5,        # Tránh phân tách nhánh quá sớm
            min_samples_leaf=10,        # Giúp mô hình ổn định hơn
            max_features='sqrt',        # Giảm overfitting
            bootstrap=True,             # Dùng bootstrap sampling
            random_state=42,
            n_jobs=-1
        )

        self.preprocessor = WeatherDataPreprocessor()
        self.feature_list_for_scale = None
        self.models = {}
        self.scalers = {}
        self.metrics = {}

    def prepare_data(self, data_path):
        """Prepare data for training."""
        print("Đang tiền xử lý dữ liệu...")
        df = self.preprocessor.preprocess(data_path)
        
        # Chuyển đổi hướng gió từ góc sang dạng vector (sin, cos)
        df['wind_direction_sin'] = np.sin(np.radians(df['wind_direction']))
        df['wind_direction_cos'] = np.cos(np.radians(df['wind_direction']))
        
        # Loại bỏ condition_code và wind_direction khỏi danh sách targets
        # Thêm wind_direction_sin và wind_direction_cos thay cho wind_direction
        targets = ['temperature', 'humidity', 'wind_speed', 'pressure', 
                  'precipitation', 'cloud', 'uv_index', 'visibility', 
                  'rain_probability', 'dewpoint', 'gust_speed', 'snow_probability',
                  'wind_direction_sin', 'wind_direction_cos']  # Thay thế wind_direction

        X = df.drop(targets + ['wind_direction'], axis=1)  # Loại bỏ wind_direction từ features
        y_dict = {target: df[target] for target in targets}
            
        # Tạo feature_list_for_scale sau khi tách target
        feature_list_for_scale = [col for col in X.columns if col not in targets and col != 'condition_code']
        self.feature_list_for_scale = feature_list_for_scale

        return X, y_dict, feature_list_for_scale

    def train(self, X, y_dict, feature_list_for_scale):
        """Train models for each weather parameter."""
        print("Đang huấn luyện mô hình...")
        
        # Track if we have trained both wind direction components to generate the plot later
        sin_completed = False
        cos_completed = False
        
        for target_name, y in tqdm(y_dict.items()):
            print(f"\nĐang huấn luyện mô hình cho {target_name}...")
            
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.3, random_state=42
            )

            # Scale data - chú ý cách scale dữ liệu đúng
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train[feature_list_for_scale])
            X_test_scaled = scaler.transform(X_test[feature_list_for_scale])
            
            self.scalers[target_name] = scaler

            # Train model
            if target_name == 'wind_direction':
                # Giảm số lượng job để giảm bộ nhớ dùng cho mô hình wind_direction
                model = RandomForestRegressor(
                    n_estimators=300,
                    max_depth=15,
                    min_samples_split=5,
                    min_samples_leaf=10,
                    max_features='sqrt',
                    bootstrap=True,
                    random_state=42,
                    n_jobs=1   # thay đổi n_jobs thành 1 cho mục wind_direction
                )
            else:
                model = RandomForestRegressor(
                    n_estimators=300,           # Tăng số cây để đảm bảo độ chính xác
                    max_depth=15,               # Giữ vừa phải để tránh overfitting
                    min_samples_split=5,        # Tránh phân tách nhánh quá sớm
                    min_samples_leaf=10,        # Giúp mô hình ổn định hơn
                    max_features='sqrt',        # Giảm overfitting
                    bootstrap=True,             # Dùng bootstrap sampling
                    random_state=42,
                    n_jobs=-1
                )
            model.fit(X_train_scaled, y_train)
            
            # Lưu danh sách tính năng cho từng mô hình
            FeatureManager.save_feature_names(feature_list_for_scale, target_name, 'RandomForest')
            
            # Dự báo
            y_pred = model.predict(X_test_scaled)
            
            # Tính toán các metrics 
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            r2 = r2_score(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            
            # Tính MAPE chỉ khi không có giá trị 0
            try:
                mape = mean_absolute_percentage_error(y_test, y_pred)
            except:
                mape = float('nan')
            
            self.models[target_name] = model
            self.metrics[target_name] = {
                'rmse': rmse,
                'r2': r2,
                'mae': mae,
                'mape': mape
            }
            
            # Lưu kết quả huấn luyện wind_direction components
            if target_name == 'wind_direction_sin':
                sin_completed = True
                sin_pred = y_pred
                sin_test = y_test
            elif target_name == 'wind_direction_cos':
                cos_completed = True
                cos_pred = y_pred
                cos_test = y_test
            
            # Vẽ biểu đồ dự báo (không phải wind direction components)
            if target_name not in ['wind_direction_sin', 'wind_direction_cos']:
                self.plot_predictions(y_test, y_pred, target_name)
            
            print(f"Hoàn thành huấn luyện cho {target_name}. RMSE = {rmse:.4f}, R2 = {r2:.4f}")
        
        # Sau khi huấn luyện tất cả các mục tiêu, tạo biểu đồ hướng gió nếu cả hai thành phần đã được huấn luyện
        if sin_completed and cos_completed:
            print("Vẽ biểu đồ dự báo hướng gió (wind_direction)...")
            # Lấy dữ liệu cho sin và cos đã được dự đoán
            self.plot_wind_direction_predictions(
                sin_test, 
                cos_test, 
                sin_pred, 
                cos_pred, 
                'wind_direction'
            )
        
        print("Huấn luyện hoàn tất.")
        return self.metrics

    def plot_predictions(self, y_test, y_pred, target_name):
        """Vẽ biểu đồ dự báo theo kiểu train_rf_model.py"""
        plt.figure(figsize=(14, 10))
        
        # Đảm bảo dữ liệu không có NaN và đồng bộ kích thước
        y_test = y_test.dropna()
        y_pred = y_pred[:len(y_test)]

        # Subplot 1: Đường chuỗi thời gian (như cũ nhưng hiển thị rõ hơn)
        plt.subplot(2, 2, 1)
        plt.plot(y_test.values[:100], 'k-', label='Thực tế', linewidth=1.5)
        plt.plot(y_pred[:100], 'b-', label='Dự báo', linewidth=1.5, alpha=0.8)
        plt.title(f'Dự báo {target_name}: 100 mẫu đầu tiên')
        plt.xlabel('Mẫu dữ liệu')
        plt.ylabel(target_name)
        plt.legend()
        plt.grid(True, linestyle='--', alpha=0.7)
        
        # Subplot 2: Scatter plot giá trị thực tế và dự báo
        plt.subplot(2, 2, 2)
        plt.scatter(y_test, y_pred, alpha=0.5, s=10)
        plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--')
        plt.title(f'Thực tế vs Dự báo (R² = {r2_score(y_test, y_pred):.4f})')
        plt.xlabel('Giá trị thực tế')
        plt.ylabel('Giá trị dự báo')
        plt.grid(True, linestyle='--', alpha=0.7)
        
        # Subplot 3: Biểu đồ phân phối lỗi (residual plot)
        plt.subplot(2, 2, 3)
        residuals = y_test - y_pred
        plt.hist(residuals, bins=30, alpha=0.7, color='skyblue', edgecolor='black')
        plt.axvline(x=0, color='red', linestyle='--')
        plt.title(f'Phân phối lỗi (RMSE = {np.sqrt(mean_squared_error(y_test, y_pred)):.4f})')
        plt.xlabel('Lỗi (Thực tế - Dự báo)')
        plt.ylabel('Tần suất')
        plt.grid(True, linestyle='--', alpha=0.7)
        
        # Subplot 4: Residual scatter plot
        plt.subplot(2, 2, 4)
        plt.scatter(y_pred, residuals, alpha=0.5, s=10)
        plt.axhline(y=0, color='red', linestyle='--')
        plt.title('Đồ thị phân tán lỗi')
        plt.xlabel('Giá trị dự báo')
        plt.ylabel('Lỗi')
        plt.grid(True, linestyle='--', alpha=0.7)

        plt.tight_layout()
        
        # Tạo thư mục lưu hình ảnh
        plots_dir = os.path.join(project_root, 'backend', 'ml', 'evaluation', 'plots', 'rf')
        os.makedirs(plots_dir, exist_ok=True)
        
        plt.savefig(os.path.join(plots_dir, f'{target_name}_prediction.png'), dpi=300)
        plt.close()

    def convert_wind_components_to_direction(self, sin_pred, cos_pred):
        """Chuyển đổi từ thành phần sin và cos thành góc hướng gió (0-360 độ)"""
        directions = np.degrees(np.arctan2(sin_pred, cos_pred))
        # Chuyển từ khoảng (-180, 180) sang khoảng (0, 360)
        directions = (directions + 360) % 360
        return directions
    
    def plot_wind_direction_predictions(self, y_test_sin, y_test_cos, y_pred_sin, y_pred_cos, target_name):
        """Vẽ biểu đồ dự báo hướng gió từ các thành phần sin và cos"""
        # Chuyển dự báo và thực tế từ sin/cos về góc (0-360)
        y_test_angles = self.convert_wind_components_to_direction(y_test_sin, y_test_cos)
        y_pred_angles = self.convert_wind_components_to_direction(y_pred_sin, y_pred_cos)
        
        # Tính toán sai số góc (xem xét tính tuần hoàn của góc)
        angle_errors = np.minimum(np.abs(y_test_angles - y_pred_angles), 
                                 360 - np.abs(y_test_angles - y_pred_angles))
        mae = np.mean(angle_errors)
        
        plt.figure(figsize=(14, 10))
        
        # Subplot 1: So sánh góc thực tế và dự báo
        plt.subplot(2, 2, 1, polar=True)
        plt.scatter(np.radians(y_test_angles[:100]), np.ones(min(100, len(y_test_angles))), 
                   c='blue', alpha=0.5, label='Thực tế')
        plt.scatter(np.radians(y_pred_angles[:100]), 0.8 * np.ones(min(100, len(y_pred_angles))), 
                   c='red', alpha=0.5, label='Dự báo')
        plt.title(f'Dự báo hướng gió: 100 mẫu đầu tiên\nMAE: {mae:.2f}°')
        plt.legend()
        
        # Subplot 2: Histogram lỗi góc
        plt.subplot(2, 2, 2)
        plt.hist(angle_errors, bins=36, alpha=0.7)
        plt.axvline(x=mae, color='red', linestyle='--', label=f'MAE: {mae:.2f}°')
        plt.title('Phân phối lỗi góc')
        plt.xlabel('Lỗi góc (độ)')
        plt.ylabel('Tần suất')
        plt.legend()
        
        # Subplot 3: Scatter plot các thành phần sin
        plt.subplot(2, 2, 3)
        plt.scatter(y_test_sin, y_pred_sin, alpha=0.5, s=10)
        plt.plot([-1, 1], [-1, 1], 'r--')
        plt.title(f'Thực tế vs Dự báo (sin)')
        plt.xlabel('sin(wind_direction) thực tế')
        plt.ylabel('sin(wind_direction) dự báo')
        plt.grid(True, linestyle='--', alpha=0.7)
        
        # Subplot 4: Scatter plot các thành phần cos
        plt.subplot(2, 2, 4)
        plt.scatter(y_test_cos, y_pred_cos, alpha=0.5, s=10)
        plt.plot([-1, 1], [-1, 1], 'r--')
        plt.title(f'Thực tế vs Dự báo (cos)')
        plt.xlabel('cos(wind_direction) thực tế')
        plt.ylabel('cos(wind_direction) dự báo')
        plt.grid(True, linestyle='--', alpha=0.7)

        plt.tight_layout()
        
        # Tạo thư mục lưu hình ảnh
        plots_dir = os.path.join(project_root, 'backend', 'ml', 'evaluation', 'plots', 'rf')
        os.makedirs(plots_dir, exist_ok=True)
        
        plt.savefig(os.path.join(plots_dir, f'{target_name}_prediction.png'), dpi=300)
        plt.close()

    def save_models(self):
        """Lưu mô hình với cấu trúc giống như train_rf_model.py"""
        if self.feature_list_for_scale is None:
            # Cập nhật danh sách đặc trưng nếu chưa được gán
            self.feature_list_for_scale = [
                'hour', 'day', 'month', 'day_of_week', 'day_of_year',
                'is_spring', 'is_summer', 'is_autumn', 'is_winter',
                'season_sin', 'season_cos',
                'elevation_m', 'terrain_lowland', 'terrain_hills', 'terrain_highland', 'terrain_mountain',
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
        
        # Đóng gói kết quả
        data_to_save = {
            'models': self.models,
            'scalers': self.scalers,
            'metrics': self.metrics,
            'feature_list_for_scale': self.feature_list_for_scale,
            'model_type': 'RandomForest'  # Thêm thông tin loại mô hình
        }
        
        # Lưu mô hình
        models_dir = os.path.join(project_root, 'backend', 'ml', 'models')
        os.makedirs(models_dir, exist_ok=True)
        joblib.dump(data_to_save, os.path.join(models_dir, 'rf_weather_models.joblib'))
        
        print(f"Đã lưu mô hình RandomForest tại {os.path.join(models_dir, 'rf_weather_models.joblib')}")
        
        return data_to_save

def train_rf_model():
    """Huấn luyện mô hình RandomForest cho dự báo thời tiết"""
    print("Bắt đầu huấn luyện mô hình RandomForest...")
    
    # Khởi tạo trainer
    trainer = RandomForestTrainer()
    
    # Đường dẫn đến dữ liệu
    data_path = os.path.join(project_root, 'backend', 'ml', 'data', 'weather_dataset_with_season_terrain.csv')
    
    # Chuẩn bị dữ liệu
    X, y_dict, feature_list_for_scale = trainer.prepare_data(data_path)
    
    # Huấn luyện mô hình
    metrics = trainer.train(X, y_dict, feature_list_for_scale)
    
    # In metrics
    for target, metric in metrics.items():
        print(f"{target} - RMSE: {metric['rmse']:.4f}, R²: {metric['r2']:.4f}")
    
    # Lưu mô hình
    trainer.save_models()
    
    print("Quá trình huấn luyện mô hình RandomForest đã hoàn tất!")
    
    return trainer

if __name__ == "__main__":
    train_rf_model()