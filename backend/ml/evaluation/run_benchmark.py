import os
import sys
import argparse
import pandas as pd
import numpy as np
import time
import matplotlib.pyplot as plt
from datetime import datetime
import requests
import psutil

# Thêm đường dẫn gốc của dự án vào sys.path
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(project_root)

from backend.ml.prediction.weather_prediction import WeatherPredictionService

# Thêm vào đầu tệp
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from backend.ml.config.matplotlib_config import *

def parse_args():
    parser = argparse.ArgumentParser(description='Đo hiệu suất của các mô hình dự báo thời tiết')
    
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
        default=24,
        help='Số giờ cần dự báo'
    )
    
    parser.add_argument(
        '--iterations',
        type=int,
        default=5,
        help='Số lần lặp lại để lấy thời gian trung bình'
    )
    
    parser.add_argument(
        '--output', 
        type=str,
        default=os.path.join(project_root, 'backend', 'ml', 'evaluation', 'benchmark'),
        help='Thư mục lưu kết quả benchmark'
    )
    
    return parser.parse_args()

def prepare_models():
    """Chuẩn bị các mô hình khác nhau để benchmark"""
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

def benchmark_models(models, api_key, location, hours, iterations):
    """Benchmark weather prediction models with improved configuration and error handling"""
    results = {}
    
    # Validate inputs
    if not models:
        print("Error: No models to benchmark")
        return {}
    
    if not api_key:
        print("Error: Missing API key")
        return {}
    
    # Try to validate location format
    try:
        lat, lon = map(float, location.split(','))
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            print(f"Warning: Location coordinates may be invalid: {location}")
    except:
        print(f"Warning: Location format may be invalid: {location}")
    
    # Pre-warm API connection to avoid measuring connection setup time
    try:
        # Make a test request to ensure API is responsive
        test_url = f"http://api.weatherapi.com/v1/current.json?key={api_key}&q={location}&aqi=no"
        response = requests.get(test_url, timeout=5)
        response.raise_for_status()
        print(f"API connection verified: {response.status_code}")
    except Exception as e:
        print(f"Warning: API connection test failed: {e}")
        print("Continuing with benchmarks anyway...")
    
    for name, model_path in models.items():
        print(f"\nBenchmarking model {name}...")
        service = WeatherPredictionService(model_path)
        
        # Measure model load time
        start_time = time.time()
        load_success = service.load_models()
        load_time = time.time() - start_time
        
        if not load_success:
            print(f"Failed to load model {name}, skipping")
            continue
        
        # Measure prediction times
        prediction_times = []
        memory_usage = []
        prediction_success = []
        
        for i in range(iterations):
            # Clear any previous predictions
            if hasattr(service, 'predictions'):
                del service.predictions
            
            # Measure memory before prediction
            process = psutil.Process(os.getpid())
            mem_before = process.memory_info().rss / 1024 / 1024  # MB
            
            # Perform prediction and measure time
            start_time = time.time()
            try:
                prediction_result = service.predict(api_key, location, prediction_hours=hours)
                success = prediction_result is not None and "error" not in prediction_result
                prediction_success.append(success)
            except Exception as e:
                print(f"  Error in iteration {i+1}: {e}")
                prediction_success.append(False)
            
            pred_time = time.time() - start_time
            
            # Measure memory after prediction
            mem_after = process.memory_info().rss / 1024 / 1024  # MB
            memory_increase = mem_after - mem_before
            
            # Sometimes memory can decrease due to garbage collection
            if memory_increase > 0:
                memory_usage.append(memory_increase)
            
            prediction_times.append(pred_time)
            
            # Force garbage collection between iterations
            import gc
            gc.collect()
            
            success_status = "✓" if prediction_success[-1] else "✗"
            print(f"  Run {i+1}: {pred_time:.4f}s, Memory: {memory_increase:.2f}MB {success_status}")
        
        # Calculate statistics
        success_rate = sum(prediction_success) / len(prediction_success) * 100 if prediction_success else 0
        
        if prediction_times:
            avg_prediction_time = sum(prediction_times) / len(prediction_times)
            min_prediction_time = min(prediction_times)
            max_prediction_time = max(prediction_times)
        else:
            avg_prediction_time = min_prediction_time = max_prediction_time = 0
        
        avg_memory = sum(memory_usage) / len(memory_usage) if memory_usage else 0
        
        results[name] = {
            'load_time': load_time,
            'avg_prediction_time': avg_prediction_time,
            'min_prediction_time': min_prediction_time, 
            'max_prediction_time': max_prediction_time,
            'prediction_times': prediction_times,
            'avg_memory_usage': avg_memory,
            'memory_usage': memory_usage,
            'success_rate': success_rate
        }
        
        print(f"  Results for {name}:")
        print(f"    Load time: {load_time:.4f}s")
        print(f"    Prediction time (avg): {avg_prediction_time:.4f}s")
        print(f"    Memory usage (avg): {avg_memory:.2f}MB")
        print(f"    Success rate: {success_rate:.1f}%")
    
    return results

