"""
Module để ánh xạ từ các thông số thời tiết sang condition_code dựa trên logic và quy tắc.
"""
import os
import json
import math
from typing import Dict, List, Optional, Tuple, Union

# Đường dẫn đến file conditions.json
CONDITIONS_FILE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), 
    "backend", "ml", "data", "conditions.json"
)

# Định nghĩa các nhóm mã condition chính
CLEAR_CODES = [1000]  # Trời quang đãng
PARTLY_CLOUDY_CODES = [1003]  # Có mây một phần
CLOUDY_CODES = [1006, 1009]  # Nhiều mây hoặc u ám
MIST_CODES = [1030, 1135, 1147]  # Sương mù, sương khói
RAIN_CODES = [1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201]  # Các mã về mưa
SNOW_CODES = [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258]  # Các mã về tuyết
SLEET_CODES = [1069, 1204, 1207, 1249, 1252]  # Các mã về mưa tuyết
THUNDERSTORM_CODES = [1087, 1273, 1276, 1279, 1282]  # Các mã về giông bão
DUST_SAND_CODES = [1237]  # Bão cát, bụi
DRIZZLE_CODES = [1150, 1153, 1168, 1171]  # Mưa phùn
FOG_CODES = [1135, 1147]  # Sương mù
ICE_PELLET_CODES = [1237, 1261, 1264]  # Mưa đá

