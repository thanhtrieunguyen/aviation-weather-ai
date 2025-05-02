import os
import sys
import pandas as pd
from datetime import datetime, timedelta
import argparse

# Thêm đường dẫn gốc của dự án vào sys.path
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(project_root)

from backend.ml.evaluation.model_evaluator import ModelEvaluator
from dotenv import load_dotenv

def parse_args():
    parser = argparse.ArgumentParser(description='Đánh giá mô hình dự báo thời tiết với dữ liệu thực tế')
    
    parser.add_argument(
        '--real-data', 
        type=str,
        default='api',  # Giá trị mặc định là 'api' để sử dụng API thay vì file
        help='Đường dẫn đến file dữ liệu thực tế hoặc "api" để sử dụng API thời tiết'
    )
    
    parser.add_argument(
        '--historical-data', 
        type=str,
        default=os.path.join(project_root, 'backend', 'ml', 'data', 'weather_dataset_with_season_terrain.csv'),
        help='Đường dẫn đến file dữ liệu lịch sử'
    )
    
    parser.add_argument(
        '--prediction-time',
        type=str,
        default='now',  # Giá trị mặc định là 'now' để sử dụng thời điểm hiện tại
        help='Thời điểm cần dự báo (định dạng YYYY-MM-DD HH:MM:SS hoặc "now" cho thời điểm hiện tại)'
    )
    
    parser.add_argument(
        '--train',
        action='store_true',
        help='Huấn luyện lại các mô hình'
    )
    
    parser.add_argument(
        '--full-report',
        action='store_true',
        help='Xuất báo cáo chi tiết'
    )
    
    parser.add_argument(
        '--locations',
        type=str,
        default='',
        help='Danh sách các vị trí cần đánh giá, định dạng "lat1,lon1;lat2,lon2;..."'
    )
    
    return parser.parse_args()