def generate_benchmark_charts(results, output_dir):
    """Tạo biểu đồ so sánh hiệu suất của các mô hình"""
    os.makedirs(output_dir, exist_ok=True)
    
    # So sánh thời gian load model
    plt.figure(figsize=(10, 6))
    model_names = list(results.keys())
    load_times = [results[name]['load_time'] for name in model_names]
    
    plt.bar(model_names, load_times, color='skyblue')
    plt.title('Thời gian load model', fontsize=16)
    plt.xlabel('Mô hình', fontsize=14)
    plt.ylabel('Thời gian (giây)', fontsize=14)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Thêm giá trị lên đỉnh các cột
    for i, v in enumerate(load_times):
        plt.text(i, v + 0.01, f'{v:.4f}s', ha='center')
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'load_time_comparison.png'), dpi=300)
    plt.close()
    
    # So sánh thời gian dự báo trung bình
    plt.figure(figsize=(10, 6))
    avg_times = [results[name]['avg_prediction_time'] for name in model_names]
    
    plt.bar(model_names, avg_times, color='lightgreen')
    plt.title('Thời gian dự báo trung bình', fontsize=16)
    plt.xlabel('Mô hình', fontsize=14)
    plt.ylabel('Thời gian (giây)', fontsize=14)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Thêm giá trị lên đỉnh các cột
    for i, v in enumerate(avg_times):
        plt.text(i, v + 0.01, f'{v:.4f}s', ha='center')
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'prediction_time_comparison.png'), dpi=300)
    plt.close()
    
    # So sánh thời gian dự báo bằng box plot
    plt.figure(figsize=(12, 6))
    data = [results[name]['prediction_times'] for name in model_names]
    
    plt.boxplot(data, labels=model_names)
    plt.title('Phân phối thời gian dự báo', fontsize=16)
    plt.xlabel('Mô hình', fontsize=14)
    plt.ylabel('Thời gian (giây)', fontsize=14)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'prediction_time_distribution.png'), dpi=300)
    plt.close()
    
    # So sánh bộ nhớ sử dụng
    plt.figure(figsize=(10, 6))
    memory_usage = [results[name]['avg_memory_usage'] for name in model_names]
    
    plt.bar(model_names, memory_usage, color='salmon')
    plt.title('Bộ nhớ sử dụng trung bình', fontsize=16)
    plt.xlabel('Mô hình', fontsize=14)
    plt.ylabel('Bộ nhớ (MB)', fontsize=14)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Thêm giá trị lên đỉnh các cột
    for i, v in enumerate(memory_usage):
        plt.text(i, v + 0.5, f'{v:.2f}MB', ha='center')
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'memory_usage_comparison.png'), dpi=300)
    plt.close()
    
    return output_dir

