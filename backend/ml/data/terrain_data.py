import json
import os
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

# Đường dẫn đến file airports.json
airports_path = os.path.join(os.path.dirname(__file__), 'airports.json')

# API key cho Google Maps Elevation API hoặc Open Elevation API
ELEVATION_API_KEY = os.getenv("ELEVATION_API_KEY")

def get_elevation(lat, lon, api_key=None):
    """Lấy độ cao địa hình từ API"""
    if api_key:
        # Sử dụng Google Maps Elevation API nếu có API key
        url = f"https://maps.googleapis.com/maps/api/elevation/json?locations={lat},{lon}&key={api_key}"
    else:
        # Sử dụng Open Elevation API (miễn phí nhưng có giới hạn)
        url = f"https://api.open-elevation.com/api/v1/lookup?locations={lat},{lon}"
    
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        if api_key:
            return data['results'][0]['elevation']
        else:
            return data['results'][0]['elevation']
    else:
        print(f"Không thể lấy thông tin độ cao: {response.text}")
        return None

def get_terrain_type(elevation):
    """Phân loại địa hình dựa trên độ cao"""
    if elevation < 100:
        return "lowland"  # Đồng bằng
    elif elevation < 500:
        return "hills"    # Đồi
    elif elevation < 1500:
        return "highland" # Cao nguyên
    else:
        return "mountain" # Núi cao

def collect_terrain_data():
    """Thu thập và lưu dữ liệu địa hình cho các sân bay"""
    # Đọc danh sách sân bay
    with open(airports_path, 'r', encoding='utf-8') as f:
        airports = json.load(f)
    
    terrain_data = []
    
    for airport in airports:
        lat = float(airport['latitude'])
        lon = float(airport['longitude'])
        
        # Lấy elevation từ API
        elevation = get_elevation(lat, lon, ELEVATION_API_KEY)
        
        # Nếu không có API hoặc API trả về lỗi, sử dụng dữ liệu từ airport.json
        if elevation is None and 'elevation_ft' in airport:
            elevation = float(airport['elevation_ft']) * 0.3048  # chuyển feet sang mét
        
        terrain_type = get_terrain_type(elevation) if elevation is not None else "unknown"
        
        terrain_data.append({
            'iata': airport['iata'],
            'elevation_m': elevation,
            'terrain_type': terrain_type,
            'latitude': lat,
            'longitude': lon
        })
    
    # Lưu dữ liệu địa hình
    df = pd.DataFrame(terrain_data)
    output_path = os.path.join(os.path.dirname(__file__), 'terrain_data.csv')
    df.to_csv(output_path, index=False)
    print(f"Đã lưu dữ liệu địa hình vào {output_path}")

if __name__ == "__main__":
    collect_terrain_data()