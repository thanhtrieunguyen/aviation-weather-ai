import requests
import pandas as pd
from datetime import datetime, timedelta
import time
import json
from dotenv import load_dotenv
import os
import pathlib

load_dotenv()

weather_api_key = os.getenv('WEATHER_API_KEY')

class HistoricalWeatherCollector:
    def __init__(self, weather_api_key):
        self.weather_api_key = weather_api_key
        self.airports_data = []
        self.filename = 'weather_dataset1.csv'
        self.start_from_icao = 'VVDL'

    def load_vietnam_airports(self):
        """Load airport data from local JSON file instead of API"""
        try:
            current_dir = pathlib.Path(__file__).parent.resolve()
            airports_file = os.path.join(current_dir, 'airports.json')
            
            with open(airports_file, 'r', encoding='utf-8') as f:
                self.airports_data = json.load(f)
            print(f"Loaded {len(self.airports_data)} airports from file")
            return True
        except Exception as e:
            print(f"Error loading airports file: {str(e)}")
            return False

    def get_historical_weather(self, lat, lon, date):
        url = "http://api.weatherapi.com/v1/history.json"
        params = {
            'key': self.weather_api_key,
            'q': f"{lat},{lon}",
            'dt': date.strftime('%Y-%m-%d')
        }

        try:
            response = requests.get(url, params=params)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error fetching data for {date}: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Error fetching data for {date}: {str(e)}")
        return None

    def save_data(self, data_points):
        if not data_points:
            print("No data to save")
            return
        
        df = pd.DataFrame(data_points)
        if not df.empty:
            mode = 'a' if pd.io.common.file_exists(self.filename) else 'w'
            header = not pd.io.common.file_exists(self.filename)
            df.to_csv(self.filename, mode=mode, header=header, index=False)
            print(f"Saved {len(data_points)} data points to {self.filename}")

    def collect_historical_data(self):
        end_date = datetime.now()
        start_date = end_date - timedelta(days=5*365)

        start_index = 0
        for i, airport in enumerate(self.airports_data):
            if airport['icao'] == self.start_from_icao:
                start_index = i
                break

        for i in range(start_index, len(self.airports_data)):
            airport = self.airports_data[i]
            print(f"Collecting data for {airport['name']} ({airport['iata']})")
            current_date = start_date
            airport_data = []  # Dữ liệu cho mỗi sân bay

            while current_date <= end_date:
                weather = self.get_historical_weather(
                    airport['latitude'],
                    airport['longitude'],
                    current_date
                )

                if weather and 'forecast' in weather:
                    for hour in weather['forecast']['forecastday'][0]['hour']:
                        data_point = {
                            'timestamp': hour['time'],           # Thời gian dự báo
                            'airport_code': airport['iata'],      # Mã sân bay
                            'airport_name': airport['name'],        # Tên sân bay
                            'latitude': airport['latitude'],       # Vĩ độ
                            'longitude': airport['longitude'],      # Kinh độ
                            'temperature': hour['temp_c'],         # Nhiệt độ (độ C)
                            'feels_like': hour['feelslike_c'],       # Nhiệt độ cảm nhận (độ C)
                            'humidity': hour['humidity'],          # Độ ẩm (%)
                            'wind_speed_mph': hour['wind_mph'],      # Tốc độ gió (mph)
                            'wind_speed_kph': hour['wind_kph'],      # Tốc độ gió (km/h)
                            'wind_direction': hour['wind_degree'],   # Hướng gió (độ)
                            'wind_direction_symbol': hour['wind_dir'], # Ký hiệu hướng gió
                            'gust_speed': hour['gust_mph'], # Tốc độ gió giật (mph)
                            'pressure': hour['pressure_mb'], # Áp suất (mb)
                            'precipitation': hour['precip_mm'], # Lượng mưa (mm)
                            'rain_probability': hour['chance_of_rain'], # Xác suất mưa (%)
                            'snow_probability': hour['chance_of_snow'], # Xác suất tuyết (%)
                            'uv_index': hour['uv'], # Chỉ số UV
                            'dewpoint': hour['dewpoint_c'], # Điểm sương (độ C)
                            'visibility': hour['vis_km'], # Tầm nhìn (km)
                            'cloud': hour['cloud'],  # Mây (%)
                            'condition': hour['condition']['text'], # Tình trạng thời tiết
                            'condition_code': hour['condition']['code'], # Mã tình trạng thời tiết
                        }
                        airport_data.append(data_point)  # Thêm vào danh sách sân bay

                print(f"Collected data for {current_date.strftime('%Y-%m-%d')}")
                current_date += timedelta(days=1)

                if len(airport_data) >= 1000:
                    self.save_data(airport_data)
                    print(f"  - Saved partial data for {airport['name']}")
                    airport_data = []  # Reset the list after saving

            # Lưu tất cả dữ liệu của sân bay sau khi hoàn thành
            if airport_data:  # Only save if there's data remaining
                self.save_data(airport_data)
            print(f"✅ Saved all data for {airport['name']} ({airport['iata']})")

def main():
    collector = HistoricalWeatherCollector(
        weather_api_key=os.getenv('WEATHER_API_KEY')
    )

    if not collector.load_vietnam_airports():
        print("Could not fetch airports list!")
        return

    collector.collect_historical_data()

if __name__ == "__main__":
    main()