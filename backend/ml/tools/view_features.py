import os
import sys
import joblib
import pandas as pd
from datetime import datetime

# Add project root to sys.path
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, '../../..'))
sys.path.append(project_root)

from backend.ml.config.feature_config import FeatureManager

def export_aggregated_features():
    """Export features stored in aggregated_features.pkl file to a text file"""
    # Check if the file exists
    if not os.path.exists(FeatureManager.AGGREGATED_PATH):
        print(f"File not found: {FeatureManager.AGGREGATED_PATH}")
        return
    
    # Load the aggregated features
    aggregated = joblib.load(FeatureManager.AGGREGATED_PATH)
    
    # Create a timestamp for the output file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(project_root, f'aggregated_features_{timestamp}.txt')
    
    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"Features exported from: {FeatureManager.AGGREGATED_PATH}\n")
        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total model-target combinations: {len(aggregated)}\n\n")
        
        # Group by model type
        model_types = {}
        for key in aggregated:
            parts = key.split('_')
            target = parts[0]
            model_type = '_'.join(parts[1:])
            
            if model_type not in model_types:
                model_types[model_type] = []
            model_types[model_type].append(target)
        
        # Write summary
        f.write("SUMMARY OF MODELS AND TARGETS:\n")
        f.write("=============================\n\n")
        for model, targets in model_types.items():
            f.write(f"{model} - {len(targets)} targets:\n")
            for target in sorted(targets):
                f.write(f"  - {target}\n")
            f.write("\n")
        
        # Write detailed feature lists
        f.write("\nDETAILED FEATURE LISTS:\n")
        f.write("======================\n\n")
        for key, features in aggregated.items():
            f.write(f"Key: {key}\n")
            f.write(f"Number of features: {len(features)}\n")
            f.write("Features:\n")
            for feature in features:
                f.write(f"  - {feature}\n")
            f.write("\n" + "-"*50 + "\n\n")
    
    print(f"Features exported to: {output_file}")
    return output_file

if __name__ == "__main__":
    export_aggregated_features()