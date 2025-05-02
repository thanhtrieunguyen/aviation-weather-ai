import os
import time
import json
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv
import sys
import warnings

# Update warning filters to be more comprehensive
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=UserWarning, 
                       message="X does not have valid feature names, but LGBMRegressor was fitted with feature names")

# Cấu hình các đường dẫn dựa vào vị trí hiện tại
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, '../../..'))
airports_path = os.path.join(project_root, 'backend', 'ml', 'data', 'airports.json')
model_path = os.path.join(project_root, 'backend', 'ml', 'models', 'best_weather_models.joblib')
output_csv = os.path.join(project_root, 'backend', 'ml', 'data_predict', 'airport_forecast.csv')

# Thêm project vào sys.path để import module dự báo
sys.path.append(project_root)
from backend.ml.prediction.weather_prediction import WeatherPredictionService, get_current_weather

load_dotenv()
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
if not WEATHER_API_KEY:
    raise Exception("Không tìm thấy WEATHER_API_KEY trong môi trường.")

# Khởi tạo dịch vụ dự báo
prediction_service = WeatherPredictionService(model_path)

def load_airports():
    with open(airports_path, 'r', encoding='utf-8') as f:
        return json.load(f)

# Sửa hàm fetch_prediction_for_airport để trả về record dưới dạng dict.
def fetch_prediction_for_airport(airport):
    # Apply warning filter specifically for the prediction call
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", category=UserWarning)
        
        # location theo định dạng "lat,lon"
        location = f"{airport['latitude']},{airport['longitude']}"
        try:
            result = prediction_service.predict(WEATHER_API_KEY, location, prediction_hours=12)
            current = get_current_weather(WEATHER_API_KEY, location)
            
            # Xây dựng location_data từ thông tin sân bay và thời gian từ current weather.
            location_data = {
                "location": location,
                "city": airport.get("city"),
                "state": airport.get("region"),
                "country": airport.get("country"),
                "country_code": airport.get("country"),
                "timezone": airport.get("timezone"),
                "airport": {
                    "icao": airport.get("icao"),
                    "iata": airport.get("iata"),
                    "name": airport.get("name"),
                    "lat": airport.get("latitude"),
                    "lon": airport.get("longitude"),
                },
                "timestamp": current.get("timestamp")
            }
            
            # Loại bỏ các trường không cần trong current và dự báo nếu cần (ví dụ "airport" hay "forecast_target")
            # ...existing code...
            
            return {
                "location_data": location_data,
                "current_weather": current,
                "prediction": result["forecasts"]
            }
        except KeyError as ke:
            print(f"[{datetime.now().isoformat()}] Lỗi cấu trúc dữ liệu với sân bay {airport.get('iata')}: Không tìm thấy key {ke}")
            return None
        except Exception as e:
            print(f"[{datetime.now().isoformat()}] Lỗi dự báo cho sân bay {airport.get('iata')}: {e}")
            print(f"Chi tiết kết quả dự báo: {str(result)[:500]}...")  # Print partial result to debug
            return None

