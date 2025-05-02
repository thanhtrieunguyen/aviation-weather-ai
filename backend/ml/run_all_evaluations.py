import os
import sys
import argparse
from datetime import datetime
import subprocess

# Thêm đường dẫn gốc của dự án vào sys.path
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, '../..'))
sys.path.append(project_root)

def parse_args():
    parser = argparse.ArgumentParser(description='Chạy toàn bộ quy trình huấn luyện, đánh giá và so sánh các mô hình')
    
    parser.add_argument(
        '--api-key',
        type=str,
        required=True,
        help='API key cho dịch vụ thời tiết'
    )
    
    parser.add_argument(
        '--location',
        type=str,
        default='12.7,108.1',
        help='Vị trí dự báo (định dạng lat,lon)'
    )
    
    parser.add_argument(
        '--skip-training',
        action='store_true',
        help='Bỏ qua bước huấn luyện các mô hình'
    )
    
    parser.add_argument(
        '--benchmark-iterations',
        type=int,
        default=5,
        help='Số lần lặp cho benchmark hiệu suất'
    )
    
    return parser.parse_args()

def run_command(command, description):
    """Chạy lệnh và hiển thị thông báo"""
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
    print("BẮT ĐẦU QUY TRÌNH ĐÁNH GIÁ VÀ SO SÁNH CÁC MÔ HÌNH DỰ BÁO THỜI TIẾT")
    print(f"{'='*80}")
    print(f"Thời gian bắt đầu: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 1. Huấn luyện các mô hình (nếu không skip)
    if not args.skip_training:
        print("\nBước 1: Huấn luyện các mô hình")
        # Huấn luyện RandomForest
        run_command(
            f"python {os.path.join(project_root, 'backend', 'ml', 'training', 'train_rf_model.py')}",
            "1.1. Huấn luyện mô hình RandomForest"
        )
        
        # Huấn luyện XGBoost
        run_command(
            f"python {os.path.join(project_root, 'backend', 'ml', 'training', 'train_xgb_model.py')}",
            "1.2. Huấn luyện mô hình XGBoost"
        )
        
        # Huấn luyện LightGBM
        run_command(
            f"python {os.path.join(project_root, 'backend', 'ml', 'training', 'train_lgb_model.py')}",
            "1.3. Huấn luyện mô hình LightGBM"
        )
    else:
        print("\nĐã bỏ qua bước huấn luyện các mô hình theo yêu cầu")
    
    # 2. Đánh giá và so sánh các mô hình
    print("\nBước 2: Đánh giá và so sánh các mô hình")
    
    # Chạy ModelEvaluator
    run_command(
        f"python {os.path.join(project_root, 'backend', 'ml', 'evaluation', 'model_evaluator.py')}",
        "2.1. Đánh giá và so sánh các mô hình trên tập test"
    )
    
    # 3. Tạo báo cáo so sánh
    print("\nBước 3: Tạo báo cáo so sánh")
    
    # Tạo báo cáo đánh giá
    run_command(
        f"python {os.path.join(project_root, 'backend', 'ml', 'evaluation', 'generate_report.py')}",
        "3.1. Tạo báo cáo so sánh các mô hình"
    )
    
    # 4. Đánh giá với dữ liệu thực tế
    print("\nBước 4: Đánh giá với dữ liệu thực tế")
    
    # Đánh giá dữ liệu thực tế
    run_command(
        f"python {os.path.join(project_root, 'backend', 'ml', 'evaluation', 'evaluate_real_data.py')} --full-report",
        "4.1. Đánh giá các mô hình với dữ liệu thực tế"
    )
    
    # 5. So sánh dự báo và benchmark
    print("\nBước 5: So sánh dự báo và benchmark hiệu suất")
    
    # Chạy so sánh dự báo
    # run_command(
    #     f"python {os.path.join(project_root, 'backend', 'ml', 'prediction', 'compare_forecasts.py')} "
    #     f"--location {args.location} --api-key {args.api_key} --hours 24",
    #     "5.1. So sánh dự báo từ các mô hình"
    # )
    
    # Chạy benchmark hiệu suất
    run_command(
        f"python {os.path.join(project_root, 'backend', 'ml', 'evaluation', 'run_benchmark.py')} "
        f"--location {args.location} --api-key {args.api_key} --iterations {args.benchmark_iterations}",
        "5.2. So sánh hiệu suất các mô hình"
    )
    
    print(f"\n{'='*80}")
    print("QUY TRÌNH ĐÁNH GIÁ VÀ SO SÁNH CÁC MÔ HÌNH ĐÃ HOÀN TẤT!")
    print(f"Thời gian kết thúc: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*80}\n")
    
    print("Các báo cáo được lưu tại:")
    print(f"- Báo cáo so sánh mô hình: {os.path.join(project_root, 'backend', 'ml', 'evaluation', 'reports')}")
    print(f"- Báo cáo dự báo: {os.path.join(project_root, 'backend', 'ml', 'evaluation', 'forecast_comparison')}")
    print(f"- Báo cáo benchmark: {os.path.join(project_root, 'backend', 'ml', 'evaluation', 'benchmark')}")

if __name__ == "__main__":
    main()
