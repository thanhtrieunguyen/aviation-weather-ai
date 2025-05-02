<template>
  <div class="p-6 h-screen overflow-auto">
    <header class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Bảng Điều Khiển</h1>
      <div class="flex items-center gap-4">
        <button 
          @click="refreshData" 
          class="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
          :class="{ 'opacity-50 cursor-not-allowed': isRefreshing }"
          :disabled="isRefreshing"
        >
          <ArrowPathIcon class="w-5 h-5" :class="{ 'animate-spin': isRefreshing }" />
          {{ isRefreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu' }}
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <WeatherMap />
      <RecentFlights :flights="recentFlights" :loading="loadingFlights" :error="flightError" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <WeatherStats :stats="weatherStats" :loading="loadingWeather" />
      <WeatherAlerts :alerts="weatherAlerts" :loading="loadingAlerts" />
      <FlightStatistics :stats="flightStats" :loading="loadingFlights" />
    </div>
    
    <!-- Thông báo lỗi -->
    <div v-if="error" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import WeatherMap from './WeatherMap.vue'
import RecentFlights from './RecentFlights.vue'
import WeatherStats from './WeatherStats.vue'
import WeatherAlerts from './WeatherAlerts.vue'
import FlightStatistics from './FlightStatistics.vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const isRefreshing = ref(false)
const error = ref(null)

// Trạng thái loading
const loadingWeather = ref(true)
const loadingAlerts = ref(true)
const loadingFlights = ref(true)

// Trạng thái lỗi
const weatherError = ref(null)
const alertsError = ref(null)
const flightError = ref(null)

// Dữ liệu
const weatherStats = ref({
  temperature: 0,
  humidity: 0,
  windSpeed: 0,
  visibility: 0,
  pressure: 0,
  cloudCover: 0
})

const weatherAlerts = ref([])
const recentFlights = ref([])

const flightStats = ref({
  totalFlights: 0,
  onTime: 0,
  delayed: 0,
  cancelled: 0,
  occupancyRate: 0
})

// Hàm tạo dữ liệu thời tiết ngẫu nhiên
const generateRandomWeather = () => {
  return {
    temperature: Math.floor(Math.random() * 20) + 15, // 15-35°C
    humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
    windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
    visibility: Math.floor(Math.random() * 5) + 5, // 5-10 km
    pressure: Math.floor(Math.random() * 30) + 1000, // 1000-1030 hPa
    cloudCover: Math.floor(Math.random() * 100) // 0-100%
  }
}

// Biến lưu interval để clear khi component unmount
let weatherInterval = null

// Hàm lấy dữ liệu thời tiết (sử dụng dữ liệu ngẫu nhiên)
const fetchWeatherData = async () => {
  loadingWeather.value = true
  weatherError.value = null
  
  try {
    // Thay vì gọi API, sử dụng dữ liệu ngẫu nhiên
    weatherStats.value = generateRandomWeather()
    
    // Giả lập độ trễ của mạng
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (err) {
    console.error('Lỗi khi lấy dữ liệu thời tiết:', err)
    weatherError.value = 'Không thể tải dữ liệu thời tiết'
  } finally {
    loadingWeather.value = false
  }
}

// Hàm lấy cảnh báo thời tiết
const fetchWeatherAlerts = async () => {
  loadingAlerts.value = true
  alertsError.value = null
  
  try {
    const response = await axios.get(`${API_URL}/alertsflights`)
    const processedAlerts = []
    
    // Process the nested data structure
    response.data.forEach(item => {
      // Check if item has predictions array
      if (item.predictions && Array.isArray(item.predictions)) {
        // Extract alerts from predictions with non-good weather
        const badWeatherPredictions = item.predictions.filter(p => 
          p.summary !== "Thời tiết tốt" && p.weather_code !== 105
        )
        
        badWeatherPredictions.forEach(prediction => {
          const alertLevel = prediction.weather_code === 101 || 
                            prediction.weather_code === 102 || 
                            prediction.weather_code === 103 ? 'high' : 'medium'
          
          processedAlerts.push({
            type: alertLevel === 'high' ? 'warning' : 'info',
            message: `${item.location_data?.city || item.airport_code}: ${prediction.summary} - ${prediction.forecast}`,
            time: new Date(prediction.timestamp).toLocaleString(),
            level: alertLevel
          })
        })
      } else if (item.Content) {
        // Handle old format
        processedAlerts.push({
          type: item.level === 'high' ? 'warning' : 'info',
          message: item.Content,
          time: new Date(item.Created_at).toLocaleString(),
          level: item.level
        })
      }
    })
    
    weatherAlerts.value = processedAlerts
  } catch (err) {
    console.error('Lỗi khi lấy cảnh báo thời tiết:', err)
    alertsError.value = 'Không thể tải cảnh báo thời tiết'
  } finally {
    loadingAlerts.value = false
  }
}

// Hàm lấy dữ liệu chuyến bay
const fetchFlightData = async () => {
  loadingFlights.value = true
  flightError.value = null
  
  try {
    const response = await axios.get(`${API_URL}/flights`)
    const flights = response.data
    
    // Lấy 5 chuyến bay gần nhất
    recentFlights.value = flights
      .slice(0, 5)
      .map(flight => ({
        id: flight._id,
        number: flight.Number_Flight,
        from: flight.From,
        to: flight.To,
        status: flight.Status,
        time: new Date(flight.Time_depart).toLocaleString()
      }))
    
    // Tính toán thống kê
    const totalFlights = flights.length
    const onTime = flights.filter(f => f.Status === 'Đúng giờ').length
    const delayed = flights.filter(f => f.Status === 'Bị trễ').length
    const cancelled = flights.filter(f => f.Status === 'Đã hủy').length
    
    // Tính tỷ lệ lấp đầy (giả sử mỗi chuyến bay có 200 chỗ)
    let totalSeats = 0
    let totalBookings = 0
    
    flights.forEach(flight => {
      if (flight.seats_total && flight.seats_booked) {
        totalSeats += flight.seats_total
        totalBookings += flight.seats_booked
      }
    })
    
    const occupancyRate = totalSeats > 0 ? Math.round((totalBookings / totalSeats) * 100) : 0
    
    flightStats.value = {
      totalFlights,
      onTime,
      delayed,
      cancelled,
      occupancyRate
    }
  } catch (err) {
    console.error('Lỗi khi lấy dữ liệu chuyến bay:', err)
    flightError.value = 'Không thể tải dữ liệu chuyến bay'
  } finally {
    loadingFlights.value = false
  }
}

// Hàm làm mới tất cả dữ liệu
const refreshData = async () => {
  error.value = null
  isRefreshing.value = true
  
  try {
    await Promise.all([
      fetchWeatherData(),
      fetchWeatherAlerts(),
      fetchFlightData()
    ])
  } catch (err) {
    console.error('Lỗi khi làm mới dữ liệu:', err)
    error.value = 'Đã xảy ra lỗi khi làm mới dữ liệu'
  } finally {
    isRefreshing.value = false
  }
}

// Tải dữ liệu khi component được mount
onMounted(() => {
  refreshData()
  
  // Thiết lập interval để cập nhật dữ liệu thời tiết ngẫu nhiên mỗi 10 giây
  weatherInterval = setInterval(() => {
    weatherStats.value = generateRandomWeather()
  }, 10000)
})

// Clear interval khi component unmount
onBeforeUnmount(() => {
  if (weatherInterval) {
    clearInterval(weatherInterval)
  }
})
</script>