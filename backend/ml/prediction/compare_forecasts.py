import os
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import argparse
import requests
from datetime import datetime, timedelta
import json

# Thêm đường dẫn gốc của dự án vào sys.path
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(project_root)

from backend.ml.prediction.weather_prediction import WeatherPredictionService, get_current_weather

def parse_args():
    parser = argparse.ArgumentParser(description='So sánh các mô hình dự báo thời tiết với dữ liệu thực tế')
    
    parser.add_argument(
        '--location', 
        type=str,
        default='12.7,108.1',
        help='Tọa độ vị trí cần dự báo (định dạng lat,lon)'
    )
    
    parser.add_argument(
        '--api-key', 
        type=str,
        required=True,
        help='API key cho dịch vụ thời tiết'
    )
    
    parser.add_argument(
        '--hours',
        type=int,
        default=12,
        help='Số giờ cần dự báo'
    )
    
    parser.add_argument(
        '--output', 
        type=str,
        default=os.path.join(project_root, 'backend', 'ml', 'evaluation', 'forecast_comparison'),
        help='Thư mục lưu kết quả so sánh'
    )
    
    return parser.parse_args()

def prepare_models():
    """Chuẩn bị các mô hình khác nhau để so sánh"""
    models = {
        'RandomForest': os.path.join(project_root, 'backend', 'ml', 'models', 'rf_weather_models.joblib'),
        'XGBoost': os.path.join(project_root, 'backend', 'ml', 'models', 'xgb_weather_models.joblib'),
        'LightGBM': os.path.join(project_root, 'backend', 'ml', 'models', 'lgb_weather_models.joblib'),
        'Best': os.path.join(project_root, 'backend', 'ml', 'models', 'best_weather_models.joblib')
    }
    
    # Kiểm tra xem các mô hình đã tồn tại chưa
    available_models = {}
    for name, path in models.items():
        if os.path.exists(path):
            available_models[name] = path
    
    if not available_models:
        print("Không tìm thấy mô hình nào. Vui lòng huấn luyện trước.")
        return None
    
    print(f"Đã tìm thấy {len(available_models)} mô hình: {list(available_models.keys())}")
    return available_models

def fetch_real_data(api_key, location, prediction_time):
    """Lấy dữ liệu thực tế từ API thời tiết"""
    # Thời gian hiện tại để lấy dữ liệu
    current_time = datetime.now()
    if prediction_time > current_time:
        print(f"Không thể lấy dữ liệu thực tế cho thời điểm trong tương lai: {prediction_time}")
        return None
    
    # Thử lấy dữ liệu lịch sử
    try:
        url = f"https://api.weatherapi.com/v1/history.json?key={api_key}&q={location}&dt={prediction_time.strftime('%Y-%m-%d')}"
        response = requests.get(url)
        data = response.json()
        
        # Tìm giờ gần nhất với prediction_time
        if 'forecast' in data and 'forecastday' in data['forecast'] and len(data['forecast']['forecastday']) > 0:
            hours = data['forecast']['forecastday'][0]['hour']
            closest_hour = min(hours, key=lambda x: abs(datetime.fromisoformat(x['time'].replace('Z', '+00:00')) - prediction_time))
            return closest_hour
        else:
            print(f"Không tìm thấy dữ liệu thực tế cho thời điểm: {prediction_time}")
            return None
            
    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu thực tế: {e}")
        return None

def generate_forecasts(models, api_key, location, hours):
    """Tạo dự báo từ các mô hình khác nhau"""
    forecasts = {}
    
    for name, model_path in models.items():
        print(f"Đang tạo dự báo với mô hình {name}...")
        service = WeatherPredictionService(model_path)
        try:
            forecast = service.predict(api_key, location, prediction_hours=hours)
            forecasts[name] = forecast
        except Exception as e:
            print(f"Lỗi khi tạo dự báo với mô hình {name}: {e}")
    
    return forecasts