def main_loop():
    from backend.ml.db.mongo_connector import store_weather_data, get_latest_weather_data
    MONGO_DB_PASSWORD = os.getenv("MONGO_DB_PASSWORD")
    airports = load_airports()
    print("Bắt đầu scheduler cho dự báo sân bay theo chu kỳ 30 phút...")
    
    while True:
        now = datetime.now()
        if now.minute < 30:
            target = now.replace(minute=30, second=0, microsecond=0)
        else:
            target = (now + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
        
        prefetch_start = target - timedelta(minutes=10)
        sleep_seconds = (prefetch_start - datetime.now()).total_seconds()
        if sleep_seconds > 0:
            print(f"Chờ {int(sleep_seconds)} giây đến thời điểm prefetch_start ({prefetch_start.time()})")
            time.sleep(sleep_seconds)
        
        print(f"Bắt đầu cập nhật dự báo thời tiết cho các sân bay lúc {datetime.now().strftime('%H:%M:%S')}")
        
        # Lấy dữ liệu dự báo hiện tại từ MongoDB (nếu có)
        existing_forecasts = {}
        if MONGO_DB_PASSWORD:
            for airport in airports:
                iata = airport.get("iata")
                existing_data = get_latest_weather_data(MONGO_DB_PASSWORD, iata)
                if existing_data:
                    existing_forecasts[iata] = existing_data
                    print(f"Đã tìm thấy dữ liệu dự báo hiện có cho sân bay {iata}")
        
        # Lấy dự báo mới
        records = {}
        failed_airports = []
        for airport in airports:
            iata = airport.get("iata")
            print(f"Đang lấy dự báo mới cho sân bay {iata}...")
            record = fetch_prediction_for_airport(airport)
            if record:
                records[iata] = record
                print(f"Lấy dự báo thành công cho sân bay {iata}")
            else:
                failed_airports.append(airport)
                print(f"Lấy dự báo thất bại cho sân bay {iata}")
        
        # Retry cho các sân bay bị lỗi
        while datetime.now() < target and failed_airports:
            print(f"Đang thử lại cho {len(failed_airports)} sân bay bị lỗi...")
            time.sleep(10)
            for airport in failed_airports[:]:
                iata = airport.get("iata")
                record = fetch_prediction_for_airport(airport)
                if record:
                    records[iata] = record
                    failed_airports.remove(airport)
                    print(f"Lấy dự báo thành công cho sân bay {iata} sau khi thử lại")
        
        current_time = datetime.now()
        # Kết hợp dự báo mới với dữ liệu hiện có
        for iata, record in records.items():
            if iata in existing_forecasts:
                print(f"Đang cập nhật dự báo cho sân bay {iata}...")
                # Lọc ra các mốc thời gian đã qua từ dữ liệu cũ
                existing_forecasts[iata]["prediction"] = [
                    forecast for forecast in existing_forecasts[iata]["prediction"]
                    if datetime.fromisoformat(forecast["timestamp"]) > current_time
                ]
                
                # Cập nhật thông tin thời tiết hiện tại
                existing_forecasts[iata]["current_weather"] = record["current_weather"]
                
                # Cập nhật các dự báo tương lai
                new_timestamps = {forecast["timestamp"]: forecast for forecast in record["prediction"]}
                existing_timestamps = {forecast["timestamp"]: i for i, forecast in enumerate(existing_forecasts[iata]["prediction"])}
                
                # Cập nhật các dự báo hiện có hoặc thêm mới nếu chưa có
                for timestamp, forecast in new_timestamps.items():
                    if timestamp in existing_timestamps:
                        existing_forecasts[iata]["prediction"][existing_timestamps[timestamp]] = forecast
                    else:
                        existing_forecasts[iata]["prediction"].append(forecast)
                
                # Sắp xếp lại dự báo theo thời gian
                existing_forecasts[iata]["prediction"].sort(key=lambda x: x["timestamp"])
                
                # Cập nhật record để lưu trữ
                records[iata] = existing_forecasts[iata]
                print(f"Đã cập nhật dự báo cho sân bay {iata}: {len(records[iata]['prediction'])} mốc thời gian")
        
        final_records = list(records.values())
        
        # Chuẩn bị dữ liệu để lưu vào CSV
        if final_records:
            df = pd.json_normalize(final_records)
            df["update_time"] = datetime.now().isoformat()
            df.to_csv(output_csv, index=False)
            print(f"Đã lưu dữ liệu dự báo vào {output_csv}")
        else:
            print("Không có dự báo nào thành công trong phiên này.")
        
        # Chờ đến đúng thời điểm target để cập nhật dữ liệu lên MongoDB
        remaining = (target - datetime.now()).total_seconds()
        if remaining > 0:
            print(f"Hoàn thành chuẩn bị dữ liệu. Chờ {int(remaining)} giây đến thời điểm chính xác ({target.time()}) để cập nhật lên MongoDB...")
            time.sleep(remaining)
        
        # Đã đến thời điểm target, tiến hành cập nhật lên MongoDB
        if MONGO_DB_PASSWORD and final_records:
            print(f"Đã đến thời điểm {target.time()}, bắt đầu cập nhật dữ liệu lên MongoDB...")
            for rec in final_records:
                store_weather_data(MONGO_DB_PASSWORD, rec)
            print(f"Đã lưu/cập nhật dữ liệu thời tiết cho {len(final_records)} sân bay vào MongoDB")
        else:
            if not MONGO_DB_PASSWORD:
                print("MONGO_DB_PASSWORD chưa được thiết lập.")
            else:
                print("Không có dữ liệu để cập nhật lên MongoDB.")
        
        print(f"Hoàn thành phiên dự báo cho mốc {target.time()}. Bắt đầu vòng lặp mới.\n")

# # Hàm main_loop test với chu kỳ ngắn (mặc định 2 phút, bạn có thể đổi số phút nếu cần)
# def main_loop(test_minutes=2):
#     from backend.ml.db.mongo_connector import store_weather_data
#     MONGO_DB_PASSWORD = os.getenv("MONGO_DB_PASSWORD")
#     airports = load_airports()
#     print(f"Bắt đầu test scheduler cho dự báo sân bay với chu kỳ {test_minutes} phút...")
    
#     while True:
#         now = datetime.now()
#         target = now + timedelta(minutes=test_minutes)
#         # Prefetch bắt đầu 30 giây trước target
#         prefetch_start = target - timedelta(seconds=30)
#         sleep_seconds = (prefetch_start - datetime.now()).total_seconds()
#         if sleep_seconds > 0:
#             print(f"Chờ {int(sleep_seconds)} giây đến prefetch_start ({prefetch_start.time()})")
#             time.sleep(sleep_seconds)
        
#         records = {}
#         failed_airports = []

#         print(f"Bắt đầu prefetch dự báo cho mốc {target.time()}")
#         for airport in airports:
#             print(f"Prefetch dự báo cho {airport.get('iata')}...")
#             record = fetch_prediction_for_airport(airport)
#             if record:
#                 records[airport.get("iata")] = record
#             else:
#                 failed_airports.append(airport)
        
#         print(f"Prefetch hoàn thành. {len(records)} sân bay thành công, {len(failed_airports)} sân bay lỗi.")
#         # Retry cho các sân bay lỗi trong khoảng 30 giây trước target
#         while datetime.now() < target and failed_airports:
#             print(f"Retry cho {len(failed_airports)} sân bay bị lỗi...")
#             time.sleep(10)
#             for airport in failed_airports[:]:
#                 record = fetch_prediction_for_airport(airport)
#                 if record:
#                     records[airport.get("iata")] = record
#                     failed_airports.remove(airport)
        
#         final_records = list(records.values())
        
#         print(f"Đã prefetch dự báo cho {len(final_records)} sân bay.")
#         if final_records:
#             df = pd.json_normalize(final_records)
#             df["update_time"] = datetime.now().isoformat()
#             df.to_csv(output_csv, index=False)
#             print(f"Đã lưu dữ liệu dự báo vào {output_csv}")
#         else:
#             print("Không có dự báo nào thành công trong phiên này.")
        
#         if MONGO_DB_PASSWORD:
#             for rec in final_records:
#                 store_weather_data(MONGO_DB_PASSWORD, rec)
#             print("Đã lưu dữ liệu thời tiết vào MongoDB")
#         else:
#             print("MONGO_DB_PASSWORD chưa được thiết lập.")
        
#         remaining = (target - datetime.now()).total_seconds()
#         if remaining > 0:
#             time.sleep(remaining)
#         print(f"Hoàn thành phiên dự báo cho mốc {target.time()}. Bắt đầu vòng lặp mới.\n")

if __name__ == "__main__":
    main_loop()
