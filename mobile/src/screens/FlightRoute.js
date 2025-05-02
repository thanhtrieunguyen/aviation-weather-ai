import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Switch, Platform, Modal, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function FlightDetails() {
  const navigation = useNavigation();
  const [flights, setFlights] = useState([]);
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('HAH'); 
  const [to, setTo] = useState('SGN'); 
  const [departDate, setDepartDate] = useState(new Date()); 
  const [showDatePicker, setShowDatePicker] = useState(false); 
  const [isRoundTrip, setIsRoundTrip] = useState(false); 
  
  // Thay đổi state hành khách
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  
  const [showSearchForm, setShowSearchForm] = useState(true); 
  
  // State cho modal
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Danh sách các điểm đi/đến
  const airports = [
    { code: 'HAN', name: 'Hà Nội', fullName: 'Sân bay Quốc tế Nội Bài' },
    { code: 'SGN', name: 'Hồ Chí Minh', fullName: 'Sân bay Quốc tế Tân Sơn Nhất' },
    { code: 'DND', name: 'Đà Nẵng', fullName: 'Sân bay Quốc tế Đà Nẵng' },
    { code: 'HPH', name: 'Hải Phòng', fullName: 'Sân bay Quốc tế Cát Bi' },
    { code: 'CMH', name: 'Cà Mau', fullName: 'Sân bay Cà Mau' },
    { code: 'DLI', name: 'Đà Lạt', fullName: 'Sân bay Liên Khương' },
    { code: 'CXR', name: 'Nha Trang', fullName: 'Sân bay Cam Ranh' },
    { code: 'PQC', name: 'Phú Quốc', fullName: 'Sân bay Phú Quốc' },
    { code: 'HUE', name: 'Huế', fullName: 'Sân bay Phú Bài' },
    { code: 'VCS', name: 'Côn Đảo', fullName: 'Sân bay Côn Đảo' },
    { code: 'BMV', name: 'Buôn Ma Thuột', fullName: 'Sân bay Buôn Ma Thuột' },
    { code: 'VCL', name: 'Chu Lai', fullName: 'Sân bay Quốc tế Chu Lai' },
    { code: 'DIN', name: 'Điện Biên Phủ', fullName: 'Sân bay Điện Biên Phủ' },
    { code: 'VDH', name: 'Đồng Hới', fullName: 'Sân bay Đồng Hới' },
    { code: 'UIH', name: 'Phú Cát', fullName: 'Sân bay Phú Cát' },
    { code: 'PXU', name: 'Pleiku', fullName: 'Sân bay Pleiku' },
    { code: 'THD', name: 'Thọ Xuân', fullName: 'Sân bay Thọ Xuân' },
    { code: 'VDO', name: 'Vân Đồn', fullName: 'Sân bay Quốc tế Vân Đồn' },
    { code: 'VII', name: 'Vinh', fullName: 'Sân bay Vinh' },
    { code: 'VTG', name: 'Vũng Tàu', fullName: 'Sân bay Vũng Tàu' },
  ];

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const response = await fetch('http://192.168.2.11:5000/flights');
      const data = await response.json();
      setFlights(data);
      setFilteredFlights(data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu chuyến bay:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const filtered = flights.filter(flight => {
      const flightDate = new Date(flight.Time_depart).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const selectedDate = departDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const flightFrom = flight.From.trim().toLowerCase();
      const flightTo = flight.To.trim().toLowerCase();
      const searchFrom = from.trim().toLowerCase();
      const searchTo = to.trim().toLowerCase();

      const matchesFrom = flightFrom === searchFrom;
      const matchesTo = searchTo ? flightTo === searchTo : true;
      const matchesDate = flightDate === selectedDate;

      return matchesFrom && matchesTo && matchesDate;
    });

    setFilteredFlights(filtered);
    setShowSearchForm(false); 
  };

  const handleFlightPress = (flight) => {
    // Truyền thông tin hành khách khi chuyển màn hình
    navigation.navigate('FlightBooking', { 
      flight,
      passengers: {
        adults,
        children,
        infants
      }
    });
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || departDate;
    setShowDatePicker(Platform.OS === 'ios');
    setDepartDate(currentDate);
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
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

  // Format time to just show hours and minutes
  const formatTimeOnly = (dateTime) => {
    if (!dateTime) return 'N/A';
    
    const date = new Date(dateTime);
    
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  };

  // Hàm tính thời gian bay
  const calculateFlightDuration = (depart, land) => {
    const departTime = new Date(depart);
    const landTime = new Date(land);
    
    // Calculate difference in milliseconds using UTC time
    const diffMs = landTime - departTime;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Hàm chuyển đổi hiển thị form tìm kiếm
  const toggleSearchForm = () => {
    setShowSearchForm(!showSearchForm);
  };
  
  // Hàm lọc sân bay theo từ khóa tìm kiếm
  const filterAirports = () => {
    if (!searchQuery.trim()) return airports;
    return airports.filter(airport => 
      airport.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      airport.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      airport.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  // Hàm tăng số lượng
  const increaseCount = (type) => {
    switch(type) {
      case 'adults':
        if (adults < 9) setAdults(adults + 1);
        break;
      case 'children':
        if (children < 9) setChildren(children + 1);
        break;
      case 'infants':
        // Số lượng em bé không được vượt quá số lượng người lớn
        if (infants < adults && infants < 4) setInfants(infants + 1);
        break;
    }
  };
  
  // Hàm giảm số lượng
  const decreaseCount = (type) => {
    switch(type) {
      case 'adults':
        // Luôn phải có ít nhất 1 người lớn
        if (adults > 1) {
          setAdults(adults - 1);
          // Nếu giảm người lớn xuống dưới số em bé, giảm em bé theo
          if (infants > adults - 1) setInfants(adults - 1);
        }
        break;
      case 'children':
        if (children > 0) setChildren(children - 1);
        break;
      case 'infants':
        if (infants > 0) setInfants(infants - 1);
        break;
    }
  };
  
  // Hàm định dạng hiển thị tổng số hành khách
  const formatPassengerSummary = () => {
    const total = adults + children + infants;
    let summary = `${total} hành khách`;
    
    const details = [];
    if (adults > 0) details.push(`${adults} người lớn`);
    if (children > 0) details.push(`${children} trẻ em`);
    if (infants > 0) details.push(`${infants} em bé`);
    
    return summary + ' (' + details.join(', ') + ')';
  };
  
  // Modal chọn số lượng hành khách
  const renderPassengerModal = () => (
    <Modal
      visible={showPassengerModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPassengerModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn hành khách</Text>
            <TouchableOpacity onPress={() => setShowPassengerModal(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {/* Người lớn */}
          <View style={styles.passengerTypeContainer}>
            <View style={styles.passengerTypeInfo}>
              <Text style={styles.passengerTypeTitle}>Người lớn</Text>
              <Text style={styles.passengerTypeDescription}>Từ 12 tuổi trở lên</Text>
            </View>
            <View style={styles.countController}>
              <TouchableOpacity 
                style={[styles.countButton, adults <= 1 ? styles.disabledButton : null]} 
                onPress={() => decreaseCount('adults')}
                disabled={adults <= 1}
              >
                <Icon name="remove" size={20} color={adults <= 1 ? "#CCC" : "#2196F3"} />
              </TouchableOpacity>
              <Text style={styles.countText}>{adults}</Text>
              <TouchableOpacity 
                style={[styles.countButton, adults >= 9 ? styles.disabledButton : null]} 
                onPress={() => increaseCount('adults')}
                disabled={adults >= 9}
              >
                <Icon name="add" size={20} color={adults >= 9 ? "#CCC" : "#2196F3"} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Trẻ em */}
          <View style={styles.passengerTypeContainer}>
            <View style={styles.passengerTypeInfo}>
              <Text style={styles.passengerTypeTitle}>Trẻ em</Text>
              <Text style={styles.passengerTypeDescription}>Từ 2 đến dưới 12 tuổi</Text>
            </View>
            <View style={styles.countController}>
              <TouchableOpacity 
                style={[styles.countButton, children <= 0 ? styles.disabledButton : null]} 
                onPress={() => decreaseCount('children')}
                disabled={children <= 0}
              >
                <Icon name="remove" size={20} color={children <= 0 ? "#CCC" : "#2196F3"} />
              </TouchableOpacity>
              <Text style={styles.countText}>{children}</Text>
              <TouchableOpacity 
                style={[styles.countButton, children >= 9 ? styles.disabledButton : null]} 
                onPress={() => increaseCount('children')}
                disabled={children >= 9}
              >
                <Icon name="add" size={20} color={children >= 9 ? "#CCC" : "#2196F3"} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Em bé */}
          <View style={styles.passengerTypeContainer}>
            <View style={styles.passengerTypeInfo}>
              <Text style={styles.passengerTypeTitle}>Em bé</Text>
              <Text style={styles.passengerTypeDescription}>Dưới 2 tuổi, ngồi cùng người lớn</Text>
            </View>
            <View style={styles.countController}>
              <TouchableOpacity 
                style={[styles.countButton, infants <= 0 ? styles.disabledButton : null]} 
                onPress={() => decreaseCount('infants')}
                disabled={infants <= 0}
              >
                <Icon name="remove" size={20} color={infants <= 0 ? "#CCC" : "#2196F3"} />
              </TouchableOpacity>
              <Text style={styles.countText}>{infants}</Text>
              <TouchableOpacity 
                style={[styles.countButton, infants >= adults || infants >= 4 ? styles.disabledButton : null]} 
                onPress={() => increaseCount('infants')}
                disabled={infants >= adults || infants >= 4}
              >
                <Icon name="add" size={20} color={infants >= adults || infants >= 4 ? "#CCC" : "#2196F3"} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Chú thích */}
          <View style={styles.passengerNote}>
            <Icon name="info-outline" size={18} color="#666" />
            <Text style={styles.passengerNoteText}>
              Mỗi người lớn chỉ được đi kèm tối đa 1 em bé. Tổng số hành khách không được vượt quá 9 người.
            </Text>
          </View>
          
          {/* Nút xác nhận */}
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={() => setShowPassengerModal(false)}
          >
            <Text style={styles.confirmButtonText}>Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  // Modal chọn điểm đi
  const renderFromModal = () => (
    <Modal
      visible={showFromModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFromModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn điểm khởi hành</Text>
            <TouchableOpacity onPress={() => setShowFromModal(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchBox}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm sân bay, thành phố"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="cancel" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
          
          <FlatList
            data={filterAirports()}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.airportItem}
                onPress={() => {
                  setFrom(item.code);
                  setShowFromModal(false);
                  setSearchQuery('');
                }}
              >
                <View style={styles.airportItemContent}>
                  <View style={styles.airportMainInfo}>
                    <Text style={styles.airportName}>{item.name}</Text>
                    <Text style={styles.airportCode}>{item.code}</Text>
                  </View>
                  <Text style={styles.airportFullName}>{item.fullName}</Text>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );
  
  // Modal chọn điểm đến
  const renderToModal = () => (
    <Modal
      visible={showToModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowToModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn điểm đến</Text>
            <TouchableOpacity onPress={() => setShowToModal(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchBox}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm sân bay, thành phố"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="cancel" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
          
          <FlatList
            data={filterAirports()}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.airportItem}
                onPress={() => {
                  setTo(item.code);
                  setShowToModal(false);
                  setSearchQuery('');
                }}
              >
                <View style={styles.airportItemContent}>
                  <View style={styles.airportMainInfo}>
                    <Text style={styles.airportName}>{item.name}</Text>
                    <Text style={styles.airportCode}>{item.code}</Text>
                  </View>
                  <Text style={styles.airportFullName}>{item.fullName}</Text>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );

  // Hàm lấy tên thành phố từ mã
  const getCityName = (code) => {
    const airport = airports.find(air => air.code === code);
    return airport ? airport.name : code;
  };

  // Add this helper function to format currency
  const formatCurrency = (amount) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      {/* Thanh tiêu đề và nút toggle form tìm kiếm */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.activeTab} onPress={toggleSearchForm}>
          <Icon name="flight" size={20} color="#2196F3" />
          <Text style={styles.activeTabText}>Máy bay</Text>
          <Icon 
            name={showSearchForm ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={24} 
            color="#2196F3" 
            style={styles.toggleIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Phần tìm kiếm */}
      {showSearchForm && (
        <View style={styles.searchContainer}>
          <View style={styles.inputContainer}>
            {/* Điểm đi - Có thể nhấn để mở modal */}
            <TouchableOpacity 
              style={styles.inputRow}
              onPress={() => {
                setSearchQuery('');
                setShowFromModal(true);
              }}
            >
              <Icon name="flight-takeoff" size={20} color="#666" />
              <View style={styles.selectedLocationContainer}>
                <Text style={styles.locationLabel}>Điểm đi</Text>
                <Text style={styles.locationName}>{getCityName(from)}</Text>
              </View>
              <Icon name="arrow-drop-down" size={20} color="#666" />
            </TouchableOpacity>
            
            {/* Điểm đến - Có thể nhấn để mở modal */}
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => {
                setSearchQuery('');
                setShowToModal(true);
              }}
            >
              <Icon name="flight-land" size={20} color="#666" />
              <View style={styles.selectedLocationContainer}>
                <Text style={styles.locationLabel}>Điểm đến</Text>
                <Text style={styles.locationName}>{getCityName(to)}</Text>
              </View>
              <Icon name="arrow-drop-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.dateContainer}>
            <TouchableOpacity style={styles.dateRow} onPress={showDatePickerModal}>
              <Icon name="calendar-today" size={20} color="#666" />
              <Text style={styles.dateText}>
                {departDate.toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
              {showDatePicker && (
              <DateTimePicker
                value={departDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
            </TouchableOpacity>
          </View>

          {/* Phần chọn hành khách - Đã cập nhật */}
          <TouchableOpacity 
            style={styles.passengerContainer}
            onPress={() => setShowPassengerModal(true)}
          >
            <Icon name="person" size={20} color="#666" />
            <View style={styles.selectedLocationContainer}>
              <Text style={styles.locationLabel}>Hành khách</Text>
              <Text style={styles.locationName}>{formatPassengerSummary()}</Text>
            </View>
            <Icon name="arrow-drop-down" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Tìm kiếm</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Danh sách chuyến bay */}
      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {filteredFlights.length > 0 
                ? `Các chuyến bay (${filteredFlights.length})` 
                : 'Các chuyến bay'}
            </Text>
            {!showSearchForm && (
              <TouchableOpacity onPress={toggleSearchForm} style={styles.searchAgainButton}>
                <Icon name="filter-list" size={18} color="#2196F3" />
                <Text style={styles.searchAgainText}>Lọc</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredFlights.length === 0 ? (
            <Text style={styles.noFlightsText}>Không tìm thấy chuyến bay nào phù hợp.</Text>
          ) : (
            filteredFlights.map((flight, index) => (
              <TouchableOpacity
                key={flight._id || flight.Number_Flight}
                onPress={() => handleFlightPress(flight)}
                style={[styles.flightItem, index < filteredFlights.length - 1 ? styles.borderBottom : null]}
              >
                {/* Logo hãng bay */}
                <View style={styles.airlineLogoContainer}>
                  <Icon name="flight" size={24} color="#2196F3" />
                  <Text style={styles.airlineText}>{flight.Plane}</Text>
                </View>

                {/* Thông tin chuyến bay */}
                <View style={styles.flightDetailsContainer}>
                  {/* Thời gian và hành trình */}
                  <View style={styles.timeRow}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.timeText}>
                        {formatTimeOnly(flight.Time_depart)}
                      </Text>
                      <Text style={styles.cityCode}>{flight.From}</Text>
                    </View>
                    
                    <View style={styles.durationContainer}>
                      <Text style={styles.durationText}>
                        {calculateFlightDuration(flight.Time_depart, flight.Time_landing)}
                      </Text>
                      <View style={styles.flightPathLine}>
                        <View style={styles.flightPathDot}></View>
                        <View style={styles.flightPathLine}></View>
                        <View style={styles.flightPathArrow}></View>
                      </View>
                      <Text style={styles.transitText}>
                        {flight.Transit ? 'Quá cảnh' : 'Bay thẳng'}
                      </Text>
                    </View>
                    
                    <View style={styles.timeBlock}>
                      <Text style={styles.timeText}>
                        {formatTimeOnly(flight.Time_landing)}
                      </Text>
                      <Text style={styles.cityCode}>{flight.To}</Text>
                    </View>
                  </View>

                  {/* Ngày bay */}
                  <View style={styles.dateInfoRow}>
                    <Text style={styles.flightDateText}>
                      {formatUTCDateTime(flight.Time_depart)}
                    </Text>
                    <Text style={styles.flightNumberText}>
                      Số hiệu: {flight.Number_Flight || 'VJ001'}
                    </Text>
                  </View>
                </View>

                {/* Giá vé và nút đặt */}
                <View style={styles.bookingContainer}>
                  <View style={styles.priceContainer}>
                    {flight.Initial_price !== flight.Current_price ? (
                      <>
                        <Text style={styles.originalPrice}>{formatCurrency(flight.Initial_price)}</Text>
                        <Text style={styles.currentPrice}>{formatCurrency(flight.Current_price)}</Text>
                      </>
                    ) : (
                      <Text style={styles.currentPrice}>{formatCurrency(flight.Current_price || 1000000)}</Text>
                    )}
                  </View>
                  <Text style={[styles.flightStatus]}>
                    {flight.Status}
                  </Text>
                  <TouchableOpacity style={styles.bookButton} onPress={() => handleFlightPress(flight)}>
                    <Text style={styles.bookButtonText}>Đặt ngay</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
      
      {/* Modal chọn sân bay */}
      {renderFromModal()}
      {renderToModal()}
      {renderPassengerModal()}
    </View>
  );
}
const styles = StyleSheet.create({
  // Styles cũ giữ nguyên
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  activeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  toggleIcon: {
    marginLeft: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  selectedLocationContainer: {
    flex: 1,
    marginLeft: 10,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
  },
  locationName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  dateContainer: {
    marginBottom: 15,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 5,
    padding: 10,
  },
  dateText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  passengerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  passengerText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchAgainText: {
    color: '#2196F3',
    marginLeft: 5,
    fontWeight: '500',
  },
  flightItem: {
    flexDirection: 'column',
    backgroundColor: '#EBF5FB',
    borderRadius: 10,
    margin: 10,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  borderBottom: {
    borderBottomWidth: 0,
  },
  // Logo hãng bay
  airlineLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D6EAF8',
    paddingBottom: 10,
  },
  airlineText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  // Container thông tin chuyến bay
  flightDetailsContainer: {
    marginBottom: 15,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeBlock: {
    alignItems: 'center',
    width: 80,
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cityCode: {
    fontSize: 16,
    color: '#555',
    marginTop: 2,
  },
  durationContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  durationText: {
    fontSize: 14,
    color: '#555',
    fontWeight: 'bold',
  },
  flightPathLine: {
    height: 2,
    backgroundColor: '#AED6F1',
    width: '100%',
    marginVertical: 5,
    position: 'relative',
  },
  flightPathDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    position: 'absolute',
    left: -4,
    top: -3,
  },
  flightPathArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    borderTopWidth: 6,
    borderTopColor: 'transparent',
    borderBottomWidth: 6,
    borderBottomColor: 'transparent',
    borderRightWidth: 6,
    borderRightColor: '#2196F3',
    position: 'absolute',
    right: -6,
    top: -5,
    transform: [{ rotate: '180deg' }],
  },
  transitText: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  // Thông tin ngày và số hiệu
  dateInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flightDateText: {
    fontSize: 14,
    color: '#666',
  },
  flightNumberText: {
    fontSize: 14,
    color: '#666',
  },
  // Container đặt vé
  bookingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#D6EAF8',
    paddingTop: 10,
  },
  priceContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 12,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E53935',
  },
  bookButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noFlightsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  // Styles cho modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  airportItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  airportItemContent: {
    flexDirection: 'column',
  },
  airportMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  airportName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  airportCode: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  airportFullName: {
    fontSize: 14,
    color: '#666',
  },
  flightStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginLeft: 15,
  },
  
  // Styles mới cho phần chọn hành khách
  passengerTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  passengerTypeInfo: {
    flex: 1,
  },
  passengerTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  passengerTypeDescription: {
    fontSize: 14,
    color: '#666',
  },
  countController: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  disabledButton: {
    borderColor: '#E5E5E5',
    backgroundColor: '#F5F5F5',
  },
  countText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 12,
    width: 24,
    textAlign: 'center',
  },
  passengerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 15,
    borderRadius: 5,
  },
  passengerNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: '#2196F3',
    marginHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});