def compare_with_real_data(forecasts, api_key, location):
    """So sánh dự báo với dữ liệu thực tế"""
    results = []
    
    for name, forecast in forecasts.items():
        for prediction in forecast.get('forecasts', []):
            prediction_time = datetime.fromisoformat(prediction['timestamp'].replace('Z', '+00:00'))
            real_data = fetch_real_data(api_key, location, prediction_time)
            
            if real_data is None:
                continue
            
            # So sánh các trường dữ liệu
            comparison = {
                'model': name,
                'timestamp': prediction['timestamp'],
                'temperature': {
                    'predicted': prediction['temperature'],
                    'real': real_data['temp_c'],
                    'error': abs(prediction['temperature'] - real_data['temp_c']),
                    'error_percent': abs((prediction['temperature'] - real_data['temp_c']) / real_data['temp_c'] * 100) if real_data['temp_c'] != 0 else float('inf')
                },
                'humidity': {
                    'predicted': prediction['humidity'],
                    'real': real_data['humidity'],
                    'error': abs(prediction['humidity'] - real_data['humidity']),
                    'error_percent': abs((prediction['humidity'] - real_data['humidity']) / real_data['humidity'] * 100) if real_data['humidity'] != 0 else float('inf')
                },
                'wind_speed': {
                    'predicted': prediction['wind_speed'],
                    'real': real_data['wind_kph'],
                    'error': abs(prediction['wind_speed'] - real_data['wind_kph']),
                    'error_percent': abs((prediction['wind_speed'] - real_data['wind_kph']) / real_data['wind_kph'] * 100) if real_data['wind_kph'] != 0 else float('inf')
                },
                'pressure': {
                    'predicted': prediction['pressure'],
                    'real': real_data['pressure_mb'],
                    'error': abs(prediction['pressure'] - real_data['pressure_mb']),
                    'error_percent': abs((prediction['pressure'] - real_data['pressure_mb']) / real_data['pressure_mb'] * 100) if real_data['pressure_mb'] != 0 else float('inf')
                }
            }
            
            results.append(comparison)
    
    # Sắp xếp kết quả theo timestamp để tránh đường nối đứt đoạn khi vẽ biểu đồ
    results = sorted(results, key=lambda x: datetime.fromisoformat(x['timestamp'].replace('Z', '+00:00')))
    return results

def calculate_accuracy(comparisons):
    """Tính toán độ chính xác của các mô hình"""
    # Tạo dữ liệu theo mô hình
    model_accuracy = {}
    
    for comparison in comparisons:
        model = comparison['model']
        if model not in model_accuracy:
            model_accuracy[model] = {
                'temperature': [],
                'humidity': [],
                'wind_speed': [],
                'pressure': [],
                'overall': []
            }
        
        # Tính độ chính xác cho từng đặc trưng (100% - error_percent)
        for feature in ['temperature', 'humidity', 'wind_speed', 'pressure']:
            error_percent = comparison[feature]['error_percent']
            if not np.isinf(error_percent):
                accuracy = max(0, 100 - error_percent)  # Đảm bảo không âm
                model_accuracy[model][feature].append(accuracy)
                model_accuracy[model]['overall'].append(accuracy)
    
    # Tính trung bình độ chính xác
    summary = {}
    for model, accuracies in model_accuracy.items():
        summary[model] = {
            'temperature': np.mean(accuracies['temperature']) if accuracies['temperature'] else 0,
            'humidity': np.mean(accuracies['humidity']) if accuracies['humidity'] else 0,
            'wind_speed': np.mean(accuracies['wind_speed']) if accuracies['wind_speed'] else 0,
            'pressure': np.mean(accuracies['pressure']) if accuracies['pressure'] else 0,
            'overall': np.mean(accuracies['overall']) if accuracies['overall'] else 0
        }
    
    return summary