def main():
    # Tải biến môi trường
    load_dotenv()
    
    args = parse_args()
    
    # Xử lý thời điểm dự báo
    if args.prediction_time.lower() == 'now':
        prediction_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    else:
        prediction_time = args.prediction_time
    
    print(f"Bắt đầu đánh giá mô hình dự báo thời tiết với dữ liệu thực tế tại thời điểm {prediction_time}...")
    print("QUAN TRỌNG: Yêu cầu ít nhất 12 giờ dữ liệu lịch sử để tính toán đặc trưng lag và rolling chính xác!")
    print("Lưu ý: Cần ít nhất 12 giờ dữ liệu lịch sử để tính toán đầy đủ các đặc trưng lag và rolling.")
    
    # Kiểm tra API key nếu sử dụng API
    if args.real_data.lower() == 'api':
        weather_api_key = os.getenv('WEATHER_API_KEY')
        if not weather_api_key:
            print("Lỗi: Không tìm thấy WEATHER_API_KEY trong biến môi trường.")
            print("Vui lòng thiết lập biến môi trường WEATHER_API_KEY hoặc cung cấp file dữ liệu thực tế.")
            return
    
    # Khởi tạo evaluator
    evaluator = ModelEvaluator()
    
    # Tải models
    print("Đang tải các model...")
    evaluator.load_models()
    
    if args.train:
        # Đường dẫn đến dữ liệu huấn luyện
        data_path = os.path.join(project_root, 'backend', 'ml', 'data', 'weather_dataset_with_season_terrain.csv')
        
        # Chuẩn bị dữ liệu
        print("Đang chuẩn bị dữ liệu...")
        X, y_dict = evaluator.prepare_data(data_path)
        
        # Huấn luyện các mô hình
        print("Đang huấn luyện các mô hình...")
        evaluator.train_models(X, y_dict)
        
        # So sánh các mô hình
        print("Đang so sánh các mô hình...")
        comparison_results = evaluator.compare_models()
        print("Kết quả so sánh các mô hình:")
        print(comparison_results)
        
        # Xác định và lưu mô hình tốt nhất
        print("Xác định mô hình tốt nhất cho từng target...")
        best_models = evaluator.get_best_models()
        for target, info in best_models.items():
            print(f"{target}: {info['model_name']} (RMSE = {info['rmse']:.4f})")
    
    # Đánh giá với dữ liệu thực tế
    print("Đang đánh giá với dữ liệu thực tế...")
    
    # Nếu có danh sách locations được cung cấp, cần tạo dữ liệu lịch sử cho các vị trí này
    if args.locations:
        locations = args.locations.split(';')
        if locations:
            print(f"Sử dụng {len(locations)} vị trí được cung cấp cho đánh giá")
            # Tạo DataFrame tạm thời để lưu thông tin vị trí
            loc_data = []
            for loc in locations:
                try:
                    lat, lon = map(float, loc.split(','))
                    # Sử dụng 'timestamp' thay vì 'datetime' cho nhất quán
                    loc_data.append({
                        'latitude': lat,
                        'longitude': lon,
                        'timestamp': (datetime.now() - timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S')
                    })
                except Exception as e:
                    print(f"Lỗi khi xử lý vị trí {loc}: {e}")
            
            if loc_data:
                # Tạo file tạm thời chứa thông tin vị trí
                temp_df = pd.DataFrame(loc_data)
                temp_file = os.path.join(project_root, 'backend', 'ml', 'data', 'temp_locations.csv')
                temp_df.to_csv(temp_file, index=False)
                args.historical_data = temp_file
    
    # Kiểm tra file dữ liệu lịch sử
    if not os.path.exists(args.historical_data):
        print(f"Lỗi: File dữ liệu lịch sử không tồn tại: {args.historical_data}")
        return
    
    # Kiểm tra định dạng dữ liệu lịch sử
    try:
        hist_df = pd.read_csv(args.historical_data)
        
        # Kiểm tra số lượng bản ghi lịch sử
        if len(hist_df) < 12:
            print(f"CẢNH BÁO: Dữ liệu lịch sử chỉ có {len(hist_df)} bản ghi.")
            print(f"Cần ít nhất 12 bản ghi để tính toán đầy đủ các đặc trưng lag và rolling.")
            print(f"Dự báo có thể không chính xác do thiếu dữ liệu lịch sử!")
        
        # Kiểm tra xem có cột timestamp hoặc datetime không
        time_col_exists = 'timestamp' in hist_df.columns or 'datetime' in hist_df.columns
        if not time_col_exists:
            # Thử đổi tên một cột thời gian nếu có
            time_cols = [col for col in hist_df.columns if 'time' in col.lower()]
            if time_cols:
                print(f"Đổi tên cột {time_cols[0]} thành 'timestamp'")
                hist_df.rename(columns={time_cols[0]: 'timestamp'}, inplace=True)
                hist_df.to_csv(args.historical_data, index=False)
            else:
                print("Lỗi: Không tìm thấy cột thời gian trong dữ liệu lịch sử.")
                return
        
        # Kiểm tra có cột latitude và longitude không
        if 'latitude' not in hist_df.columns or 'longitude' not in hist_df.columns:
            print("Lỗi: Dữ liệu lịch sử phải có cột 'latitude' và 'longitude'")
            return
    except Exception as e:
        print(f"Lỗi khi đọc file dữ liệu lịch sử: {e}")
        return
    
    # Gọi phương thức đánh giá với tham số phù hợp
    evaluation_result = evaluator.evaluate_on_real_data(
        None if args.real_data.lower() == 'api' else args.real_data,  # Nếu là 'api' thì truyền None
        args.historical_data,
        prediction_time
    )
    
    if evaluation_result is None:
        print("Không thể đánh giá mô hình với dữ liệu thực tế.")
        return
    
    accuracy_report = evaluation_result['accuracy']
    
    # In kết quả
    print("\n=== KẾT QUẢ ĐÁNH GIÁ ĐỘ CHÍNH XÁC ===")
    print(f"Thời điểm đánh giá: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Thời điểm dự báo: {prediction_time}")
    
    print("\nĐộ chính xác trung bình của các mô hình:")
    for model_name, accuracy in accuracy_report['model_accuracy'].items():
        print(f"- {model_name}: {accuracy:.2f}%")
    
    print(f"\nMô hình tốt nhất: {accuracy_report['best_model']} với độ chính xác {accuracy_report['best_accuracy']:.2f}%")
    
    if args.full_report:
        print("\nĐộ chính xác theo từng target:")
        for target, accuracies in accuracy_report['target_accuracy'].items():
            print(f"\n{target}:")
            for model_name, accuracy in accuracies.items():
                print(f"  - {model_name}: {accuracy:.2f}%")
        
        if 'details' in evaluation_result:
            print("\nGiá trị thực tế và dự đoán:")
            details = evaluation_result['details']
            
            for target in details['actual_values']:
                print(f"\n=== {target.upper()} ===")
                
                for location_key, actual_value in details['actual_values'][target].items():
                    print(f"\nVị trí: {location_key}")
                    print(f"Giá trị thực tế: {actual_value}")
                    
                    print("Dự đoán theo mô hình:")
                    for model_name in details['predictions'].get(target, {}):
                        pred_value = details['predictions'][target][model_name].get(location_key, "N/A")
                        print(f"  - {model_name}: {pred_value}")
    
    print("\nĐánh giá hoàn tất! Xem báo cáo chi tiết trong thư mục results.")
    print("Lưu ý: Đánh giá đã được thực hiện bằng cách sử dụng dữ liệu từ 1 giờ trước để dự báo hiện tại")
    
    # Nếu có file tạm thời đã tạo, xóa nó
    temp_file = os.path.join(project_root, 'backend', 'ml', 'data', 'temp_locations.csv')
    if os.path.exists(temp_file) and args.locations:
        try:
            os.remove(temp_file)
        except:
            pass

if __name__ == "__main__":
    main()