from flask import Flask, request, jsonify
import joblib
import pandas as pd
import os
from weather_prediction import WeatherPredictionService  # Import từ mã hiện có

app = Flask(__name__)
model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'weather_models.joblib')
prediction_service = WeatherPredictionService(model_path)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    api_key = data.get("api_key")
    location = data.get("location")
    hours = data.get("hours", 24)
    result = prediction_service.predict(api_key, location, hours)
    return jsonify(result)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)  # Đổi port nếu cần
