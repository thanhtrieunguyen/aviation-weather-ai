# NGHIÊN CỨU VÀ ỨNG DỤNG TRÍ TUỆ NHÂN TẠO TRONG DỰ BÁO VÀ CẢNH BÁO THỜI TIẾT HÀNG KHÔNG CHO CHUYẾN BAY

## Mục lục
- [Giới thiệu](#giới-thiệu)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Hướng dẫn cài đặt & chạy](#hướng-dẫn-cài-đặt--chạy)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Mobile](#mobile)
- [Huấn luyện mô hình AI](#huấn-luyện-mô-hình-ai)
  - [Chuẩn bị dữ liệu](#chuẩn-bị-dữ-liệu)
  - [Huấn luyện từng mô hình riêng lẻ](#huấn-luyện-từng-mô-hình-riêng-lẻ)
  - [Huấn luyện và đánh giá tất cả mô hình](#huấn-luyện-và-đánh-giá-tất-cả-mô-hình)
  - [Tạo báo cáo đánh giá](#tạo-báo-cáo-đánh-giá)
  - [Sử dụng mô hình để dự báo](#sử-dụng-mô-hình-để-dự-báo)
- [Đóng góp](#đóng-góp)
- [Liên hệ](#liên-hệ)
- [License](#license)

---

## Giới thiệu

Đề tài tập trung nghiên cứu và ứng dụng các mô hình trí tuệ nhân tạo (AI) để dự báo và cảnh báo thời tiết hàng không, hỗ trợ các chuyến bay an toàn và hiệu quả hơn. Hệ thống gồm 3 phần chính:
- Backend: Xử lý dữ liệu, AI, cung cấp API.
- Frontend: Giao diện web quản trị, hiển thị dữ liệu.
- Mobile: Ứng dụng di động cho người dùng cuối.

---

## Cấu trúc dự án

```
source_thuctaptotnghiep/
│
├── backend/      # Node.js + Python, API, AI models
├── frontend/     # Web client (React, Vite, TailwindCSS)
└── mobile/       # Ứng dụng di động (React Native)
```

### Chi tiết từng thư mục

- **backend/**:  
  - `server.js`: Khởi động server Node.js.
  - `models/`, `routes/`, `Controller/`: Quản lý dữ liệu, định nghĩa API, xử lý logic.
  - `python/`, `ml/`: Chứa code AI/ML (Python).
  - `migrations/`, `data/`: Quản lý dữ liệu, migration DB.

- **frontend/**:  
  - `src/`, `components/`: Code React, giao diện người dùng.
  - `public/`, `dist/`: Tài nguyên tĩnh, build output.

- **mobile/**:  
  - `App.js`: Điểm khởi đầu ứng dụng.
  - `src/`: Code React Native.
  - `assets/`: Hình ảnh, icon, tài nguyên.

---

## Công nghệ sử dụng

- **Backend**: Node.js, Express, Python, AI/ML (scikit-learn, pandas, numpy, ...), Sequelize, JWT, ...
- **Frontend**: React, Vite, TailwindCSS, Axios, ...
- **Mobile**: React Native, Expo, ...

---

## Hướng dẫn cài đặt & chạy

### Yêu cầu chung

- Node.js >= 14.x
- npm >= 6.x
- Python >= 3.8 (cho backend AI)
- (Mobile) Expo CLI: `npm install -g expo-cli`

---

### 1. Backend

```bash
cd backend
npm install
# Cài đặt các package Python nếu có
pip install -r python/requirements.txt
# Chạy server Node.js
npm start
```
- Server mặc định chạy ở: `http://localhost:3000`

---

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
- Ứng dụng web chạy ở: `http://localhost:5173` (hoặc port do Vite chỉ định)

---

### 3. Mobile

```bash
cd mobile
npm install
expo start
```
- Dùng Expo Go (trên điện thoại) quét QR code để chạy app.

---

## Huấn luyện mô hình AI

Dự án sử dụng 3 loại mô hình Machine Learning để dự báo thời tiết:
- Random Forest
- XGBoost
- LightGBM

Mỗi mô hình được huấn luyện riêng, sau đó được đánh giá và so sánh để tìm ra mô hình tốt nhất cho từng tham số thời tiết.

### Chuẩn bị dữ liệu

1. Tải dataset từ Kaggle:
   - Link dataset: [Vietnam Airport Weather Dataset](https://www.kaggle.com/datasets/trieunth/vietnam-airport-weather-dataset)
   - Tải và lưu file với tên `weather_dataset.csv` trong thư mục `backend/ml/data/`

2. Đảm bảo đã cài đặt đầy đủ các thư viện Python cần thiết:

```bash
pip install scikit-learn pandas numpy matplotlib seaborn xgboost lightgbm joblib tqdm
```

3. Chuẩn bị dữ liệu huấn luyện:

```bash
cd backend/ml/data
python prepare_training_data.py
```

Lệnh này sẽ tạo file `weather_dataset_with_season_terrain.csv` trong thư mục `backend/ml/data/`.

### Huấn luyện từng mô hình riêng lẻ

#### Huấn luyện mô hình Random Forest:

```bash
cd backend/ml/training
python train_rf_model.py
```

- Kết quả: Tạo file `rf_weather_models.joblib` trong `backend/ml/models/`.
- Biểu đồ đánh giá: Lưu trong `backend/ml/evaluation/plots/rf/`.

#### Huấn luyện mô hình XGBoost:

```bash
cd backend/ml/training
python train_xgb_model.py
```

- Kết quả: Tạo file `xgb_weather_models.joblib` trong `backend/ml/models/`.
- Biểu đồ đánh giá: Lưu trong `backend/ml/evaluation/plots/xgb/`.

#### Huấn luyện mô hình LightGBM:

```bash
cd backend/ml/training
python train_lgb_model.py
```

- Kết quả: Tạo file `lgb_weather_models.joblib` trong `backend/ml/models/`.
- Biểu đồ đánh giá: Lưu trong `backend/ml/evaluation/plots/lgb/`.

### Huấn luyện và đánh giá tất cả mô hình

Để huấn luyện và đánh giá tất cả mô hình cùng một lúc:

```bash
cd backend/ml/evaluation
python run_model_evaluation.py --train --api-key YOUR_WEATHER_API_KEY
```

Các tùy chọn:
- `--train`: Huấn luyện lại tất cả các mô hình (nếu không có flag này, sẽ sử dụng mô hình đã huấn luyện)
- `--api-key`: API key cho dịch vụ thời tiết (cần thiết để lấy dữ liệu thời tiết thực tế)
- `--location`: Vị trí dự báo (mặc định: "12.7,108.1")
- `--hours`: Số giờ dự báo (mặc định: 12)
- `--generate-report`: Tạo báo cáo so sánh mô hình
- `--compare-forecasts`: So sánh dự báo từ các mô hình
- `--evaluation-time`: Thời điểm đánh giá (mặc định: thời điểm hiện tại - 1 giờ)

### Tạo báo cáo đánh giá

Để tạo báo cáo đánh giá chi tiết sau khi đã huấn luyện các mô hình:

```bash
cd backend/ml/evaluation
python generate_report.py
```

Báo cáo HTML sẽ được tạo tại `backend/ml/evaluation/reports/model_comparison_report.html`.

### Sử dụng mô hình để dự báo

Sau khi huấn luyện, hệ thống tự động chọn ra mô hình tốt nhất cho từng tham số thời tiết và lưu trong file `best_weather_models.joblib`. Bạn có thể kiểm tra mô hình với:

```bash
cd backend/ml/prediction
python check_model.py
```

Nếu nhận thấy thiếu thành phần hướng gió, chạy:

```bash
cd backend/ml/prediction
python update_best_models.py
```

Để tạo trực quan hóa chi tiết về hiệu suất của một mô hình cụ thể:

```bash
cd backend/ml/evaluation
python visualize_model_performance.py --model rf --target temperature --test-data PATH_TO_TEST_DATA
```

Các tùy chọn:
- `--model`: Loại mô hình (rf, xgb, lgb hoặc best)
- `--target`: Đặc trưng cần phân tích (temperature, humidity, wind_speed,...)
- `--test-data`: Đường dẫn đến dữ liệu kiểm thử
- `--output-dir`: Thư mục lưu biểu đồ

---

## Đóng góp

1. Fork dự án, tạo branch mới cho tính năng/bugfix.
2. Commit code rõ ràng, mô tả chi tiết.
3. Tạo Pull Request để được review.

---

## Thông tin nhóm

- **Nhóm:** 33
- **Số thành viên:** 3

---

### Lưu ý cấu hình địa chỉ IP

Một số file cấu hình hoặc mã nguồn mặc định sử dụng địa chỉ IP `192.168.2.11`. Để hệ thống hoạt động đúng trên máy của bạn, hãy thay thế tất cả các chỗ có `192.168.2.11` bằng địa chỉ IP của máy bạn trong:
- File cấu hình frontend (nếu có)
- File cấu hình mobile (nếu có)
- Các file `.env` hoặc các đoạn mã gọi API

**Cách kiểm tra IP máy:**
- Trên Windows: Mở Command Prompt, gõ `ipconfig` và tìm dòng `IPv4 Address`.
- Trên Mac/Linux: Mở Terminal, gõ `ifconfig` hoặc `ip a`.

Sau khi xác định IP, hãy sửa lại các file cấu hình/mã nguồn cho phù hợp trước khi chạy hệ thống.