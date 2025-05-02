import os
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import argparse

current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(project_root)
from backend.ml.config.matplotlib_config import *

def parse_args():
    parser = argparse.ArgumentParser(description='Tạo báo cáo từ kết quả đánh giá mô hình')
    
    parser.add_argument(
        '--input', 
        type=str,
        default=os.path.join(project_root, 'backend', 'ml', 'evaluation', 'results', 'model_comparison.csv'),
        help='Đường dẫn đến file kết quả so sánh mô hình'
    )
    
    parser.add_argument(
        '--output', 
        type=str,
        default=os.path.join(project_root, 'backend', 'ml', 'evaluation', 'reports'),
        help='Thư mục lưu báo cáo'
    )
    
    parser.add_argument(
        '--best-models',
        type=str,
        default=os.path.join(project_root, 'backend', 'ml', 'evaluation', 'results', 'best_models.txt'),
        help='Đường dẫn đến file thông tin mô hình tốt nhất'
    )
    
    return parser.parse_args()

def generate_model_comparison_charts(df, output_dir):
    """Tạo biểu đồ so sánh các mô hình dựa trên các metrics"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Danh sách các metrics cần vẽ biểu đồ
    metrics = ['RMSE', 'R2', 'MAE']
    
    # Danh sách các target cần phân tích
    targets = df['Target'].unique()
    
    # Vẽ biểu đồ so sánh cho từng metric
    for metric in metrics:
        plt.figure(figsize=(14, 8))
        
        # Tạo DataFrame pivot để vẽ biểu đồ
        pivot_df = df.pivot(index='Target', columns='Model', values=metric)
        
        # Vẽ biểu đồ cột cho từng metric
        ax = pivot_df.plot(kind='bar', figsize=(14, 8))
        plt.title(f'So sánh {metric} giữa các mô hình', fontsize=16)
        plt.xlabel('Đặc trưng dự báo', fontsize=14)
        plt.ylabel(metric, fontsize=14)
        plt.xticks(rotation=45, ha='right')
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        plt.tight_layout()
        
        # Thêm giá trị lên đỉnh các cột
        for container in ax.containers:
            ax.bar_label(container, fmt='%.2f', fontsize=8)
        
        # Lưu biểu đồ
        plt.savefig(os.path.join(output_dir, f'{metric}_comparison.png'), dpi=300)
        plt.close()
    
    # Vẽ heatmap so sánh các mô hình theo RMSE
    plt.figure(figsize=(12, 10))
    pivot_df = df.pivot(index='Target', columns='Model', values='RMSE')
    sns.heatmap(pivot_df, annot=True, fmt='.2f', cmap='coolwarm', linewidths=0.5)
    plt.title('So sánh RMSE giữa các mô hình', fontsize=16)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'rmse_heatmap.png'), dpi=300)
    plt.close()
    
    # Vẽ biểu đồ radar cho mỗi target để so sánh các mô hình
    for target in targets:
        target_df = df[df['Target'] == target]
        
        # Tạo biểu đồ radar
        labels = metrics
        num_models = len(target_df)
        
        angles = np.linspace(0, 2*np.pi, len(labels), endpoint=False).tolist()
        angles += angles[:1]  # Đóng vòng tròn
        
        fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))
        
        for i, row in target_df.iterrows():
            model = row['Model']
            values = [row[metric] for metric in metrics]
            values += values[:1]  # Đóng vòng tròn
            
            ax.plot(angles, values, linewidth=2, label=model)
            ax.fill(angles, values, alpha=0.1)
        
        ax.set_thetagrids(np.degrees(angles[:-1]), labels)
        ax.set_title(f'So sánh các mô hình cho {target}', fontsize=15)
        ax.grid(True)
        plt.legend(loc='upper right')
        
        plt.savefig(os.path.join(output_dir, f'{target}_radar.png'), dpi=300)
        plt.close()
    
    # Vẽ biểu đồ phân phối RMSE cho các mô hình
    plt.figure(figsize=(12, 6))
    sns.boxplot(x='Model', y='RMSE', data=df)
    plt.title('Phân phối RMSE theo mô hình', fontsize=16)
    plt.xlabel('Mô hình', fontsize=14)
    plt.ylabel('RMSE', fontsize=14)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'rmse_distribution.png'), dpi=300)
    plt.close()
    
    return output_dir

def generate_model_statistics(df):
    """Tạo các thống kê về hiệu suất của các mô hình"""
    # Thống kê theo mô hình
    model_stats = df.groupby('Model').agg({
        'RMSE': ['mean', 'std', 'min', 'max'],
        'R2': ['mean', 'std', 'min', 'max'],
        'MAE': ['mean', 'std', 'min', 'max']
    })
    
    # Tính số lần mỗi mô hình là tốt nhất (dựa trên RMSE thấp nhất)
    best_model_counts = {}
    for target in df['Target'].unique():
        target_df = df[df['Target'] == target]
        best_model = target_df.loc[target_df['RMSE'].idxmin()]['Model']
        if best_model in best_model_counts:
            best_model_counts[best_model] += 1
        else:
            best_model_counts[best_model] = 1
    
    best_model_df = pd.DataFrame({
        'Model': list(best_model_counts.keys()),
        'Best_Count': list(best_model_counts.values())
    })
    
    # Tính phần trăm
    total_targets = len(df['Target'].unique())
    best_model_df['Percentage'] = best_model_df['Best_Count'] / total_targets * 100
    
    return model_stats, best_model_df

def generate_html_report(df, model_stats, best_model_df, charts_dir, best_models_file, output_dir):
    """Tạo báo cáo HTML kết hợp với biểu đồ"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Đọc thông tin mô hình tốt nhất
    best_models_content = ""
    if os.path.exists(best_models_file):
        with open(best_models_file, 'r', encoding='utf-8') as f:
            best_models_content = f.read()
    
    # Tạo biểu đồ tròn thể hiện tỷ lệ mỗi mô hình là tốt nhất
    plt.figure(figsize=(10, 7))
    plt.pie(best_model_df['Best_Count'], labels=best_model_df['Model'], autopct='%1.1f%%', 
            shadow=True, startangle=90)
    plt.axis('equal')
    plt.title('Tỷ lệ mỗi mô hình là tốt nhất cho các đặc trưng thời tiết', fontsize=15)
    pie_chart_path = os.path.join(charts_dir, 'best_model_pie_chart.png')
    plt.savefig(pie_chart_path, dpi=300)
    plt.close()
    
    # Chuyển các DataFrame thành HTML
    comparison_table = df.to_html(classes='table table-striped table-hover', index=False)
    model_stats_table = model_stats.to_html(classes='table table-striped table-hover')
    best_model_table = best_model_df.to_html(classes='table table-striped table-hover', index=False)
    
    # Thu thập các đường dẫn của biểu đồ (tương đối)
    charts_relative_dir = os.path.relpath(charts_dir, output_dir)
    charts = {
        'rmse': os.path.join(charts_relative_dir, 'RMSE_comparison.png'),
        'r2': os.path.join(charts_relative_dir, 'R2_comparison.png'),
        'mae': os.path.join(charts_relative_dir, 'MAE_comparison.png'),
        'heatmap': os.path.join(charts_relative_dir, 'rmse_heatmap.png'),
        'distribution': os.path.join(charts_relative_dir, 'rmse_distribution.png'),
        'pie_chart': os.path.join(charts_relative_dir, 'best_model_pie_chart.png')
    }
    
    # Tạo HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Báo cáo so sánh các mô hình dự báo thời tiết</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body {{ padding: 20px; }}
            .section {{ margin-bottom: 30px; }}
            .chart-container {{ margin-bottom: 30px; }}
            pre {{ background-color: #f8f9fa; padding: 15px; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="section">
                <h1 class="text-center mb-4">Báo cáo so sánh các mô hình dự báo thời tiết</h1>
                <p class="text-secondary">Báo cáo được tạo lúc: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="section">
                <h2>Tóm tắt</h2>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Mô hình tốt nhất</h5>
                                <p>Dựa trên số lượng đặc trưng mà mỗi mô hình đạt hiệu suất tốt nhất:</p>
                                <img src="{charts['pie_chart']}" class="img-fluid" alt="Biểu đồ tròn thể hiện tỷ lệ mô hình tốt nhất">
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Thống kê mô hình tốt nhất</h5>
                                {best_model_table}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>Thống kê hiệu suất mô hình</h2>
                {model_stats_table}
            </div>
            
            <div class="section">
                <h2>So sánh RMSE giữa các mô hình</h2>
                <div class="chart-container">
                    <img src="{charts['rmse']}" class="img-fluid" alt="So sánh RMSE">
                </div>
                <div class="chart-container">
                    <img src="{charts['heatmap']}" class="img-fluid" alt="Heat map RMSE">
                </div>
            </div>
            
            <div class="section">
                <h2>So sánh R2 giữa các mô hình</h2>
                <div class="chart-container">
                    <img src="{charts['r2']}" class="img-fluid" alt="So sánh R2">
                </div>
            </div>
            
            <div class="section">
                <h2>So sánh MAE giữa các mô hình</h2>
                <div class="chart-container">
                    <img src="{charts['mae']}" class="img-fluid" alt="So sánh MAE">
                </div>
            </div>
            
            <div class="section">
                <h2>Phân phối RMSE theo mô hình</h2>
                <div class="chart-container">
                    <img src="{charts['distribution']}" class="img-fluid" alt="Phân phối RMSE">
                </div>
            </div>
            
            <div class="section">
                <h2>Danh sách mô hình tốt nhất cho từng đặc trưng</h2>
                <pre>{best_models_content}</pre>
            </div>
            
            <div class="section">
                <h2>Bảng so sánh đầy đủ</h2>
                {comparison_table}
            </div>
            
            <footer class="text-center text-muted mt-5">
                <p>&copy; {datetime.now().year} Weather Alert System - Model Evaluation Report</p>
            </footer>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
    """
    
    # Lưu file HTML
    report_path = os.path.join(output_dir, 'model_comparison_report.html')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return report_path

def main():
    args = parse_args()
    
    print("Bắt đầu tạo báo cáo từ dữ liệu đánh giá mô hình...")
    
    # Đọc dữ liệu so sánh
    comparison_df = pd.read_csv(args.input)
    
    # Tạo thư mục để lưu biểu đồ
    charts_dir = os.path.join(args.output, 'charts')
    os.makedirs(charts_dir, exist_ok=True)
    
    # Tạo biểu đồ so sánh
    print("Đang tạo biểu đồ so sánh...")
    generate_model_comparison_charts(comparison_df, charts_dir)
    
    # Tính toán thống kê
    print("Đang tính toán thống kê về hiệu suất mô hình...")
    model_stats, best_model_df = generate_model_statistics(comparison_df)
    
    # Tạo báo cáo HTML
    print("Đang tạo báo cáo HTML...")
    report_path = generate_html_report(
        comparison_df, 
        model_stats, 
        best_model_df, 
        charts_dir, 
        args.best_models, 
        args.output
    )
    
    print(f"Đã tạo báo cáo tại: {report_path}")

if __name__ == "__main__":
    main()
