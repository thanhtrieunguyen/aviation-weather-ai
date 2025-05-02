import os
import joblib
import pandas as pd

class FeatureManager:
    AGGREGATED_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../models', 'aggregated_features.pkl'))
    
    @staticmethod
    def save_feature_names(feature_names, target, model_type):
        """Lưu tên các tính năng của mô hình vào file aggregated_features.pkl"""
        # Đọc file đã tồn tại hay tạo dict mới
        if os.path.exists(FeatureManager.AGGREGATED_PATH):
            aggregated = joblib.load(FeatureManager.AGGREGATED_PATH)
        else:
            aggregated = {}
        key = f"{target}_{model_type}"
        aggregated[key] = feature_names
        
        # Tạo thư mục nếu chưa tồn tại
        os.makedirs(os.path.dirname(FeatureManager.AGGREGATED_PATH), exist_ok=True)
        joblib.dump(aggregated, FeatureManager.AGGREGATED_PATH)
        print(f"Lưu feature cho {key} thành công vào {FeatureManager.AGGREGATED_PATH}")

    @staticmethod
    def load_feature_names(target, model_type):
        """Tải tên các tính năng của mô hình từ file aggregated_features.pkl"""
        key = f"{target}_{model_type}"
        if os.path.exists(FeatureManager.AGGREGATED_PATH):
            aggregated = joblib.load(FeatureManager.AGGREGATED_PATH)
            return aggregated.get(key, None)
        return None

    @staticmethod
    def ensure_feature_order(df, target, model_type):
        """Đảm bảo thứ tự và tên tính năng đúng như lúc huấn luyện."""
        feature_names = FeatureManager.load_feature_names(target, model_type)
        if feature_names is None:
            return df
        
        # Tạo DataFrame mới với các cột theo đúng thứ tự của feature_names
        # và chỉ sử dụng các cột có trong df
        common_cols = [col for col in feature_names if col in df.columns]
        
        # Kiểm tra nếu thiếu cột
        missing_cols = [col for col in feature_names if col not in df.columns]
        if missing_cols:
            print(f"Warning: Missing {len(missing_cols)} features for {target} model: {missing_cols[:5]}...")
        
        # Trả về DataFrame với các cột đúng thứ tự
        return df[common_cols]
