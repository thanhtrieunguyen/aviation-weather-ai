import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

# Thêm đường dẫn gốc của dự án vào sys.path
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(project_root)

def visualize_model_performance(y_true, y_pred, target_name, model_name, output_dir=None):
    """
    Trực quan hóa hiệu suất mô hình một cách chi tiết hơn
    
    Parameters:
    -----------
    y_true : array-like
        Giá trị thực tế
    y_pred : array-like
        Giá trị dự báo
    target_name : str
        Tên đặc trưng (ví dụ: 'temperature')
    model_name : str
        Tên mô hình (ví dụ: 'RandomForest')
    output_dir : str, optional
        Đường dẫn thư mục để lưu biểu đồ
    """
    if output_dir is None:
        output_dir = os.path.join(project_root, 'backend', 'ml', 'evaluation', 'detailed_plots')
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Tính toán các chỉ số đánh giá
    r2 = r2_score(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    
    # Tạo một hình lớn với nhiều subplot
    fig = plt.figure(figsize=(18, 15))
    
    # 1. Scatter plot với đường hồi quy
    plt.subplot(2, 2, 1)
    sns.regplot(x=y_true, y=y_pred, scatter_kws={'alpha':0.4, 's':10}, line_kws={'color':'red'})
    plt.title(f'Thực tế vs Dự báo cho {target_name}\nR² = {r2:.4f}', fontsize=14)
    plt.xlabel('Giá trị thực tế', fontsize=12)
    plt.ylabel('Giá trị dự báo', fontsize=12)
    
    # Thêm đường 45 độ
    lims = [
        np.min([plt.xlim()[0], plt.ylim()[0]]),
        np.max([plt.xlim()[1], plt.ylim()[1]]),
    ]
    plt.plot(lims, lims, 'k--', alpha=0.5)
    plt.grid(True, linestyle='--', alpha=0.7)
    
    # 2. Biểu đồ chuỗi thời gian (100 mẫu đầu tiên)
    plt.subplot(2, 2, 2)
    sample_size = min(100, len(y_true))
    plt.plot(range(sample_size), y_true[:sample_size], 'o-', label='Thực tế', markersize=3)
    plt.plot(range(sample_size), y_pred[:sample_size], 'o-', label='Dự báo', markersize=3)
    plt.title(f'Dự báo {target_name} - {sample_size} mẫu đầu\nRMSE = {rmse:.4f}', fontsize=14)
    plt.xlabel('Chỉ số mẫu', fontsize=12)
    plt.ylabel(f'Giá trị {target_name}', fontsize=12)
    plt.legend()
    plt.grid(True, linestyle='--', alpha=0.7)
    
    # 3. Phân phối sai số (histogram)
    plt.subplot(2, 2, 3)
    residuals = y_true - y_pred
    sns.histplot(residuals, kde=True)
    plt.axvline(x=0, color='red', linestyle='--')
    plt.title(f'Phân phối sai số cho {target_name}\nMAE = {mae:.4f}', fontsize=14)
    plt.xlabel('Sai số (Thực tế - Dự báo)', fontsize=12)
    plt.ylabel('Tần suất', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.7)
    
    # 4. Residual plot theo giá trị dự báo
    plt.subplot(2, 2, 4)
    plt.scatter(y_pred, residuals, alpha=0.4, s=10)
    plt.axhline(y=0, color='red', linestyle='--')
    
    # Vẽ đường LOESS cho biểu đồ residual
    try:
        from statsmodels.nonparametric.smoothers_lowess import lowess
        sorted_indices = np.argsort(y_pred)
        y_pred_sorted = np.array(y_pred)[sorted_indices]
        residuals_sorted = np.array(residuals)[sorted_indices]
        smoothed = lowess(residuals_sorted, y_pred_sorted, frac=0.2)
        plt.plot(smoothed[:, 0], smoothed[:, 1], 'r-', linewidth=2)
    except:
        pass  # Bỏ qua nếu không có statsmodels

    plt.title(f'Sai số theo giá trị dự báo cho {target_name}', fontsize=14)
    plt.xlabel('Giá trị dự báo', fontsize=12)
    plt.ylabel('Sai số', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.7)
    
    # Thêm chú thích tổng quan
    plt.figtext(0.5, 0.01, 
                f"{model_name} - {target_name} Performance Metrics:\n"
                f"R² = {r2:.4f}, RMSE = {rmse:.4f}, MAE = {mae:.4f}",
                ha='center', fontsize=14, bbox={'facecolor':'lightgray', 'alpha':0.5, 'pad':5})
    
    plt.tight_layout(rect=[0, 0.03, 1, 0.97])
    plt.suptitle(f'Chi tiết hiệu suất mô hình {model_name} cho {target_name}', fontsize=16, y=0.98)
    
    # Lưu biểu đồ
    plt.savefig(os.path.join(output_dir, f'{model_name}_{target_name}_detailed_performance.png'), dpi=300)
    plt.close()
    
    return os.path.join(output_dir, f'{model_name}_{target_name}_detailed_performance.png')


def main():
    """
    Hàm chính để trực quan hóa hiệu suất mô hình từ dữ liệu có sẵn
    """
    import argparse
    import joblib
    
    parser = argparse.ArgumentParser(description='Trực quan hóa hiệu suất mô hình')
    parser.add_argument('--model', type=str, required=True, 
                        choices=['rf', 'xgb', 'lgb', 'best'],
                        help='Loại mô hình (rf, xgb, lgb, best)')
    parser.add_argument('--target', type=str, required=True, 
                        help='Đặc trưng cần phân tích (temperature, humidity, ...)')
    parser.add_argument('--test-data', type=str, required=True,
                        help='Đường dẫn đến dữ liệu kiểm thử')
    parser.add_argument('--output-dir', type=str, default=None,
                        help='Thư mục lưu biểu đồ')
    
    args = parser.parse_args()
    
    # Ánh xạ tên mô hình
    model_mapping = {
        'rf': 'RandomForest',
        'xgb': 'XGBoost',
        'lgb': 'LightGBM',
        'best': 'BestModel'
    }
    
    model_file_mapping = {
        'rf': 'rf_weather_models.joblib',
        'xgb': 'xgb_weather_models.joblib',
        'lgb': 'lgb_weather_models.joblib',
        'best': 'best_weather_models.joblib'
    }
    
    # Đọc dữ liệu kiểm thử
    test_data = pd.read_csv(args.test_data)
    y_true = test_data[args.target]
    
    # Đọc mô hình
    model_path = os.path.join(project_root, 'backend', 'ml', 'models', model_file_mapping[args.model])
    model_data = joblib.load(model_path)
    
    # Chuẩn bị dữ liệu đầu vào
    features = test_data.drop(columns=[args.target])
    if 'feature_list_for_scale' in model_data:
        feature_list = model_data['feature_list_for_scale']
        features_for_scale = [col for col in features.columns if col in feature_list]
        
        # Áp dụng scaler nếu có
        if 'scalers' in model_data:
            scaler = model_data['scalers'][args.target]
            features[features_for_scale] = scaler.transform(features[features_for_scale])
    
    # Dự đoán
    model = model_data['models'][args.target]
    y_pred = model.predict(features)
    
    # Trực quan hóa
    output_path = visualize_model_performance(
        y_true, y_pred, 
        args.target, 
        model_mapping[args.model],
        args.output_dir
    )
    
    print(f"Đã tạo biểu đồ chi tiết hiệu suất tại: {output_path}")

if __name__ == "__main__":
    main()