class ConditionCodeMapper:
    """Lớp xử lý việc ánh xạ từ thông số thời tiết sang condition code."""
    
    # Tải dữ liệu từ file conditions.json nếu tồn tại
    try:
        with open(CONDITIONS_FILE_PATH, 'r', encoding='utf-8') as f:
            conditions_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        conditions_data = []

    # Tạo ánh xạ từ code sang condition information
    conditions_map = {item['code']: item for item in conditions_data}
    
    @staticmethod
    def get_condition_code(precipitation=0, temp=None, humidity=None, wind_speed=None, 
                          cloud_cover=None, visibility=None, pressure=None, is_day=1):
        """
        Ánh xạ các thông số thời tiết sang condition code.
        
        Args:
            precipitation (float): Lượng mưa (mm)
            temp (float): Nhiệt độ (°C)
            humidity (float): Độ ẩm (%)
            wind_speed (float): Tốc độ gió (km/h)
            cloud_cover (float): Độ che phủ của mây (%)
            visibility (float): Tầm nhìn (km)
            pressure (float): Áp suất khí quyển (hPa)
            is_day (int): Ngày hay đêm (1 = ngày, 0 = đêm)
            
        Returns:
            int: Mã condition code tương ứng
        """
        # 1. Xử lý các điều kiện đặc biệt
        
        # Kiểm tra điều kiện bão/giông
        # Giông bão thường xảy ra khi có mưa, áp suất thấp và nhiệt độ cao
        if (precipitation is not None and precipitation > 0 and
            pressure is not None and pressure < 1000 and
            temp is not None and temp > 20):
            if precipitation >= 10:  # Mưa giông nặng
                return 1276  # Moderate or heavy rain in area with thunder
            else:  # Mưa giông nhẹ
                return 1273  # Patchy light rain in area with thunder
                
        # Tuyết với giông sét
        if (precipitation is not None and precipitation > 0 and
            temp is not None and temp <= 0 and
            pressure is not None and pressure < 1000):
            if precipitation >= 5:
                return 1282  # Moderate or heavy snow in area with thunder
            else:
                return 1279  # Patchy light snow in area with thunder
        
        # Bão tuyết - cần tốc độ gió cao và nhiệt độ thấp
        if (wind_speed is not None and wind_speed > 50 and
            temp is not None and temp < 0 and
            precipitation is not None and precipitation > 0):
            return 1117  # Blizzard
        
        # Tuyết bay - cần gió to và có tuyết
        if (wind_speed is not None and wind_speed > 30 and
            temp is not None and temp < 0 and
            precipitation is not None and precipitation > 0):
            return 1114  # Blowing snow
        
        # Sương mù dựa vào tầm nhìn và độ ẩm
        if visibility is not None:
            if visibility < 1:
                # Sương mù đóng băng
                if temp is not None and temp < 0:
                    return 1147  # Freezing fog
                # Sương mù dày đặc
                return 1135  # Fog
            elif visibility < 4 and humidity is not None and humidity > 85:
                return 1030  # Mist
        
        # 2. Xử lý các điều kiện mưa đá
        if (precipitation is not None and precipitation > 0 and
            temp is not None and temp > 0 and temp < 10 and
            humidity is not None and humidity < 70):
            if precipitation >= 5:
                return 1264  # Moderate or heavy showers of ice pellets
            else:
                return 1261  # Light showers of ice pellets
        
        # 3. Xử lý điều kiện băng tuyết (sleet)
        if (precipitation is not None and precipitation > 0 and
            temp is not None and temp > -2 and temp < 3):
            if precipitation >= 5:
                return 1207  # Moderate or heavy sleet
            else:
                return 1204  # Light sleet
        
        # 4. Xử lý mưa băng
        if (precipitation is not None and precipitation > 0 and
            temp is not None and temp < 0 and
            humidity is not None and humidity > 80):
            if precipitation >= 5:
                return 1201  # Moderate or heavy freezing rain
            else:
                return 1198  # Light freezing rain
        
        # 5. Xử lý mưa phùn (drizzle)
        if (precipitation is not None and 0 < precipitation < 1 and
            humidity is not None and humidity > 90):
            if temp is not None and temp < 0:
                if precipitation >= 0.5:
                    return 1171  # Heavy freezing drizzle
                else:
                    return 1168  # Freezing drizzle
            else:
                if precipitation >= 0.5:
                    return 1153  # Light drizzle
                else:
                    return 1150  # Patchy light drizzle
        
        # 6. Xử lý trường hợp có mưa
        if precipitation is not None and precipitation > 0:
            # Mưa rào (showers) - mưa ngắt quãng, thường mạnh
            if cloud_cover is not None and cloud_cover < 70:  # Không phải mưa liên tục
                if precipitation >= 15:
                    return 1246  # Torrential rain shower
                elif precipitation >= 8:
                    return 1243  # Moderate or heavy rain shower
                else:
                    return 1240  # Light rain shower
            # Mưa thông thường (rain) - mưa đều, liên tục
            else:
                if precipitation >= 20:  # Mưa rất to
                    return 1195  # Heavy rain
                elif precipitation >= 10:  # Mưa to
                    return 1192  # Heavy rain at times
                elif precipitation >= 5:  # Mưa vừa
                    return 1189  # Moderate rain
                elif precipitation >= 2:  # Mưa nhẹ vừa
                    return 1186  # Moderate rain at times
                elif precipitation >= 0.5:  # Mưa nhẹ
                    return 1183  # Light rain
                else:  # Mưa rất nhẹ
                    return 1180  # Patchy light rain
        
        # 7. Xử lý trường hợp có tuyết 
        if temp is not None and temp <= 0 and precipitation is not None and precipitation > 0:
            # Tuyết rào (snow showers)
            if cloud_cover is not None and cloud_cover < 70:
                if precipitation >= 5:
                    return 1258  # Moderate or heavy snow showers
                else:
                    return 1255  # Light snow showers
            # Tuyết thường
            else:
                if precipitation >= 10:  # Tuyết dày
                    return 1225  # Heavy snow
                elif precipitation >= 5:  # Tuyết dày lẻ tẻ
                    return 1222  # Patchy heavy snow
                elif precipitation >= 2:  # Tuyết vừa
                    return 1219  # Moderate snow
                elif precipitation >= 1:  # Tuyết vừa lẻ tẻ
                    return 1216  # Patchy moderate snow
                else:  # Tuyết nhẹ
                    return 1213  # Light snow
        
        # 8. Xử lý trời nhiều mây
        if cloud_cover is not None:
            if cloud_cover >= 85:  # U ám
                return 1009  # Overcast
            elif cloud_cover >= 50:  # Nhiều mây
                return 1006  # Cloudy
            elif cloud_cover >= 25:  # Mây rải rác
                return 1003  # Partly Cloudy
            else:  # Quang đãng
                return 1000  # Sunny/Clear
        
        # 9. Trường hợp mặc định: trời quang đãng
        return 1000
    
    @staticmethod
    def get_condition_text(condition_code, is_day=1):
        """
        Chuyển đổi condition code sang mô tả bằng văn bản.
        
        Args:
            condition_code (int): Mã condition code
            is_day (int): Ngày hay đêm (1 = ngày, 0 = đêm)
            
        Returns:
            str: Mô tả về điều kiện thời tiết
        """
        # Sử dụng dữ liệu từ conditions.json nếu có
        if condition_code in ConditionCodeMapper.conditions_map:
            condition_info = ConditionCodeMapper.conditions_map[condition_code]
            return condition_info['day'] if is_day else condition_info['night']
        
        # Fallback nếu không có trong JSON
        condition_map = {
            1000: "Trời quang đãng" if is_day else "Trời quang, trăng sao",
            1003: "Có mây rải rác" ,
            1006: "Nhiều mây",
            1009: "Trời u ám",
            1030: "Sương mù nhẹ",
            1063: "Mưa rào rải rác",
            1066: "Tuyết rơi rải rác",
            1069: "Mưa tuyết rải rác",
            1087: "Có giông sét rải rác",
            1114: "Tuyết bay",
            1117: "Bão tuyết",
            1135: "Sương mù",
            1147: "Sương mù dày đặc",
            1150: "Mưa phùn nhẹ rải rác",
            1153: "Mưa phùn nhẹ",
            1168: "Mưa phùn băng giá",
            1171: "Mưa phùn băng giá nặng",
            1180: "Mưa nhẹ rải rác",
            1183: "Mưa nhẹ",
            1186: "Mưa vừa lúc vừa lúc",
            1189: "Mưa vừa",
            1192: "Mưa to lúc vừa lúc",
            1195: "Mưa to",
            1198: "Mưa băng nhẹ",
            1201: "Mưa băng vừa hoặc to",
            1204: "Mưa tuyết nhẹ",
            1207: "Mưa tuyết vừa hoặc to",
            1210: "Tuyết nhẹ rải rác",
            1213: "Tuyết nhẹ",
            1216: "Tuyết vừa rải rác",
            1219: "Tuyết vừa",
            1222: "Tuyết dày rải rác",
            1225: "Tuyết dày",
            1237: "Mưa đá",
            1240: "Mưa rào nhẹ",
            1243: "Mưa rào vừa hoặc to",
            1246: "Mưa rào dữ dội",
            1249: "Mưa tuyết nhẹ",
            1252: "Mưa tuyết vừa hoặc to",
            1255: "Tuyết rơi nhẹ",
            1258: "Tuyết rơi vừa hoặc to",
            1261: "Mưa đá nhẹ",
            1264: "Mưa đá vừa hoặc to",
            1273: "Mưa giông nhẹ rải rác",
            1276: "Mưa giông vừa hoặc to",
            1279: "Tuyết giông nhẹ rải rác",
            1282: "Tuyết giông vừa hoặc to",
        }
        
        return condition_map.get(condition_code, "Không xác định")
    
    @staticmethod
    def find_closest_known_code(precipitation=0, temp=None, humidity=None, wind_speed=None, 
                               cloud_cover=None, visibility=None, pressure=None, is_day=1):
        """
        Tìm condition code gần nhất dựa trên các thông số thời tiết khi gặp mã lạ.
        Sử dụng khoảng cách Euclidean đã chuẩn hoá để tính toán độ tương đồng.
        
        Args:
            precipitation (float): Lượng mưa (mm)
            temp (float): Nhiệt độ (°C)
            humidity (float): Độ ẩm (%)
            wind_speed (float): Tốc độ gió (km/h)
            cloud_cover (float): Độ che phủ của mây (%)
            visibility (float): Tầm nhìn (km)
            pressure (float): Áp suất khí quyển (hPa)
            is_day (int): Ngày hay đêm (1 = ngày, 0 = đêm)
            
        Returns:
            int: Mã condition code gần nhất với tham số đầu vào
        """
        # Định nghĩa các điểm tham chiếu cho các code phổ biến
        # Format: [code, precipitation, temp, humidity, wind_speed, cloud_cover, visibility, pressure]
        reference_points = [
            # Sunny/Clear
            [1000, 0, 25, 50, 10, 10, 20, 1013],
            # Partly Cloudy
            [1003, 0, 22, 60, 12, 40, 15, 1012],
            # Cloudy
            [1006, 0, 20, 70, 15, 75, 12, 1010],
            # Overcast
            [1009, 0, 18, 75, 20, 95, 8, 1008],
            # Mist
            [1030, 0, 15, 85, 5, 50, 5, 1015],
            # Fog
            [1135, 0, 12, 95, 3, 60, 1, 1016],
            # Light Rain
            [1183, 2, 18, 80, 10, 85, 8, 1005],
            # Moderate Rain
            [1189, 7, 17, 85, 20, 90, 5, 1002],
            # Heavy Rain
            [1195, 20, 16, 90, 30, 95, 3, 998],
            # Light Snow
            [1213, 1, -2, 85, 8, 80, 7, 1010],
            # Moderate Snow
            [1219, 5, -4, 90, 15, 90, 4, 1008],
            # Heavy Snow
            [1225, 15, -5, 90, 25, 95, 2, 1000],
            # Thunderstorm
            [1276, 15, 22, 85, 35, 95, 3, 995],
        ]
        
        # Chuẩn hoá khoảng giá trị cho các thông số thời tiết
        # Sử dụng Max-Min normalization
        def normalize(value, min_val, max_val):
            if value is None or min_val == max_val:
                return 0
            return (value - min_val) / (max_val - min_val)
        
        # Giá trị tối đa và tối thiểu cho mỗi thông số
        precip_range = (0, 25)
        temp_range = (-10, 40)
        humidity_range = (0, 100)
        wind_range = (0, 100)
        cloud_range = (0, 100)
        visibility_range = (0, 25)
        pressure_range = (950, 1050)
        
        # Chuẩn hoá giá trị đầu vào
        norm_precip = normalize(precipitation, *precip_range)
        norm_temp = normalize(temp, *temp_range)
        norm_humidity = normalize(humidity, *humidity_range)
        norm_wind = normalize(wind_speed, *wind_range)
        norm_cloud = normalize(cloud_cover, *cloud_range)
        norm_visibility = normalize(visibility, *visibility_range)
        norm_pressure = normalize(pressure, *pressure_range)
        
        # Trọng số cho mỗi thông số - những thông số quan trọng hơn sẽ có trọng số cao hơn
        weights = {
            'precipitation': 3.0,  # Lượng mưa rất quan trọng
            'temp': 2.0,          # Nhiệt độ quan trọng
            'humidity': 1.0,
            'wind_speed': 1.0,
            'cloud_cover': 2.0,   # Độ che phủ mây quan trọng
            'visibility': 1.5,
            'pressure': 0.8
        }
        
        # Tính khoảng cách Euclidean có trọng số giữa đầu vào và mỗi điểm tham chiếu
        min_distance = float('inf')
        closest_code = 1000  # Mặc định trời quang
        
        for point in reference_points:
            code = point[0]
            # Chuẩn hoá giá trị của điểm tham chiếu
            ref_precip = normalize(point[1], *precip_range)
            ref_temp = normalize(point[2], *temp_range)
            ref_humidity = normalize(point[3], *humidity_range)
            ref_wind = normalize(point[4], *wind_range)
            ref_cloud = normalize(point[5], *cloud_range)
            ref_visibility = normalize(point[6], *visibility_range)
            ref_pressure = normalize(point[7], *pressure_range)
            
            # Tính khoảng cách Euclidean có trọng số
            distance = 0
            
            if precipitation is not None:
                distance += weights['precipitation'] * ((norm_precip - ref_precip) ** 2)
            if temp is not None:
                distance += weights['temp'] * ((norm_temp - ref_temp) ** 2)
            if humidity is not None:
                distance += weights['humidity'] * ((norm_humidity - ref_humidity) ** 2)
            if wind_speed is not None:
                distance += weights['wind_speed'] * ((norm_wind - ref_wind) ** 2)
            if cloud_cover is not None:
                distance += weights['cloud_cover'] * ((norm_cloud - ref_cloud) ** 2)
            if visibility is not None:
                distance += weights['visibility'] * ((norm_visibility - ref_visibility) ** 2)
            if pressure is not None:
                distance += weights['pressure'] * ((norm_pressure - ref_pressure) ** 2)
                
            distance = math.sqrt(distance)
            
            # Cập nhật mã gần nhất
            if distance < min_distance:
                min_distance = distance
                closest_code = code
        
        return closest_code
    
    @staticmethod
    def get_condition_info(condition_code, is_day=1):
        """
        Lấy thông tin đầy đủ về điều kiện thời tiết dựa trên mã.
        
        Args:
            condition_code (int): Mã condition code
            is_day (int): Ngày hay đêm (1 = ngày, 0 = đêm)
            
        Returns:
            dict: Thông tin về điều kiện thời tiết bao gồm text, icon
        """
        condition_text = ConditionCodeMapper.get_condition_text(condition_code, is_day)
        icon = None
        
        # Lấy thông tin icon từ conditions.json nếu có
        if condition_code in ConditionCodeMapper.conditions_map:
            icon = ConditionCodeMapper.conditions_map[condition_code].get('icon')
        
        # Format icon code để sử dụng trong UI
        icon_time = "day" if is_day else "night"
        icon_code = f"{condition_code}_{icon_time}" if icon is None else f"{icon}_{icon_time}"
        
        return {
            "condition_text": condition_text,
            "icon": icon_code,
            "condition_code": condition_code
        }

