import json
from pymongo import MongoClient
from datetime import datetime, timedelta

MONGO_URI = "mongodb+srv://admin1:a67RqW9HDY8Fj4Sh@cluster0.nyw26.mongodb.net/"
client = MongoClient(MONGO_URI)
db = client["Airport_Weather"]
flights_col = db["data_flights"]
weather_col = db["data_warning_weathers"]

def get_datetime(value):
    """Chuyển đổi giá trị thành kiểu datetime nếu chưa phải datetime"""
    if isinstance(value, datetime):
        return value
    return datetime.strptime(value, "%Y-%m-%d %H:%M:%S")

def get_weather_data(airport_code, time_depart):
    """Lấy dữ liệu thời tiết trong khoảng 59 phút trước & sau giờ cất cánh"""
    time_start = time_depart - timedelta(minutes=59)
    time_end = time_depart + timedelta(minutes=59)

    weather_data = list(
        weather_col.find(
            {
                "airport_code": airport_code,
                "predictions.timestamp": {
                    "$gte": time_start.isoformat(),
                    "$lte": time_end.isoformat()
                }
            }
        )
    )
    
    # Debug: Kiểm tra dữ liệu thời tiết
    print(f"Tìm thấy {len(weather_data)} bản ghi thời tiết cho sân bay {airport_code} từ {time_start} đến {time_end}")
    
    # Nếu không có dữ liệu, thử mở rộng khoảng thời gian tìm kiếm
    if not weather_data:
        extended_time_start = time_depart - timedelta(hours=12)
        extended_time_end = time_depart + timedelta(hours=12)
        weather_data = list(
            weather_col.find(
                {
                    "airport_code": airport_code,
                    "predictions.timestamp": {
                        "$gte": extended_time_start.isoformat(),
                        "$lte": extended_time_end.isoformat()
                    }
                }
            )
        )
        print(f"Mở rộng tìm kiếm: Tìm thấy {len(weather_data)} bản ghi thời tiết trong khoảng 12 giờ")
    
    return weather_data

def calculate_delay(weather_data, time_depart):
    """Tính toán độ trễ chuyến bay dựa vào dữ liệu thời tiết"""
    delay = 0
    for weather in weather_data:
        for prediction in weather["predictions"]:
            weather_time = datetime.fromisoformat(prediction["timestamp"][:-6])
            rain_prob = prediction["weather_info"]["rain_probability"]
            temperature = prediction["weather_info"]["temperature"]
            visibility = prediction["weather_info"]["visibility"]
            cloud = prediction["weather_info"]["cloud"]
            pressure = prediction["weather_info"]["pressure"]

            if time_depart - timedelta(minutes=59) <= weather_time <= time_depart + timedelta(minutes=59):
                if rain_prob > 50 or temperature < 10 or visibility < 5 or cloud > 80 or pressure < 1000:
                    delay += 30  # Tăng độ trễ thêm 30 phút nếu có mưa lớn, nhiệt độ thấp, tầm nhìn kém, mây dày hoặc áp suất thấp
                elif rain_prob > 30 or temperature < 15 or visibility < 8 or cloud > 60 or pressure < 1010:
                    delay += 15
                elif rain_prob > 20 or temperature < 20 or visibility < 10 or cloud > 40 or pressure < 1020:
                    delay += 10
                # delay 60 phút nếu có mưa lớn, nhiệt độ thấp, tầm nhìn kém, mây dày hoặc áp suất thấp
                if rain_prob > 50 or temperature < 10 or visibility < 5 or cloud > 80 or pressure < 1000:
                    delay += 60
                elif rain_prob > 30 or temperature < 15 or visibility < 8 or cloud > 60 or pressure < 1010:
                    delay += 30
                elif rain_prob > 20 or temperature < 20 or visibility < 10 or cloud > 40 or pressure < 1020:
                    delay += 15
                elif rain_prob == 0 or rain_prob < 0 or temperature > 30 or visibility > 10 or cloud < 20 or pressure > 1020:
                    delay = 0
                    break
    return delay

