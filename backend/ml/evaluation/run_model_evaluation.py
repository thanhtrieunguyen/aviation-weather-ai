import os
import sys
import argparse
from datetime import datetime, timedelta
import subprocess

# Thêm đường dẫn gốc của dự án vào sys.path
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(project_root)

def parse_args():
    parser = argparse.ArgumentParser(description='Chạy đánh giá và so sánh các mô hình dự báo thời tiết')
    
    parser.add_argument(
        '--train', 
        action='store_true',
        help='Huấn luyện lại các mô hình'
    )
    
    parser.add_argument(
        '--location',
        type=str,
        default='12.7,108.1',
        help='Vị trí dự báo (định dạng lat,lon)'
    )
    
    parser.add_argument(
        '--api-key',
        type=str,
        required=True,
        help='API key cho dịch vụ thời tiết'
    )
    
    parser.add_argument(
        '--generate-report',
        action='store_true',
        help='Tạo báo cáo từ kết quả đánh giá'
    )
    
    parser.add_argument(
        '--compare-forecasts',
        action='store_true',
        help='So sánh các mô hình trên dữ liệu dự báo thực tế'
    )
    
    parser.add_argument(
        '--hours',
        type=int,
        default=12,
        help='Số giờ dự báo cho việc so sánh'
    )
    
    parser.add_argument(
        '--evaluation-time',
        type=str,
        default=(datetime.now().replace(minute=0, second=0, microsecond=0) - timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S'),
        help='Thời điểm đánh giá (định dạng YYYY-MM-DD HH:MM:SS)'
    )
    
    return parser.parse_args()

def run_command(command, description):
    print(f"\n{'='*80}\n{description}\n{'='*80}\n")
    try:
        process = subprocess.run(command, check=True, shell=True)
        print(f"\n{description} đã hoàn thành thành công!\n")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\nLỗi: {description} không thành công.\n{e}\n")
        return False

def main():
    args = parse_args()
    
    print(f"\n{'='*80}")
    print("Bắt đầu quá trình đánh giá và so sánh các mô hình dự báo thời tiết")
    print(f"{'='*80}")
    
    # Thư mục chứa mô hình
    models_dir = os.path.join(project_root, 'backend', 'ml', 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    # Huấn luyện mô hình (nếu được yêu cầu)
    if args.train:
        # Huấn luyện và đánh giá RandomForest
        run_command(
            f"python {os.path.join(project_root, 'backend', 'ml', 'training', 'train_rf_model.py')}",
            "Huấn luyện mô hình RandomForest"
        )
        
        # Huấn luyện và đánh giá XGBoost
        run_command(
            f"python {os.path.join(project_root, 'backend', 'ml', 'training', 'train_xgb_model.py')}",
            "Huấn luyện mô hình XGBoost"
        )
        
        # Huấn luyện và đánh giá LightGBM
        run_command(
            f"python {os.path.join(project_root, 'backend', 'ml', 'training', 'train_lgb_model.py')}",
            "Huấn luyện mô hình LightGBM"
        )
        
        # Chạy model_evaluator để so sánh và chọn mô hình tốt nhất
        run_command(
            f"python {os.path.join(project_root, 'backend', 'ml', 'evaluation', 'model_evaluator.py')}",
            "So sánh và chọn mô hình tốt nhất"
        )
    
    # Đánh giá với dữ liệu thực tế
    run_command(
        f"python {os.path.join(project_root, 'backend', 'ml', 'evaluation', 'evaluate_real_data.py')} "
        f"--prediction-time \"{args.evaluation_time}\" "
        f"{'--train' if args.train else ''} "
        f"--full-report",
        f"Đánh giá mô hình với dữ liệu thực tế tại thời điểm {args.evaluation_time}"
    )
    
    # Tạo báo cáo so sánh mô hình
    if args.generate_report:
        run_command(
            f"python {os.path.join(project_root, 'backend', 'ml', 'evaluation', 'generate_report.py')}",
            "Tạo báo cáo đánh giá mô hình"
        )
    
    # So sánh dự báo với dữ liệu thực tế
    if args.compare_forecasts:
        run_command(
            f"python {os.path.join(project_root, 'backend', 'ml', 'prediction', 'compare_forecasts.py')} "
            f"--location {args.location} "
            f"--api-key {args.api_key} "
            f"--hours {args.hours}",
            f"So sánh dự báo từ các mô hình cho vị trí {args.location} với {args.hours} giờ"
        )
    
    print(f"\n{'='*80}")
    print("Quá trình đánh giá và so sánh các mô hình dự báo thời tiết đã hoàn tất!")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    main()
