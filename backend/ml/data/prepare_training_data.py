import pandas as pd
import numpy as np
import os
from data_preprocessing import WeatherDataPreprocessor

def prepare_training_data_with_seasonal_terrain():
    """Chuẩn bị dữ liệu huấn luyện với đặc trưng mùa và địa hình"""
    # Đường dẫn đến dữ liệu thô
    raw_data_path = os.path.join(os.path.dirname(__file__), 'weather_dataset.csv')
    
    # Đọc dữ liệu
    df = pd.read_csv(raw_data_path)
    
    # Khởi tạo bộ tiền xử lý
    preprocessor = WeatherDataPreprocessor()
    
    # Áp dụng các bước tiền xử lý
    df = preprocessor.extract_time_features(df)
    df = preprocessor.extract_season_features(df)  # Thêm đặc trưng mùa
    df = preprocessor.add_terrain_features(df)     # Thêm đặc trưng địa hình
    
    # Tiếp tục với các bước tiền xử lý khác
    df = preprocessor.encode_categorical(df)
    
    columns = ['temperature', 'humidity', 'wind_speed', 'pressure', 'precipitation', 
              'cloud', 'uv_index', 'visibility', 'rain_probability', 'dewpoint', 
              'gust_speed', 'snow_probability']
    
    df = preprocessor.create_lag_and_rolling_features(df, columns)
    df = preprocessor.handle_missing_values(df)
    
    # Lưu dữ liệu đã tiền xử lý
    output_path = os.path.join(os.path.dirname(__file__), 'weather_dataset_with_season_terrain.csv')
    df.to_csv(output_path, index=False)
    print(f"Đã lưu dữ liệu tiền xử lý với đặc trưng mùa và địa hình vào {output_path}")
    
    return df

if __name__ == "__main__":
    prepare_training_data_with_seasonal_terrain()