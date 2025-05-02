import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from datetime import datetime
import os

class WeatherDataPreprocessor:
    def __init__(self):
        self.airport_encoder = LabelEncoder()
        self.scaler = StandardScaler()  # Initialize the scaler
    
    def extract_time_features(self, df):
        """Extract time-based features from timestamp."""
        # Kiểm tra và chuyển đổi timestamp nếu cần
        if 'timestamp' in df.columns:
            if df['timestamp'].dtype == 'int64' or df['timestamp'].dtype == 'float64':
                # Nếu timestamp là số, giả định đó là Unix timestamp (giây)
                df['timestamp'] = pd.to_datetime(df['timestamp'], unit='s')
            else:
                # Chuyển đổi bình thường
                df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
                
        df = df.dropna(subset=['timestamp']).copy()
        df.loc[:, 'hour'] = df['timestamp'].dt.hour
        df.loc[:, 'day'] = df['timestamp'].dt.day
        df.loc[:, 'month'] = df['timestamp'].dt.month
        df.loc[:, 'day_of_week'] = df['timestamp'].dt.dayofweek
        df.loc[:, 'day_of_year'] = df['timestamp'].dt.dayofyear
        return df
    
    def extract_season_features(self, df):
        """Thêm đặc trưng về mùa dựa trên tháng và vĩ độ"""
        df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
        
        # Lấy tháng từ timestamp
        month = df['timestamp'].dt.month
        
        # Thêm các đặc trưng mùa theo cách thủ công
        # Mùa xuân: tháng 3-5, Mùa hè: tháng 6-8, Mùa thu: tháng 9-11, Mùa đông: tháng 12-2
        df['is_spring'] = ((month >= 3) & (month <= 5)).astype(int)
        df['is_summer'] = ((month >= 6) & (month <= 8)).astype(int)
        df['is_autumn'] = ((month >= 9) & (month <= 11)).astype(int)
        df['is_winter'] = ((month == 12) | (month <= 2)).astype(int)
        
        # Bổ sung thêm đặc trưng theo hàm sin và cos để biểu diễn tính chu kỳ của mùa
        df['season_sin'] = np.sin(2 * np.pi * month / 12)
        df['season_cos'] = np.cos(2 * np.pi * month / 12)
        
        return df

    def add_terrain_features(self, df):
        """Thêm đặc trưng về địa hình"""
        # Đọc dữ liệu địa hình
        terrain_path = os.path.join(os.path.dirname(__file__), 'terrain_data.csv')
        
        if os.path.exists(terrain_path):
            terrain_df = pd.read_csv(terrain_path)
            
            # Nếu có cột 'iata' trong df, thì join trực tiếp
            if 'iata' in df.columns:
                df = df.merge(terrain_df[['iata', 'elevation_m', 'terrain_type']], 
                            on='iata', how='left')
            # Nếu có lat, lon thì join theo khoảng cách gần nhất
            elif 'lat' in df.columns and 'lon' in df.columns:
                from scipy.spatial.distance import cdist
                
                for idx, row in df.iterrows():
                    if pd.isna(row['lat']) or pd.isna(row['lon']):
                        continue
                        
                    # Tìm sân bay gần nhất
                    coords = np.array([[row['lat'], row['lon']]])
                    terrain_coords = np.array(list(zip(terrain_df['latitude'], terrain_df['longitude'])))
                    distances = cdist(coords, terrain_coords)[0]
                    nearest_idx = np.argmin(distances)
                    
                    df.at[idx, 'elevation_m'] = terrain_df.iloc[nearest_idx]['elevation_m']
                    df.at[idx, 'terrain_type'] = terrain_df.iloc[nearest_idx]['terrain_type']
            
            # One-hot encoding cho terrain_type
            if 'terrain_type' in df.columns:
                df = pd.get_dummies(df, columns=['terrain_type'], prefix='terrain')
                
        # Nếu không có dữ liệu địa hình, thêm các cột giả
        if 'elevation_m' not in df.columns:
            df['elevation_m'] = 0
        if 'terrain_lowland' not in df.columns:
            df['terrain_lowland'] = 0
        if 'terrain_hills' not in df.columns:
            df['terrain_hills'] = 0
        if 'terrain_highland' not in df.columns:
            df['terrain_highland'] = 0
        if 'terrain_mountain' not in df.columns:
            df['terrain_mountain'] = 0
        
        return df
    
    def create_lag_and_rolling_features(self, df, columns):
        """Create lag and rolling mean features for specified columns."""
        for col in columns:
            for lag in range(1, 4):
                df[f'{col}_lag_{lag}'] = df[col].shift(lag) 
            for window in [3, 6, 12]:
                df[f'{col}_rolling_mean_{window}'] = df[col].rolling(window=window).mean()

        lag_cols = [f'{col}_lag_{lag}' for col in columns for lag in range(1, 4)]
        rolling_cols = [f'{col}_rolling_mean_{window}' for col in columns for window in [3, 6, 12]]
        df[lag_cols + rolling_cols] = df[lag_cols + rolling_cols].round(1)

        return df
    
    def encode_categorical(self, df):
        """Encode categorical variables."""
        if 'airport_code' in df.columns:
            df['airport_code_encoded'] = self.airport_encoder.fit_transform(df['airport_code'])
            df = df.drop('airport_code', axis=1)
        
        if 'wind_direction_symbol' in df.columns:
            df = df.drop('wind_direction_symbol', axis=1)
        
        if 'condition' in df.columns:
            df = df.drop('condition', axis=1)
        
        if 'airport_name' in df.columns:
            df = df.drop(['airport_name'], axis=1)

        return df
    
    def handle_missing_values(self, df):
        """Handle missing values in the dataset."""
        # Chỉ chọn các cột kiểu số
        numeric_columns = df.select_dtypes(include=[np.number]).columns

        # Điền giá trị thiếu bằng trung bình của các cột số
        df[numeric_columns] = df[numeric_columns].fillna(df[numeric_columns].mean())

        # Làm tròn tất cả các cột số đến 1 chữ số thập phân
        df[numeric_columns] = df[numeric_columns].round(1)
        
        return df
    
    # Chọn các feature cần thiết cho model để train và test
    def select_features(self, df):
        """Select relevant features for model training."""
        features = [
            'hour', 'day', 'month', 'day_of_week', 'day_of_year',
            'temperature', 'humidity', 'wind_speed', 'gust_speed',
            'pressure', 'precipitation', 'rain_probability', 'snow_probability',
            'visibility', 'uv_index', 'dewpoint', 'cloud', 'wind_direction', 'condition_code',
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
            'dewpoint_rolling_mean_3', 'dewpoint_rolling_mean_6', 'dewpoint_rolling_mean_12'
        ] + [col for col in df.columns if col.startswith('airport_')]
        
        available_features = [f for f in features if f in df.columns]

        return df[available_features]

    def preprocess(self, data_path):
        """Main preprocessing pipeline."""
        # Read data
        df = pd.read_csv(data_path)
        
        # Apply preprocessing steps
        df = self.extract_time_features(df)
        df = self.extract_season_features(df)  # Thêm đặc trưng mùa
        df = self.add_terrain_features(df)     

        df = self.encode_categorical(df)

        # Create lag and rolling mean features
        columns = ['temperature', 'humidity', 'wind_speed', 'pressure', 'precipitation', 'cloud', 'uv_index', 'visibility', 'rain_probability', 'dewpoint', 'gust_speed', 'snow_probability']
        df = self.create_lag_and_rolling_features(df, columns)

        df = self.handle_missing_values(df)
        
        # Select features
        df = self.select_features(df)
        return df

    def preprocess_real_time_data(self, df):
        """Xử lý dữ liệu thời gian thực cho việc dự báo"""
        # Đảm bảo timestamp là datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Trích xuất đặc trưng thời gian
        df = self.extract_time_features(df)
        
        # Trích xuất đặc trưng mùa
        df = self.extract_season_features(df)
        
        # Tạo các đặc trưng lag và rolling
        target_columns = ['temperature', 'humidity', 'wind_speed', 'pressure', 
                         'precipitation', 'cloud', 'uv_index', 'visibility', 
                         'rain_probability', 'dewpoint']
        
        available_columns = [col for col in target_columns if col in df.columns]
        if available_columns:
            df = self.create_lag_and_rolling_features(df, available_columns)
        
        # Xử lý giá trị thiếu
        df = self.handle_missing_values(df)
        
        # Thêm thông tin địa hình nếu có
        if 'latitude' in df.columns and 'longitude' in df.columns:
            df = self.add_terrain_features(df)
        
        return df