def get_weather_severity(weather_summary, weather_info):
    """
    Đánh giá mức độ nghiêm trọng của điều kiện thời tiết trên thang điểm 1-5
    1: Ảnh hưởng nhẹ, 5: Ảnh hưởng nghiêm trọng
    """
    severity = 0
    severity_reasons = []
    
    # Đánh giá dựa trên tóm tắt thời tiết
    if "Thời tiết tốt" in weather_summary:
        print(f"Thời tiết tốt, không ảnh hưởng")
        return 0, ["Thời tiết tốt"]
    
    # Đánh giá từng yếu tố thời tiết
    if "Có mưa" in weather_summary or weather_info.get("rain_probability", 0) > 30:
        rain_probability = weather_info.get("rain_probability", 0)
        rain_severity = min(rain_probability / 15, 5)  # Giảm ngưỡng từ 20 xuống 15
        precipitation = weather_info.get("precipitation", 0)
        precipitation_severity = min(precipitation * 3, 5)  # Tăng hệ số từ 2 lên 3
        max_rain_severity = max(rain_severity, precipitation_severity)
        severity = max(severity, max_rain_severity)
        severity_reasons.append(f"Mưa: {round(max_rain_severity, 1)}/5 (xác suất {rain_probability}%, lượng mưa {precipitation})")
    
    if "Có tuyết rơi" in weather_summary or weather_info.get("snow_probability", 0) > 10:
        snow_probability = weather_info.get("snow_probability", 0)
        snow_severity = min(snow_probability / 10, 5)  # Giảm ngưỡng từ 15 xuống 10
        severity = max(severity, snow_severity, 2)  # Tuyết luôn ít nhất mức 2, giảm từ 3 xuống 2
        severity_reasons.append(f"Tuyết: {round(max(snow_severity, 2), 1)}/5 (xác suất {snow_probability}%)")
    
    if "Tầm nhìn giảm" in weather_summary or weather_info.get("visibility", 10) < 8:
        visibility = weather_info.get("visibility", 10)
        visibility_severity = min((12 - visibility) * 0.6, 5)  # Tăng ngưỡng từ 10 lên 12, hệ số từ 0.5 lên 0.6
        severity = max(severity, visibility_severity)
        severity_reasons.append(f"Tầm nhìn: {round(visibility_severity, 1)}/5 ({visibility}km)")
    
    if "Gió giật mạnh" in weather_summary or weather_info.get("gust_speed", 0) > 20:
        gust_speed = weather_info.get("gust_speed", 0)
        wind_severity = min((gust_speed - 20) / 8, 5)  # Giảm ngưỡng từ 30 xuống 20, hệ số từ 10 xuống 8
        severity = max(severity, wind_severity, 1)  # Gió giật mạnh luôn ít nhất mức 1, giảm từ 2 xuống 1
        severity_reasons.append(f"Gió: {round(max(wind_severity, 1), 1)}/5 ({gust_speed}km/h)")
    
    # Thêm đánh giá độ ẩm cao
    humidity = weather_info.get("humidity", 0)
    if humidity > 85:
        humidity_severity = min((humidity - 85) / 3, 4)  # 0-4 dựa trên độ ẩm trên 85%
        severity = max(severity, humidity_severity)
        severity_reasons.append(f"Độ ẩm: {round(humidity_severity, 1)}/5 ({humidity}%)")
    
    final_severity = max(1, min(5, round(severity)))  # Đảm bảo giá trị từ 1-5
    print(f"Mức độ nghiêm trọng thời tiết: {final_severity}/5. Lý do: {', '.join(severity_reasons)}")
    
    return final_severity, severity_reasons

def calculate_price_discount(weather_data):
    """Tính toán mức giảm giá dựa vào mức độ nghiêm trọng của thời tiết"""
    if not weather_data:
        print("Không có dữ liệu thời tiết để tính toán giảm giá")
        return 1.0  # Không giảm giá nếu không có dữ liệu thời tiết
    
    max_severity = 0
    all_reasons = []
    
    for data in weather_data:
        airport_code = data.get("airport_code", "Unknown")
        print(f"Phân tích dữ liệu thời tiết cho sân bay {airport_code}")
        
        for prediction in data.get("predictions", []):
            timestamp = prediction.get("timestamp", "Unknown")
            weather_summary = prediction.get("summary", "")
            weather_info = prediction.get("weather_info", {})
            
            print(f"- Dự báo tại {timestamp}: {weather_summary}")
            severity, reasons = get_weather_severity(weather_summary, weather_info)
            
            if severity > max_severity:
                max_severity = severity
                all_reasons = reasons
    
    # Áp dụng mức giảm giá dựa trên mức độ nghiêm trọng
    discount_mappings = {
        0: 1.0,    # 0% discount
        1: 0.93,   # 7% discount (tăng từ 5%)
        2: 0.88,   # 12% discount (tăng từ 10%)
        3: 0.82,   # 18% discount (tăng từ 15%)
        4: 0.76,   # 24% discount (tăng từ 20%)
        5: 0.70    # 30% discount (tăng từ 25%)
    }
    
    discount_factor = discount_mappings.get(max_severity, 1.0)
    print(f"Mức độ nghiêm trọng thời tiết: {max_severity}/5 => Giảm giá {int((1-discount_factor)*100)}%")
    print(f"Lý do chính: {', '.join(all_reasons)}")
    
    return discount_factor

def update_flight_info(flight, delay, time_depart_new, time_landing_new):
    """Cập nhật thông tin chuyến bay bị ảnh hưởng bởi thời tiết"""
    flight_id = flight["_id"]
    
    # Cập nhật trạng thái chuyến bay
    update_data = {
        "Status": "Bị trễ" if delay > 0 else flight["Status"],
        "Time_depart": time_depart_new,
        "Time_landing": time_landing_new,
        "Delay": delay
    }
    
    flights_col.update_one({"_id": flight_id}, {"$set": update_data})
    return update_data

