import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import os
import sys

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
sys.path.append(project_root)

def analyze_feature_importance():
    """Phân tích tầm quan trọng của các đặc trưng trong mô hình"""
    # Đường dẫn đến model đã huấn luyện
    model_path = os.path.join(project_root, 'backend', 'ml', 'models', 'weather_models.joblib')
    
    # Load model
    data = joblib.load(model_path)
    models = data['models']
    
    # Phân tích tầm quan trọng của đặc trưng cho từng target
    for target, model in models.items():
        feature_importances = model.feature_importances_
        feature_names = data['feature_list_for_scale']
        
        # Tạo DataFrame để dễ dàng phân tích
        importance_df = pd.DataFrame({
            'Feature': feature_names,
            'Importance': feature_importances
        }).sort_values('Importance', ascending=False)
        
        # In ra 20 đặc trưng quan trọng nhất
        print(f"\nTop 20 đặc trưng quan trọng nhất cho {target}:")
        print(importance_df.head(20))
        
        # Lọc các đặc trưng về mùa và địa hình để xem xét riêng
        seasonal_features = importance_df[importance_df['Feature'].str.contains('is_|season_')]
        terrain_features = importance_df[importance_df['Feature'].str.contains('terrain_|elevation')]
        
        print(f"\nTầm quan trọng của đặc trưng mùa cho {target}:")
        print(seasonal_features)
        
        print(f"\nTầm quan trọng của đặc trưng địa hình cho {target}:")
        print(terrain_features)
        
        # Vẽ biểu đồ cho top 20 đặc trưng
        plt.figure(figsize=(12, 8))
        importance_df.head(20).plot(kind='barh', x='Feature', y='Importance')
        plt.title(f'Top 20 Feature Importance for {target}')
        plt.tight_layout()
        
        # Tạo thư mục để lưu biểu đồ nếu chưa tồn tại
        output_dir = os.path.join(project_root, 'backend', 'ml', 'models', 'feature_importance')
        os.makedirs(output_dir, exist_ok=True)
        
        # Lưu biểu đồ
        plt.savefig(os.path.join(output_dir, f'{target}_feature_importance.png'))
        plt.close()
        
if __name__ == "__main__":
    analyze_feature_importance()