def plot_accuracy_comparison(accuracy_summary, output_dir):
    """Vẽ biểu đồ so sánh độ chính xác của các mô hình"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Chuyển đổi dữ liệu để vẽ biểu đồ
    models = list(accuracy_summary.keys())
    features = ['temperature', 'humidity', 'wind_speed', 'pressure', 'overall']
    
    # Tạo biểu đồ cột cho từng đặc trưng
    plt.figure(figsize=(14, 8))
    x = np.arange(len(features))
    width = 0.8 / len(models)
    
    for i, model in enumerate(models):
        accuracies = [accuracy_summary[model][feature] for feature in features]
        offset = width * i - width * (len(models) - 1) / 2
        plt.bar(x + offset, accuracies, width, label=model)
    
    plt.xlabel('Đặc trưng thời tiết', fontsize=14)
    plt.ylabel('Độ chính xác (%)', fontsize=14)
    plt.title('So sánh độ chính xác dự báo giữa các mô hình', fontsize=16)
    plt.xticks(x, features)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.legend()
    plt.tight_layout()
    
    # Lưu biểu đồ
    plt.savefig(os.path.join(output_dir, 'accuracy_comparison.png'), dpi=300)
    plt.close()
    
    # Biểu đồ radar để so sánh các mô hình
    plt.figure(figsize=(10, 10))
    
    # Số đặc trưng (không tính overall)
    features_radar = features[:-1]
    num_features = len(features_radar)
    
    # Tạo các góc cho biểu đồ radar
    angles = np.linspace(0, 2*np.pi, num_features, endpoint=False).tolist()
    angles += angles[:1]  # Đóng vòng tròn
    
    # Vẽ biểu đồ radar
    ax = plt.subplot(111, polar=True)
    
    for model in models:
        values = [accuracy_summary[model][feature] for feature in features_radar]
        values += values[:1]  # Đóng vòng tròn
        
        ax.plot(angles, values, linewidth=2, label=model)
        ax.fill(angles, values, alpha=0.1)
    
    # Thêm nhãn
    ax.set_thetagrids(np.degrees(angles[:-1]), features_radar)
    ax.set_title('So sánh độ chính xác dự báo theo đặc trưng', fontsize=15)
    ax.grid(True)
    plt.legend(loc='upper right')
    
    plt.savefig(os.path.join(output_dir, 'accuracy_radar.png'), dpi=300)
    plt.close()
    
    # Tạo biểu đồ so sánh overall accuracy
    plt.figure(figsize=(10, 6))
    models_list = list(accuracy_summary.keys())
    overall_accuracies = [accuracy_summary[model]['overall'] for model in models_list]
    
    colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'][:len(models_list)]
    
    plt.bar(models_list, overall_accuracies, color=colors)
    plt.xlabel('Mô hình', fontsize=14)
    plt.ylabel('Độ chính xác tổng thể (%)', fontsize=14)
    plt.title('So sánh độ chính xác tổng thể giữa các mô hình', fontsize=16)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Thêm giá trị lên đỉnh các cột
    for i, v in enumerate(overall_accuracies):
        plt.text(i, v + 1, f'{v:.2f}%', ha='center', fontweight='bold')
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'overall_accuracy.png'), dpi=300)
    plt.close()
    
    return os.path.join(output_dir, 'accuracy_comparison.png')

def generate_html_report(forecasts, comparison_results, accuracy_summary, output_dir):
    """Tạo báo cáo HTML về kết quả so sánh dự báo"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Mô hình tốt nhất dựa trên độ chính xác tổng thể
    best_model = max(accuracy_summary.items(), key=lambda x: x[1]['overall'])[0]
    
    # Tạo bảng so sánh độ chính xác
    accuracy_table = """
    <table class="table table-striped table-hover">
        <thead>
            <tr>
                <th>Mô hình</th>
                <th>Nhiệt độ</th>
                <th>Độ ẩm</th>
                <th>Tốc độ gió</th>
                <th>Áp suất</th>
                <th>Trung bình</th>
            </tr>
        </thead>
        <tbody>
    """
    
    for model, acc in accuracy_summary.items():
        accuracy_table += f"""
            <tr>
                <td>{model}</td>
                <td>{acc['temperature']:.2f}%</td>
                <td>{acc['humidity']:.2f}%</td>
                <td>{acc['wind_speed']:.2f}%</td>
                <td>{acc['pressure']:.2f}%</td>
                <td><strong>{acc['overall']:.2f}%</strong></td>
            </tr>
        """
    
    accuracy_table += """
        </tbody>
    </table>
    """
    
    # Tạo biểu đồ so sánh độ chính xác
    plot_accuracy_comparison(accuracy_summary, output_dir)
    
    # Tạo nội dung HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Báo cáo so sánh dự báo thời tiết</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body {{ padding: 20px; }}
            .section {{ margin-bottom: 30px; }}
            .chart-container {{ margin-bottom: 30px; }}
            pre {{ background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }}
            .highlight {{ background-color: #d4edda; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="section">
                <h1 class="text-center mb-4">Báo cáo so sánh dự báo thời tiết</h1>
                <p class="text-secondary">Báo cáo được tạo lúc: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="section">
                <h2>Kết quả so sánh độ chính xác</h2>
                <div class="alert alert-success">
                    <strong>Mô hình tốt nhất:</strong> {best_model} với độ chính xác tổng thể {accuracy_summary[best_model]['overall']:.2f}%
                </div>
                
                <h3>Độ chính xác theo đặc trưng</h3>
                {accuracy_table}
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="chart-container">
                            <img src="accuracy_comparison.png" class="img-fluid" alt="So sánh độ chính xác">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="chart-container">
                            <img src="accuracy_radar.png" class="img-fluid" alt="So sánh độ chính xác theo radar">
                        </div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <img src="overall_accuracy.png" class="img-fluid" alt="So sánh độ chính xác tổng thể">
                </div>
            </div>
            
            <div class="section">
                <h2>Chi tiết so sánh dự báo</h2>
                <p>Dưới đây là chi tiết so sánh giữa dự báo và dữ liệu thực tế:</p>
                <pre>{json.dumps(comparison_results, indent=4)}</pre>
            </div>
            
            <footer class="text-center text-muted mt-5">
                <p>&copy; {datetime.now().year} Weather Alert System - Forecast Comparison Report</p>
            </footer>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
    """
    
    # Lưu file HTML
    report_path = os.path.join(output_dir, 'forecast_comparison_report.html')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return report_path

def main():
    import requests
    args = parse_args()
    
    print("Bắt đầu so sánh các mô hình dự báo thời tiết...")
    
    # Chuẩn bị các mô hình
    models = prepare_models()
    if models is None:
        return
    
    # Tạo dự báo từ các mô hình
    print(f"Đang tạo dự báo cho vị trí {args.location} với {args.hours} giờ...")
    forecasts = generate_forecasts(models, args.api_key, args.location, args.hours)
    
    if not forecasts:
        print("Không thể tạo dự báo từ bất kỳ mô hình nào.")
        return
    
    # So sánh với dữ liệu thực tế
    print("Đang so sánh dự báo với dữ liệu thực tế...")
    comparison_results = compare_with_real_data(forecasts, args.api_key, args.location)
    
    if not comparison_results:
        print("Không có dữ liệu để so sánh.")
        return
    
    # Tính toán độ chính xác
    print("Đang tính toán độ chính xác...")
    accuracy_summary = calculate_accuracy(comparison_results)
    
    # Hiển thị kết quả
    print("\n=== Kết quả độ chính xác dự báo ===")
    for model, accuracies in accuracy_summary.items():
        print(f"\nMô hình: {model}")
        print(f"  Nhiệt độ: {accuracies['temperature']:.2f}%")
        print(f"  Độ ẩm: {accuracies['humidity']:.2f}%")
        print(f"  Tốc độ gió: {accuracies['wind_speed']:.2f}%")
        print(f"  Áp suất: {accuracies['pressure']:.2f}%")
        print(f"  Trung bình: {accuracies['overall']:.2f}%")
    
    # Tìm mô hình tốt nhất
    best_model = max(accuracy_summary.items(), key=lambda x: x[1]['overall'])[0]
    print(f"\nMô hình tốt nhất: {best_model} với độ chính xác {accuracy_summary[best_model]['overall']:.2f}%")
    
    # Tạo báo cáo HTML
    print("\nĐang tạo báo cáo HTML...")
    report_path = generate_html_report(forecasts, comparison_results, accuracy_summary, args.output)
    
    print(f"Đã tạo báo cáo tại: {report_path}")
    print("So sánh hoàn tất!")

if __name__ == "__main__":
    main()