def update_flight_price(flight, discount_factor, weather_warning):
    """Cập nhật giá vé của chuyến bay do ảnh hưởng thời tiết"""
    flight_id = flight["_id"]
    current_price = flight.get("Current_price", flight.get("Initial_price", 1000000))
    initial_price = flight.get("Initial_price", current_price)
    
    # Tính giá mới với mức giảm giá
    new_price = round(current_price * discount_factor)
    
    # Chuẩn bị dữ liệu cập nhật
    update_data = {
        "Current_price": new_price,
        "Initial_price": initial_price,  # Đảm bảo giá ban đầu được lưu
        "Is_Affected_By_Weather": True,
        "Weather_Discount": {
            "discount_factor": discount_factor,
            "applied_at": datetime.now(),
            "weather_warning_id": str(weather_warning["_id"]) if "_id" in weather_warning else None,
            "weather_condition": weather_warning.get("Content", "Thời tiết xấu")
        }
    }
    
    # Cập nhật vào database
    flights_col.update_one({"_id": flight_id}, {"$set": update_data})
    
    return {
        "flight_id": str(flight_id),
        "original_price": current_price,
        "new_price": new_price,
        "discount_percentage": round((1 - discount_factor) * 100),
        "weather_condition": weather_warning.get("Content", "Thời tiết xấu")
    }

def process_flight(flight):
    """Xử lý một chuyến bay: tính toán trễ và giảm giá nếu cần"""
    airport_code = flight["From"]
    time_depart = get_datetime(flight["Time_depart"])
    
    # Lấy dữ liệu thời tiết
    weather_data = get_weather_data(airport_code, time_depart)
    
    results = {}
    
    # Xử lý delay nếu có thời tiết xấu
    if weather_data:
        delay = calculate_delay(weather_data, time_depart)
        
        if delay > 0:
            # Tính thời gian cất cánh và hạ cánh mới
            time_depart_new = time_depart + timedelta(minutes=delay)
            
            # Tính thời gian hạ cánh mới dựa trên thời gian bay không đổi
            time_landing = get_datetime(flight["Time_landing"])
            flight_duration = time_landing - time_depart
            time_landing_new = time_depart_new + flight_duration
            
            # Kiểm tra logic: thời gian hạ cánh phải sau thời gian cất cánh
            if time_landing_new < time_depart_new:
                error_message = f"LỖI: Chuyến bay {flight['Number_Flight']} từ {flight['From']} - Thời gian hạ cánh mới {time_landing_new} nhỏ hơn thời gian cất cánh mới {time_depart_new}!"
                return {"error": error_message}
            
            # Cập nhật thông tin delay
            results["delay_info"] = update_flight_info(flight, delay, time_depart_new, time_landing_new)
        
        # Kiểm tra xem chuyến bay đã bị ảnh hưởng bởi thời tiết chưa
        if not flight.get("Is_Affected_By_Weather", False):
            # Tính toán và áp dụng giảm giá chỉ khi chưa bị ảnh hưởng
            discount_factor = calculate_price_discount(weather_data)
            
            # Nếu có giảm giá (discount_factor < 1), cập nhật giá vé
            if discount_factor < 1:
                # Lấy cảnh báo thời tiết đầu tiên để ghi log
                weather_warning = weather_data[0] if weather_data else {}
                results["price_info"] = update_flight_price(flight, discount_factor, weather_warning)
        else:
            print(f"Chuyến bay {flight.get('Number_Flight')} đã được áp dụng giảm giá do thời tiết trước đó.")
    
    return results

def check_affected_flights():
    """Kiểm tra tất cả các chuyến bay có thể bị ảnh hưởng bởi thời tiết"""
    # Lấy thời gian hiện tại
    current_time = datetime.now()
    
    # Mở rộng khoảng thời gian tìm kiếm từ 24 giờ lên 72 giờ
    time_window = current_time + timedelta(hours=72)
    print(f"Tìm kiếm các chuyến bay từ {current_time} đến {time_window}")
    
    # Lấy tất cả chuyến bay chưa cất cánh
    upcoming_flights = list(flights_col.find({
        "Time_depart": {"$gt": current_time},
        "Time_depart": {"$lt": time_window}
    }))
    
    print(f"Tìm thấy {len(upcoming_flights)} chuyến bay sắp khởi hành")
    
    results = []
    for flight in upcoming_flights:
        print(f"\n--- Xử lý chuyến bay {flight.get('Number_Flight')} từ {flight.get('From')} đến {flight.get('To')} ---")
        print(f"Khởi hành lúc: {flight.get('Time_depart')}")
        
        result = process_flight(flight)
        if result:
            result["flight_number"] = flight["Number_Flight"]
            result["from"] = flight["From"]
            result["to"] = flight["To"]
            results.append(result)
    
    print(f"Tổng số chuyến bay được xử lý: {len(results)}")
    return results

if __name__ == "__main__":
    results = check_affected_flights()
    print(json.dumps(results, indent=2, default=str))
