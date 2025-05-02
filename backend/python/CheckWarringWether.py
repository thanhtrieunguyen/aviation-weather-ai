import json
from collections import defaultdict
from datetime import datetime
from pymongo import MongoClient
from flask_cors import CORS
from flask import Response
from flask import Flask, jsonify, request
import Check_Flight

app = Flask(__name__)
CORS(app)
MONGO_URI = "mongodb+srv://admin1:a67RqW9HDY8Fj4Sh@cluster0.nyw26.mongodb.net/"
client = MongoClient(MONGO_URI)
db = client["Airport_Weather"]  

WEATHER_CODES = {
    "Có mưa": 101,
    "Gió giật mạnh": 102,
    "Có tuyết rơi": 103,
    "Tầm nhìn giảm": 104,
    "Thời tiết tốt": 105
}

def Check_Weather(temperature, humidity, wind_speed, wind_direction, pressure, precipitation, 
                  cloud, uv_index, visibility, dewpoint, gust_speed, rain_probability, snow_probability):
    tom_tat = []
    # Giảm ngưỡng để báo cáo các điều kiện thời tiết xấu hơn
    if rain_probability > 30 or precipitation > 0:  # Giảm từ 50 xuống 30
        tom_tat.append("Có mưa")
    if snow_probability > 20:  # Giảm từ 30 xuống 20
        tom_tat.append("Có tuyết rơi")
    if visibility < 8:  # Tăng từ 5 lên 8
        tom_tat.append("Tầm nhìn giảm")
    if gust_speed > 20 or wind_speed > 15:  # Giảm từ 30 xuống 20, thêm điều kiện wind_speed
        tom_tat.append("Gió giật mạnh")
        
    # Thêm điều kiện về độ ẩm cao
    if humidity > 85:
        tom_tat.append("Độ ẩm cao")
        
    du_bao_tom_tat = ", ".join(tom_tat) if tom_tat else "Thời tiết tốt"
    # Dự báo chi tiết
    du_bao_chi_tiet = f"Nhiệt độ {temperature}°C, độ ẩm {humidity}%, gió {wind_speed} km/h hướng {wind_direction}°, "
    du_bao_chi_tiet += f"áp suất {pressure} hPa, tầm nhìn {visibility} km, mây {cloud}%. "
    
    if rain_probability > 50 or precipitation > 0:
        du_bao_chi_tiet += "Khả năng mưa cao, cần lưu ý khi cất/hạ cánh. "
    else:
        du_bao_chi_tiet += "Thời tiết ổn định, điều kiện bay tốt. "
    if snow_probability > 30:
        du_bao_chi_tiet += "Có khả năng tuyết rơi, cần chuẩn bị đường băng trơn trượt. "
    if visibility < 5:
        du_bao_chi_tiet += "Tầm nhìn kém, có thể ảnh hưởng đến hạ cánh. "
    if abs(temperature - dewpoint) < 2 and humidity > 85:
        du_bao_chi_tiet += "Có thể có sương mù, giảm tầm nhìn. "
    if gust_speed > 30:
        du_bao_chi_tiet += "Gió giật mạnh, có thể ảnh hưởng đến hoạt động bay. "

    weather_code = min([WEATHER_CODES.get(condition, 105) for condition in tom_tat], default=105)
    return du_bao_tom_tat, du_bao_chi_tiet.strip(),weather_code

def get_collection(collection_name):
    try:
        return db[collection_name]
    except Exception as e:
        print(f"Lỗi khi lấy collection '{collection_name}': {e}")
        return None

def get_data_wether(collection_name):
    collection = get_collection(collection_name)
    if collection is None:
        return []
    return [
        {"location_data": doc.get("location_data"), "prediction": doc.get("prediction")}
        for doc in collection.find({}, {"location_data": 1, "prediction": 1, "_id": 0})
    ]

def process_weather_data(collection_name):
    collection = get_collection(collection_name)
    if collection is None:
        return {}

    data = list(collection.find({}, {"_id": 0, "location_data": 1, "prediction": 1}))

    hierarchical_data = {}

    for airport in data:
        location = airport.get("location_data", {})
        airport_info = location.get("airport", {}) 
        predictions = airport.get("prediction", [])

        airport_code = airport_info.get("iata", "Unknown")

        if airport_code not in hierarchical_data:
            hierarchical_data[airport_code] = {
                "location_data": location,
                "predictions": []
            }

        for forecast in predictions:
            raw_timestamp = forecast.get("timestamp", None)
            if raw_timestamp:
                try:
                    timestamp = datetime.fromisoformat(raw_timestamp).strftime("%Y-%m-%dT%H:%M:%S.000+00:00")
                except ValueError:
                    timestamp = "Unknown Time"
            else:
                timestamp = "Unknown Time"
            weather_info = {
                "temperature": forecast.get("temperature", 0),
                "humidity": forecast.get("humidity", 0),
                "wind_speed": forecast.get("wind_speed", 0),
                "wind_direction": forecast.get("wind_direction", 0),
                "pressure": forecast.get("pressure", 0),
                "precipitation": forecast.get("precipitation", 0),
                "cloud": forecast.get("cloud", 0),
                "uv_index": forecast.get("uv_index", 0),
                "visibility": forecast.get("visibility", 10),
                "dewpoint": forecast.get("dewpoint", 0),
                "gust_speed": forecast.get("gust_speed", 0),
                "rain_probability": forecast.get("rain_probability", 0),
                "snow_probability": forecast.get("snow_probability", 0),
            }

            summary, details, weather_code = Check_Weather(**weather_info)
            forecast_data = {
                "timestamp": timestamp,
                "summary": summary,
                "forecast": details,
                "weather_code": weather_code,
                "weather_info": weather_info
            }


            hierarchical_data[airport_code]["predictions"].append(forecast_data)
    return hierarchical_data

def save_weather_data(collection_name, data):
    collection = get_collection(collection_name)
    if collection is None:
        return {'Code': 500, 'Message': 'Lỗi kết nối MongoDB'}
    try:
        collection.delete_many({})
        for airport_code, details in data.items():
            collection.insert_one({
                "airport_code": airport_code,
                "location_data": details["location_data"],
                "predictions": details["predictions"]
            })
        return {'Code': 200, 'Message': 'Dữ liệu đã được cập nhật thành công!'}
    except Exception as e:
        return {'Code': 500, 'Message': f'Lỗi khi lưu dữ liệu: {str(e)}'}

# 🔹 API kiểm tra
@app.route('/check_data_weather', methods=['POST'])
def check_data_weather():
    processed_weather_data = process_weather_data("data_weathers")
    response = save_weather_data("data_warning_weathers", processed_weather_data)
    
    # Add automatic price adjustment
    price_adjustments = Check_Flight.check_affected_flights()
    
    # Include price adjustment info in the response
    adjusted_flights = [r for r in price_adjustments if "price_info" in r]
    response["price_adjustments"] = {
        "count": len(adjusted_flights),
        "details": adjusted_flights
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