# Ví dụ sử dụng
if __name__ == "__main__":
    # Ví dụ: trời nhiều mây, không mưa
    condition_code = ConditionCodeMapper.get_condition_code(
        precipitation=0, 
        temp=25, 
        cloud_cover=60,
        humidity=65,
        wind_speed=15,
        pressure=1010,
        visibility=10
    )
    condition_info = ConditionCodeMapper.get_condition_info(condition_code)
    print(f"Condition code: {condition_code}, Info: {condition_info}")
    
    # Ví dụ: trời mưa vừa
    condition_code = ConditionCodeMapper.get_condition_code(
        precipitation=6.5, 
        temp=22, 
        cloud_cover=90,
        humidity=85,
        wind_speed=20,
        pressure=1002,
        visibility=5
    )
    condition_info = ConditionCodeMapper.get_condition_info(condition_code)
    print(f"Condition code: {condition_code}, Info: {condition_info}")
    
    # Ví dụ: giông bão
    condition_code = ConditionCodeMapper.get_condition_code(
        precipitation=12, 
        temp=26, 
        cloud_cover=95,
        humidity=90,
        wind_speed=45,
        pressure=990,
        visibility=2
    )
    condition_info = ConditionCodeMapper.get_condition_info(condition_code)
    print(f"Condition code: {condition_code}, Info: {condition_info}")
