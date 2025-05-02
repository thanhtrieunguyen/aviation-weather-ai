import numpy as np

def convert_direction_to_wind_components(directions):
    """
    Chuyển đổi từ góc hướng gió (0-360 độ) thành các thành phần sin và cos
    
    Parameters:
    -----------
    directions : array-like
        Góc hướng gió theo độ (0-360)
        
    Returns:
    --------
    tuple
        (sin_component, cos_component)
    """
    radians = np.radians(directions)
    sin_component = np.sin(radians)
    cos_component = np.cos(radians)
    return sin_component, cos_component

def convert_wind_components_to_direction(sin_pred, cos_pred):
    """
    Chuyển đổi từ thành phần sin và cos thành góc hướng gió (0-360 độ)
    
    Parameters:
    -----------
    sin_pred : array-like
        Thành phần sin của hướng gió
    cos_pred : array-like
        Thành phần cos của hướng gió
        
    Returns:
    --------
    array-like
        Góc hướng gió theo độ (0-360)
    """
    directions = np.degrees(np.arctan2(sin_pred, cos_pred))
    # Chuyển từ khoảng (-180, 180) sang khoảng (0, 360)
    directions = (directions + 360) % 360
    return directions

def convert_wind_direction_to_symbol(direction):
    """
    Chuyển đổi góc hướng gió thành ký hiệu hướng gió (N, NE, E, SE, S, SW, W, NW)
    
    Parameters:
    -----------
    direction : float
        Góc hướng gió (0-360 độ)
        
    Returns:
    --------
    str
        Ký hiệu hướng gió
    """
    # Xử lý trường hợp góc ngoài khoảng
    direction = float(direction) % 360
    
    if 337.5 <= direction or direction < 22.5:
        return 'N'
    elif 22.5 <= direction < 67.5:
        return 'NE'
    elif 67.5 <= direction < 112.5:
        return 'E'
    elif 112.5 <= direction < 157.5:
        return 'SE'
    elif 157.5 <= direction < 202.5:
        return 'S'
    elif 202.5 <= direction < 247.5:
        return 'SW'
    elif 247.5 <= direction < 292.5:
        return 'W'
    elif 292.5 <= direction < 337.5:
        return 'NW'
    else:
        return 'N'  # Default fallback
