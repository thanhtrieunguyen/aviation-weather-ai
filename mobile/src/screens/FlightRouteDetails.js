import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

export default function FlightRouteDetails({ route }) {
  const flight = route.params?.flight || {}; // Lấy dữ liệu chuyến bay
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState(null);
  const [coordinates, setCoordinates] = useState([]);
  const [airports, setAirports] = useState({});
  const [loading, setLoading] = useState(true);

  // Add a formatCurrency function
  const formatCurrency = (amount) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Add a UTC date formatter function
  const formatUTCDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    
    const date = new Date(dateTime);
    
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  // Function to get airport coordinates based on IATA code
  const getAirportCoordinates = async () => {
    try {
      setLoading(true);
      // Define coordinates for Vietnamese airports
      const airportCoordinates = {
        'HAN': { latitude: 21.2187149, longitude: 105.8019822, name: 'Sân bay Quốc tế Nội Bài' },
        'SGN': { latitude: 10.8184045, longitude: 106.6639473, name: 'Sân bay Quốc tế Tân Sơn Nhất' },
        'DND': { latitude: 16.0544, longitude: 108.1990, name: 'Sân bay Quốc tế Đà Nẵng' },
        'HPH': { latitude: 20.8194, longitude: 106.7249, name: 'Sân bay Quốc tế Cát Bi' },
        'CMH': { latitude: 9.1769, longitude: 105.1829, name: 'Sân bay Cà Mau' },
        'DLI': { latitude: 11.7500, longitude: 108.3700, name: 'Sân bay Liên Khương' },
        'CXR': { latitude: 11.9982, longitude: 109.2195, name: 'Sân bay Cam Ranh' },
        'PQC': { latitude: 10.1698, longitude: 103.9931, name: 'Sân bay Phú Quốc' },
        'HUE': { latitude: 16.4015, longitude: 107.7024, name: 'Sân bay Phú Bài' },
        'VCS': { latitude: 8.7326, longitude: 106.6330, name: 'Sân bay Côn Đảo' },
        'BMV': { latitude: 12.6699, longitude: 108.0851, name: 'Sân bay Buôn Ma Thuột' },
        'VCL': { latitude: 15.4057, longitude: 108.7086, name: 'Sân bay Quốc tế Chu Lai' },
        'DIN': { latitude: 21.3970, longitude: 103.0078, name: 'Sân bay Điện Biên Phủ' },
        'VDH': { latitude: 17.5151, longitude: 106.5908, name: 'Sân bay Đồng Hới' },
        'UIH': { latitude: 13.9549, longitude: 109.0424, name: 'Sân bay Phú Cát' },
        'PXU': { latitude: 14.0045, longitude: 108.0171, name: 'Sân bay Pleiku' },
        'THD': { latitude: 19.9017, longitude: 105.4683, name: 'Sân bay Thọ Xuân' },
        'VDO': { latitude: 21.1172, longitude: 107.4151, name: 'Sân bay Quốc tế Vân Đồn' },
        'VII': { latitude: 18.7376, longitude: 105.6708, name: 'Sân bay Vinh' },
        'VTG': { latitude: 10.3262, longitude: 107.0991, name: 'Sân bay Vũng Tàu' },
      };
      
      const from = flight.From;
      const to = flight.To;
      const transit = flight.Transit;
      
      let routeCoordinates = [];
      let airportsData = {};
      
      if (from && airportCoordinates[from]) {
        routeCoordinates.push(airportCoordinates[from]);
        airportsData[from] = airportCoordinates[from];
      }
      
      if (transit && airportCoordinates[transit]) {
        routeCoordinates.push(airportCoordinates[transit]);
        airportsData[transit] = airportCoordinates[transit];
      }
      
      if (to && airportCoordinates[to]) {
        routeCoordinates.push(airportCoordinates[to]);
        airportsData[to] = airportCoordinates[to];
      }
      
      setCoordinates(routeCoordinates);
      setAirports(airportsData);
      
      // Set the initial map region
      if (routeCoordinates.length > 0) {
        const latitudes = routeCoordinates.map(coord => coord.latitude);
        const longitudes = routeCoordinates.map(coord => coord.longitude);
        
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);
        
        setRegion({
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: (maxLat - minLat) * 1.5,
          longitudeDelta: (maxLng - minLng) * 1.5,
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error setting up map:', error);
      setLoading(false);
    }
  };

  // Load airport coordinates when component mounts
  useEffect(() => {
    getAirportCoordinates();
  }, [flight]);

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Chi tiết tuyến bay</Text>

        {/* Route Map Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Bản đồ tuyến đường</Text>
          <View style={styles.routeInfo}>
            <View style={styles.routePoint}>
              <Text style={styles.routeLabel}>Điểm đi: {flight.From || 'N/A'}</Text>
              <Text style={styles.routeSubtext}>Sân bay xuất phát</Text>
            </View>
            <View style={styles.routePoint}>
              <Text style={styles.routeLabel}>Điểm đến: {flight.To || 'N/A'}</Text>
              <Text style={styles.routeSubtext}>Sân bay đến</Text>
            </View>
          </View>
          
          <View style={styles.mapContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
              </View>
            ) : (
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={region}
                onMapReady={() => setMapReady(true)}
              >
                {/* Draw line between airports */}
                <Polyline
                  coordinates={coordinates}
                  strokeWidth={3}
                  strokeColor="#4A90E2"
                  geodesic={true}
                  lineDashPattern={[0]}
                />
                
                {/* Add markers for each airport */}
                {Object.keys(airports).map((code, index) => {
                  const airport = airports[code];
                  let pinColor = '#4A90E2';
                  let label = '';
                  
                  if (code === flight.From) {
                    pinColor = '#4CAF50'; // green for departure
                    label = 'Xuất phát';
                  } else if (code === flight.To) {
                    pinColor = '#F44336'; // red for arrival
                    label = 'Đến';
                  } else {
                    label = 'Quá cảnh';
                  }
                  
                  return (
                    <Marker
                      key={code}
                      coordinate={{
                        latitude: airport.latitude,
                        longitude: airport.longitude
                      }}
                      pinColor={pinColor}
                      title={code}
                      description={airport.name}
                    >
                      {/* Custom marker component could be added here if needed */}
                    </Marker>
                  );
                })}
              </MapView>
            )}
          </View>
          
          {/* Legend */}
          <View style={styles.mapLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Điểm đi</Text>
            </View>
            {flight.Transit && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4A90E2' }]} />
                <Text style={styles.legendText}>Quá cảnh</Text>
              </View>
            )}
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
              <Text style={styles.legendText}>Điểm đến</Text>
            </View>
          </View>
        </View>

        {/* Flight Information */}
        <Text style={styles.sectionTitle}>Thông tin chuyến bay</Text>
        <View style={styles.flightInfoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Số chuyến bay</Text>
            <Text style={styles.infoValue}>{flight.Number_Flight || 'N/A'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Phi cơ</Text>
            <Text style={styles.infoValue}>{flight.Plane || 'N/A'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Giờ khởi hành</Text>
            <Text style={styles.infoValue}>{formatUTCDateTime(flight.Time_depart)}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Giờ hạ cánh</Text>
            <Text style={styles.infoValue}>{formatUTCDateTime(flight.Time_landing)}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Cổng khởi hành</Text>
            <Text style={styles.infoValue}>{flight.Gate_depart || 'N/A'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Trạng thái</Text>
            <Text style={styles.infoValue}>{flight.Status || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Giá ban đầu:</Text>
            <Text style={styles.infoValue}>{formatCurrency(flight.Initial_price)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Giá hiện tại:</Text>
            <Text style={[styles.infoValue, styles.currentPrice]}>
              {formatCurrency(flight.Current_price)}
            </Text>
          </View>
          
          {flight.Initial_price !== flight.Current_price && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tiết kiệm:</Text>
              <Text style={[styles.infoValue, styles.savingsPrice]}>
                {formatCurrency(flight.Initial_price - flight.Current_price)}
              </Text>
            </View>
          )}
        </View>


          <Text style={styles.sectionTitle}>Thời tiết tuyến đường</Text>
          <View style={styles.weatherContainer}>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherLabel}>Vị trí hiện tại</Text>
              <View style={styles.weatherInfo}>
                <Ionicons name="sunny" size={24} color="#FFB100" />
                <Text style={styles.weatherText}>Nắng đẹp, trời quang</Text>
              </View>
            </View>

            <View style={styles.weatherItem}>
              <Text style={styles.weatherLabel}>Điểm đến</Text>
              <View style={styles.weatherInfo}>
                <MaterialCommunityIcons name="weather-windy" size={24} color="#4A90E2" />
                <Text style={styles.weatherText}>Gió mạnh</Text>
              </View>
            </View>
          </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 20,
    paddingTop: 40,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  content: {
    padding: 15,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 3,
    marginBottom: 15,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  routePoint: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  routeSubtext: {
    fontSize: 12,
    color: '#666',
  },
  mapImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginVertical: 10,
  },
  routeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  metricText: {
    fontSize: 14,
    color: '#666',
  },
  flightInfoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    width: '48%',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  weatherContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 3,
  },
  weatherItem: {
    marginBottom: 15,
  },
  weatherLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weatherText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  bottomNavItem: {
    alignItems: 'center',
  },
  bottomNavText: {
    fontSize: 12,
    marginTop: 4,
    color: '#4A90E2',
  },
  currentPrice: {
    color: '#E53935',
    fontWeight: 'bold',
  },
  savingsPrice: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  // Map styles
  mapContainer: {
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 15,
    marginBottom: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  mapLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 10,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
