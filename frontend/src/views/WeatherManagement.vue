<!-- WeatherDashboard.vue -->
<template>
  <div class="p-6">
    <div v-if="loadError" class="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ loadError }}
    </div>

    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold">Quản lý Thời tiết</h1>
        <!-- Moved and restyled airport selector -->
        <div class="w-64">
          <select 
            v-model="selectedAirport" 
            @change="handleAirportChange" 
            :disabled="isLoadingAirports"
            class="block w-full px-3 py-2 text-sm rounded-md border border-gray-300 
                   focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                   shadow-sm bg-white"
          >
            <option value="">
              {{ isLoadingAirports ? 'Đang tải...' : '-- Chọn sân bay --' }}
            </option>
            <option v-for="airport in airports" :key="airport.iata" :value="airport.iata">
              {{ airport.name }} ({{ airport.iata }})
            </option>
          </select>
        </div>
      </div>
      
      <button 
        @click="refreshData" 
        :disabled="isLoading"
        class="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 
               hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowPathIcon class="w-5 h-5" :class="{ 'animate-spin': isLoading }" />
        {{ isLoading ? 'Đang làm mới...' : 'Làm mới dữ liệu' }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-lg shadow-sm p-4">
        <h2 class="text-lg font-semibold mb-4">Thời tiết hiện tại</h2>
        <div class="space-y-3">
          <div class="p-3 bg-red-100 rounded-lg">
            <div class="flex justify-between items-center">
              <span>Nhiệt độ</span>
              <span class="text-xl font-bold">{{ currentWeather.temperature }}°C</span>
            </div>
          </div>
          <div class="p-3 bg-blue-50 rounded-lg">
            <div class="flex justify-between items-center">
              <span>Độ ẩm</span>
              <span class="text-xl font-bold">{{ currentWeather.humidity }}%</span>
            </div>
          </div>
          <div class="p-3 bg-gray-50 rounded-lg">
            <div class="flex justify-between items-center">
              <span>Tốc độ gió</span>
              <span class="text-xl font-bold">{{ currentWeather.windSpeed }} km/h</span>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <h2 class="text-lg font-semibold mb-4">Hướng gió</h2>
        <div class="flex justify-center items-center h-[200px]">
          <ArrowUpIcon class="w-32 h-32 text-blue-500 transform transition-transform duration-300"
            :style="{ transform: `rotate(${windDirection}deg)` }" />
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4">
        <h2 class="text-lg font-semibold mb-4">Cảnh báo thời tiết</h2>
        <div class="space-y-3">
          <div v-for="(alert, index) in weatherAlerts" :key="index"
            :class="['p-3 rounded-lg', alert.type === 'warning' ? 'bg-yellow-50' : 'bg-red-50']">
            <component :is="alert.type === 'warning' ? ExclamationTriangleIcon : ExclamationCircleIcon"
              class="w-5 h-5 mb-1" :class="alert.type === 'warning' ? 'text-yellow-700' : 'text-red-700'" />
            <p>{{ alert.message }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div :class="{'hidden': showNotificationDetail}" class="lg:col-span-2 bg-white rounded-lg shadow-sm p-4">
        <h2 class="text-lg font-semibold mb-4">Bản đồ Rada mưa</h2>
        <div class=" rounded-lg ">
          <WeatherMap :selectedAirport="selectedAirportInfo" :key="selectedAirport" />
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-4">
        <h2 class="text-lg font-semibold mb-4">Dự báo 24h tới</h2>
        <div class="h-[400px]">
          <LineChart :data="forecastData" :options="chartOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAirports, getAirportWeather, getAirportForecast } from '../api'
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ArrowUpIcon
} from '@heroicons/vue/24/outline'
import WeatherMap from '../components/WeatherMap.vue'
import { Line as LineChart } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const airports = ref([])
const selectedAirport = ref('')
const selectedAirportInfo = ref(null)
const isLoadingAirports = ref(true)
const loadError = ref(null)

const loadAirports = async () => {
  isLoadingAirports.value = true
  loadError.value = null

  try {
    const response = await getAirports()
    airports.value = response.data
  } catch (error) {
    console.error('Error loading airports:', error)
    loadError.value = 'Không thể tải danh sách sân bay. Vui lòng thử lại sau.'
  } finally {
    isLoadingAirports.value = false
  }
}
const handleAirportChange = async () => {
  if (!selectedAirport.value) return

  isLoading.value = true
  loadError.value = null

  try {
    selectedAirportInfo.value = airports.value.find(a => a.iata === selectedAirport.value)

    const weatherResponse = await getAirportWeather(selectedAirport.value)
    const weatherData = weatherResponse.data

    // Update current weather
    currentWeather.value = {
      temperature: weatherData.current_weather.temperature || 0,
      humidity: weatherData.current_weather.humidity || 0,
      windSpeed: weatherData.current_weather.wind_speed || 0
    }

    // Update wind direction
    windDirection.value = weatherData.current_weather.wind_direction || 0

    // Update forecast data
    if (weatherData.prediction && weatherData.prediction.length > 0) {
      updateForecastData(weatherData.prediction)
    }

  } catch (error) {
    console.error('Error loading weather data:', error)
    loadError.value = 'Không thể tải dữ liệu thời tiết. Vui lòng thử lại sau.'
  } finally {
    isLoading.value = false
  }
}

// Add helper function to update forecast data
const updateForecastData = (prediction) => {
  forecastData.value = {
    labels: prediction.map(p => {
      const date = new Date(p.timestamp)
      return `${date.getHours()}:00`
    }),
    datasets: [{
      label: 'Nhiệt độ (°C)',
      data: prediction.map(p => p.temperature),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  }
}

const isLoading = ref(false)
const currentWeather = ref({
  temperature: 28,
  humidity: 75,
  windSpeed: 15
})

const windDirection = ref(45)

const weatherAlerts = ref([
  {
    type: 'warning',
    message: 'Dự báo mưa lớn trong 6h tới'
  },
  {
    type: 'danger',
    message: 'Cảnh báo gió mạnh cấp 7'
  }
])

const forecastData = ref({
  labels: ['6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h'],
  datasets: [
    {
      label: 'Nhiệt độ (°C)',
      data: [23, 25, 28, 32, 30, 27, 25, 23],
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }
  ]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: false,
      title: {
        display: true,
        text: 'Nhiệt độ (°C)'
      }
    },
    x: {
      title: {
        display: true,
        text: 'Giờ'
      }
    }
  }
}

const refreshData = async () => {
  if (!selectedAirport.value) {
    alert('Vui lòng chọn sân bay')
    return
  }
  await handleAirportChange()
}

onMounted(() => {
  loadAirports()
})
</script>