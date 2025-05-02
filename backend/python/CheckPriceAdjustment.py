from flask import Flask, jsonify, request
import Check_Flight
from flask_cors import CORS
import traceback
import sys

app = Flask(__name__)
CORS(app)

@app.route('/adjust_prices', methods=['POST'])
def adjust_prices():
    """API endpoint để kích hoạt quá trình điều chỉnh giá vé"""
    try:
        # Thêm option để tăng chi tiết debug
        debug = request.args.get('debug', 'false').lower() == 'true'
        if debug:
            print("Running in DEBUG mode")
        
        results = Check_Flight.check_affected_flights()
        
        # Phân tích kết quả
        affected_flights = [r for r in results if "price_info" in r]
        delayed_flights = [r for r in results if "delay_info" in r]
        error_flights = [r for r in results if "error" in r]
        
        response = {
            'success': True,
            'message': f'Đã xử lý {len(results)} chuyến bay',
            'affected_flights': len(affected_flights),
            'delayed_flights': len(delayed_flights),
            'error_flights': len(error_flights),
            'details': results
        }
        
        # Thêm thông tin chi tiết về các lỗi nếu có
        if error_flights:
            response['errors'] = [r.get('error') for r in error_flights]
        
        return jsonify(response)
        
    except Exception as e:
        print("Exception in adjust_prices:", str(e))
        traceback.print_exc(file=sys.stdout)
        return jsonify({
            'success': False, 
            'error': str(e),
            'stacktrace': traceback.format_exc()
        }), 500

@app.route('/test_flight', methods=['POST'])
def test_flight():
    """Test endpoint để kiểm tra một chuyến bay cụ thể"""
    try:
        data = request.json
        flight_number = data.get('flight_number')
        
        # Lấy chuyến bay từ database
        flight = Check_Flight.flights_col.find_one({"Number_Flight": flight_number})
        
        if not flight:
            return jsonify({
                'success': False,
                'message': f'Không tìm thấy chuyến bay {flight_number}'
            }), 404
        
        # Xử lý chuyến bay
        result = Check_Flight.process_flight(flight)
        
        return jsonify({
            'success': True,
            'flight': {
                'number': flight.get('Number_Flight'),
                'from': flight.get('From'),
                'to': flight.get('To'),
                'departure': flight.get('Time_depart'),
                'initial_price': flight.get('Initial_price'),
                'current_price': flight.get('Current_price')
            },
            'result': result
        })
        
    except Exception as e:
        print("Exception in test_flight:", str(e))
        traceback.print_exc(file=sys.stdout)
        return jsonify({
            'success': False, 
            'error': str(e),
            'stacktrace': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
