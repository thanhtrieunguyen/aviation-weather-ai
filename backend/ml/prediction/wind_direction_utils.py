import numpy as np
import pandas as pd

class WindDirectionConverter:
    """
    Lớp tiện ích cho xử lý hướng gió, chuyển đổi giữa góc và các thành phần vector
    """
    
    @staticmethod
    def angle_to_components(angles):
        """
        Chuyển đổi từ góc (độ) sang thành phần vector (sin, cos)
        
        Args:
            angles: Góc hướng gió (độ) - có thể là số hoặc mảng
            
        Returns:
            Tuple (sin, cos) tương ứng với góc hướng gió
        """
        # Chuyển từ độ sang radian
        rad_angles = np.radians(angles)
        
        # Tính sin và cos
        sin_vals = np.sin(rad_angles)
        cos_vals = np.cos(rad_angles)
        
        return sin_vals, cos_vals
    
    @staticmethod
    def components_to_angle(sin_vals, cos_vals):
        """
        Chuyển đổi từ thành phần vector (sin, cos) sang góc (độ)
        
        Args:
            sin_vals: Thành phần sin của hướng gió
            cos_vals: Thành phần cos của hướng gió
            
        Returns:
            Góc hướng gió (độ) từ 0-360
        """
        # Sử dụng arctan2 để xác định góc chính xác ở cả 4 góc phần tư
        angles = np.degrees(np.arctan2(sin_vals, cos_vals))
        
        # Chuyển đổi từ khoảng (-180, 180) sang khoảng (0, 360)
        angles = (angles + 360) % 360
        
        return angles
    
    @staticmethod
    def calculate_angular_error(pred_angles, true_angles):
        """
        Tính toán sai số góc giữa dự báo và thực tế
        có xem xét tính tuần hoàn của góc
        
        Args:
            pred_angles: Góc hướng gió dự báo (độ)
            true_angles: Góc hướng gió thực tế (độ)
            
        Returns:
            Sai số góc (độ)
        """
        # Tính hiệu giữa góc dự báo và thực tế
        diff = np.abs(pred_angles - true_angles)
        
        # Tính sai số góc có xét đến tính tuần hoàn (0 và 360 là cùng một hướng)
        error = np.minimum(diff, 360 - diff)
        
        return error
    
    @staticmethod
    def convert_wind_direction_to_symbol(degrees):
        """
        Chuyển đổi từ góc hướng gió sang biểu tượng chữ (N, NE, E, SE, S, SW, W, NW)
        
        Args:
            degrees: Góc hướng gió (độ)
            
        Returns:
            Biểu tượng chữ tương ứng với hướng gió
        """
        # Đảm bảo góc nằm trong khoảng 0-360
        degrees = (degrees + 360) % 360
        
        # Định nghĩa các khoảng góc cho mỗi hướng
        directions = {
            'N': (337.5, 22.5),    # 0 độ
            'NE': (22.5, 67.5),    # 45 độ
            'E': (67.5, 112.5),    # 90 độ
            'SE': (112.5, 157.5),  # 135 độ
            'S': (157.5, 202.5),   # 180 độ
            'SW': (202.5, 247.5),  # 225 độ
            'W': (247.5, 292.5),   # 270 độ
            'NW': (292.5, 337.5),  # 315 độ
        }
        
        # Xác định hướng dựa trên góc
        for symbol, (lower, upper) in directions.items():
            if lower <= degrees < upper:
                return symbol
            
            # Trường hợp đặc biệt cho North (khoảng 337.5-360 và 0-22.5)
            if lower > upper and (degrees >= lower or degrees < upper):
                return symbol
        
        # Mặc định nếu không tìm được
        return 'N'