def generate_benchmark_report(results, charts_dir, output_dir):
    """Tạo báo cáo HTML về kết quả benchmark"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Tạo DataFrame tổng hợp kết quả
    summary_data = []
    for name, data in results.items():
        summary_data.append({
            'Model': name,
            'Load Time (s)': data['load_time'],
            'Avg Prediction Time (s)': data['avg_prediction_time'],
            'Min Prediction Time (s)': data['min_prediction_time'],
            'Max Prediction Time (s)': data['max_prediction_time'],
            'Memory Usage (MB)': data['avg_memory_usage']
        })
    
    summary_df = pd.DataFrame(summary_data)
    
    # Tìm mô hình nhanh nhất
    fastest_model = summary_df.loc[summary_df['Avg Prediction Time (s)'].idxmin()]['Model']
    
    # Tìm mô hình ít tốn bộ nhớ nhất
    most_memory_efficient = summary_df.loc[summary_df['Memory Usage (MB)'].idxmin()]['Model']
    
    # Tìm mô hình tốt nhất tổng thể (dựa trên cả thời gian và bộ nhớ, với trọng số 70% thời gian và 30% bộ nhớ)
    # Đầu tiên chuẩn hóa các giá trị
    normalized_time = summary_df['Avg Prediction Time (s)'] / summary_df['Avg Prediction Time (s)'].max()
    normalized_memory = summary_df['Memory Usage (MB)'] / summary_df['Memory Usage (MB)'].max()
    
    # Tính điểm tổng hợp (thấp hơn là tốt hơn)
    summary_df['Overall Score'] = normalized_time * 0.7 + normalized_memory * 0.3
    
    # Tìm mô hình có điểm tốt nhất
    best_overall = summary_df.loc[summary_df['Overall Score'].idxmin()]['Model']
    
    # Chuyển DataFrame thành HTML
    summary_table = summary_df.to_html(classes='table table-striped table-hover', index=False)
    
    # Tạo nội dung HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Báo cáo Benchmark Mô hình Dự báo Thời tiết</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body {{ padding: 20px; }}
            .section {{ margin-bottom: 30px; }}
            .chart-container {{ margin-bottom: 30px; }}
            .highlight {{ background-color: #d4edda; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="section">
                <h1 class="text-center mb-4">Báo cáo Benchmark Mô hình Dự báo Thời tiết</h1>
                <p class="text-secondary">Báo cáo được tạo lúc: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="section">
                <h2>Kết quả tổng quan</h2>
                <div class="row">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Mô hình nhanh nhất</h5>
                                <p class="card-text">{fastest_model}</p>
                                <p class="card-text"><small class="text-muted">Thời gian dự báo trung bình: {summary_df[summary_df['Model'] == fastest_model]['Avg Prediction Time (s)'].values[0]:.4f}s</small></p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Mô hình ít tốn bộ nhớ nhất</h5>
                                <p class="card-text">{most_memory_efficient}</p>
                                <p class="card-text"><small class="text-muted">Bộ nhớ sử dụng: {summary_df[summary_df['Model'] == most_memory_efficient]['Memory Usage (MB)'].values[0]:.2f}MB</small></p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Mô hình tốt nhất tổng thể</h5>
                                <p class="card-text">{best_overall}</p>
                                <p class="card-text"><small class="text-muted">Cân bằng giữa thời gian và bộ nhớ</small></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Chi tiết hiệu suất</h2>
                {summary_table}
            </div>
            
            <div class="section">
                <h2>Thời gian load model</h2>
                <div class="chart-container">
                    <img src="load_time_comparison.png" class="img-fluid" alt="Thời gian load model">
                </div>
            </div>
            
            <div class="section">
                <h2>Thời gian dự báo</h2>
                <div class="chart-container">
                    <img src="prediction_time_comparison.png" class="img-fluid" alt="Thời gian dự báo trung bình">
                </div>
                <div class="chart-container">
                    <img src="prediction_time_distribution.png" class="img-fluid" alt="Phân phối thời gian dự báo">
                </div>
            </div>
            
            <div class="section">
                <h2>Sử dụng bộ nhớ</h2>
                <div class="chart-container">
                    <img src="memory_usage_comparison.png" class="img-fluid" alt="Bộ nhớ sử dụng">
                </div>
            </div>
            
            <footer class="text-center text-muted mt-5">
                <p>&copy; {datetime.now().year} Weather Alert System - Model Benchmark Report</p>
            </footer>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
    """
    
    # Lưu file HTML
    report_path = os.path.join(output_dir, 'benchmark_report.html')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return report_path

def main():
    args = parse_args()
    
    print("Bắt đầu benchmark các mô hình dự báo thời tiết...")
    
    # Chuẩn bị các mô hình
    models = prepare_models()
    if models is None:
        return
    
    # Thực hiện benchmark
    print(f"Đang chạy benchmark cho vị trí {args.location} với {args.hours} giờ x {args.iterations} lần lặp...")
    benchmark_results = benchmark_models(models, args.api_key, args.location, args.hours, args.iterations)
    
    # Tạo thư mục đầu ra
    os.makedirs(args.output, exist_ok=True)
    
    # Tạo biểu đồ
    print("Đang tạo biểu đồ...")
    charts_dir = generate_benchmark_charts(benchmark_results, args.output)
    
    # Tạo báo cáo
    print("Đang tạo báo cáo...")
    report_path = generate_benchmark_report(benchmark_results, charts_dir, args.output)
    
    print(f"Benchmark hoàn tất! Báo cáo được lưu tại: {report_path}")

if __name__ == "__main__":
    main()
