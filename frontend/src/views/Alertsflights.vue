<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">Hệ thống Cảnh báo Thời tiết</h1>
      <div class="flex gap-2">
        <button 
          @click="refreshData" 
          :disabled="isLoading"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {{ isLoading ? 'Đang làm mới...' : 'Làm mới dữ liệu' }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <!-- Thống kê -->
      <div class="bg-white rounded p-4">
        <h2 class="font-semibold mb-3">Thống kê</h2>
        <div class="space-y-2">
          <div class="flex justify-between items-center p-2 bg-red-50 rounded">
            <span class="text-red-600">Cảnh báo cao</span>
            <span class="font-bold">{{ statistics.high }}</span>
          </div>
          <div class="flex justify-between items-center p-2 bg-yellow-50 rounded">
            <span class="text-yellow-600">Cảnh báo TB</span>
            <span class="font-bold">{{ statistics.medium }}</span>
          </div>
          <div class="flex justify-between items-center p-2 bg-blue-50 rounded">
            <span class="text-blue-600">Cảnh báo thấp</span>
            <span class="font-bold">{{ statistics.low }}</span>
          </div>
        </div>
      </div>

      <!-- Bộ lọc -->
      <div class="bg-white rounded p-4">
        <h2 class="font-semibold mb-3">Bộ lọc</h2>
        <div class="space-y-3">
          <input
            v-model="filters.search"
            type="text"
            placeholder="Tìm kiếm theo khu vực hoặc nội dung..."
            class="w-full border rounded px-3 py-2"
          />
          <div class="flex gap-2">
            <select 
              v-model="filters.level" 
              class="w-1/2 border rounded px-3 py-2"
            >
              <option value="">Mức độ</option>
              <option value="high">Cao</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thấp</option>
            </select>
            <select
              v-model="perPage"
              class="w-1/2 border rounded px-3 py-2"
            >
              <option value="5">5 mục/trang</option>
              <option value="10">10 mục/trang</option>
              <option value="20">20 mục/trang</option>
              <option value="50">50 mục/trang</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Danh sách cảnh báo -->
    <div class="bg-white rounded p-4">
      <h2 class="font-semibold mb-4">Danh sách cảnh báo</h2>
      <div v-if="isLoading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>

      <div v-else>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50">
                <th class="border p-2 text-left">Khu vực</th>
                <th class="border p-2 text-left">Thời gian</th>
                <th class="border p-2 text-left">Nội dung</th>
                <th class="border p-2 text-left">Mức độ</th>
                <th class="border p-2 text-center w-16">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="warning in paginatedWarnings" :key="warning._id || warning.id" class="hover:bg-gray-50">
                <td class="border p-2">
                  {{ getShortLocation(warning) }}
                </td>
                <td class="border p-2 whitespace-nowrap">{{ formatDate(warning.timestamp) }}</td>
                <td class="border p-2 max-w-xs">
                  <div class="truncate">{{ warning.summary }}</div>
                </td>
                <td class="border p-2">
                  <span :class="{
                    'bg-red-100 text-red-800': getWarningLevel(warning) === 'high',
                    'bg-yellow-100 text-yellow-800': getWarningLevel(warning) === 'medium',
                    'bg-blue-100 text-blue-800': getWarningLevel(warning) === 'low',
                    'px-2 py-1 rounded': true
                  }">
                    {{ 
                      getWarningLevel(warning) === 'high' ? 'Cao' : 
                      getWarningLevel(warning) === 'medium' ? 'Trung bình' : 'Thấp' 
                    }}
                  </span>
                </td>
                <td class="border p-2 text-center">
                  <button 
                    @click="openWarningDetail(warning)" 
                    class="text-blue-500 hover:text-blue-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredWarnings.length === 0">
                <td colspan="5" class="border p-4 text-center text-gray-500">
                  Không có cảnh báo thời tiết nào phù hợp với tiêu chí tìm kiếm
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="mt-4 flex justify-between items-center">
          <div class="text-sm text-gray-500">
            Hiển thị {{ paginatedWarnings.length > 0 ? startIndex + 1 : 0 }}-{{ Math.min(endIndex, filteredWarnings.length) }} trên {{ filteredWarnings.length }} kết quả
          </div>
          <div class="flex space-x-1">
            <button 
              @click="currentPage = 1" 
              :disabled="currentPage === 1"
              class="px-3 py-1 border rounded text-sm" 
              :class="currentPage === 1 ? 'text-gray-400' : 'hover:bg-gray-100'"
            >
              &laquo;
            </button>
            <button 
              @click="currentPage--" 
              :disabled="currentPage === 1"
              class="px-3 py-1 border rounded text-sm"
              :class="currentPage === 1 ? 'text-gray-400' : 'hover:bg-gray-100'"
            >
              &lsaquo;
            </button>
            
            <button
              v-for="page in pageButtons"
              :key="page"
              @click="currentPage = page"
              class="px-3 py-1 border rounded text-sm"
              :class="currentPage === page ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'"
            >
              {{ page }}
            </button>
            
            <button 
              @click="currentPage++" 
              :disabled="currentPage === totalPages"
              class="px-3 py-1 border rounded text-sm"
              :class="currentPage === totalPages ? 'text-gray-400' : 'hover:bg-gray-100'"
            >
              &rsaquo;
            </button>
            <button 
              @click="currentPage = totalPages" 
              :disabled="currentPage === totalPages"
              class="px-3 py-1 border rounded text-sm"
              :class="currentPage === totalPages ? 'text-gray-400' : 'hover:bg-gray-100'"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Chi tiết cảnh báo dialog -->
    <div v-if="selectedWarning" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full m-4">
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-bold">Chi tiết cảnh báo</h2>
          <button @click="selectedWarning = null" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-medium text-gray-500">Khu vực</h3>
            <p>{{ getAirportLocation(selectedWarning) }}</p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500">Thời gian</h3>
            <p>{{ formatDate(selectedWarning.timestamp) }}</p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500">Tình trạng thời tiết</h3>
            <p>{{ selectedWarning.summary }}</p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500">Chi tiết dự báo</h3>
            <p>{{ selectedWarning.forecast }}</p>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500">Mức độ cảnh báo</h3>
            <span :class="{
              'bg-red-100 text-red-800': getWarningLevel(selectedWarning) === 'high',
              'bg-yellow-100 text-yellow-800': getWarningLevel(selectedWarning) === 'medium',
              'bg-blue-100 text-blue-800': getWarningLevel(selectedWarning) === 'low',
              'px-2 py-1 rounded': true
            }">
              {{ 
                getWarningLevel(selectedWarning) === 'high' ? 'Cao' : 
                getWarningLevel(selectedWarning) === 'medium' ? 'Trung bình' : 'Thấp' 
              }}
            </span>
          </div>
          
          <!-- Chi tiết thông số thời tiết nếu có -->
          <div v-if="selectedWarning.weather_info" class="mt-4">
            <h3 class="text-sm font-medium text-gray-500 mb-2">Thông số thời tiết</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-xs text-gray-500">Nhiệt độ</div>
                <div class="font-medium">{{ selectedWarning.weather_info.temperature }}°C</div>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-xs text-gray-500">Độ ẩm</div>
                <div class="font-medium">{{ selectedWarning.weather_info.humidity }}%</div>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-xs text-gray-500">Gió</div>
                <div class="font-medium">{{ selectedWarning.weather_info.wind_speed }} km/h</div>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-xs text-gray-500">Tầm nhìn</div>
                <div class="font-medium">{{ selectedWarning.weather_info.visibility }} km</div>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-xs text-gray-500">Khả năng mưa</div>
                <div class="font-medium">{{ selectedWarning.weather_info.rain_probability }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
const API_URL = 'http://localhost:5000/alertsflights'

const isLoading = ref(false)
const warnings = ref([])
const error = ref(null)
const selectedWarning = ref(null)

// Pagination
const currentPage = ref(1)
const perPage = ref(10)

const statistics = ref({
  high: 0,
  medium: 0,
  low: 0
})

const filters = ref({
  search: '',
  level: ''
})

// Helper function to extract airport location from data
const getAirportLocation = (warning) => {
  // If warning has location data, use it
  if (warning.location_data) {
    const location = warning.location_data;
    return `${location.airport?.name || ''} (${warning.airport_code || ''}) - ${location.city || ''}, ${location.state || ''}`;
  }
  // For transformed data
  return warning.area || warning.airport_code || 'Không xác định';
}

// Shortened location for the table
const getShortLocation = (warning) => {
  if (warning.location_data) {
    return `${warning.airport_code || ''} - ${warning.location_data.city || ''}`;
  }
  return warning.airport_code || warning.area || 'Không xác định';
}

// Helper function to determine warning level based on weather_code or existing level
const getWarningLevel = (warning) => {
  // If warning already has a level property, use it
  if (warning.level) {
    return warning.level;
  }
  
  // Otherwise determine level from weather_code
  const weatherCode = warning.weather_code || 0;
  
  if (weatherCode === 101) return "high";     // Có mưa
  if (weatherCode === 102) return "high";     // Gió giật mạnh
  if (weatherCode === 103) return "high";     // Có tuyết rơi
  if (weatherCode === 104) return "medium";   // Tầm nhìn giảm
  
  // Check summary text if available
  if (warning.summary) {
    if (warning.summary.includes("mưa") || 
        warning.summary.includes("gió") ||
        warning.summary.includes("tuyết")) {
      return "high";
    }
    if (warning.summary.includes("tầm nhìn")) {
      return "medium";
    }
    if (warning.summary === "Thời tiết tốt") {
      return "low";
    }
  }
  
  return "low"; // Default to low if we can't determine
}

// Computed property for filtered warnings
const filteredWarnings = computed(() => {
  return warnings.value.filter(warning => {
    const searchTerms = filters.value.search.toLowerCase();
    
    // Search in location data, summary, and forecast
    const searchMatch = 
      (getAirportLocation(warning).toLowerCase().includes(searchTerms)) ||
      (warning.summary?.toLowerCase() || '').includes(searchTerms) ||
      (warning.forecast?.toLowerCase() || '').includes(searchTerms);
    
    // Filter by warning level
    const levelMatch = !filters.value.level || getWarningLevel(warning) === filters.value.level;
    
    return searchMatch && levelMatch;
  });
})

// Pagination calculations
const startIndex = computed(() => (currentPage.value - 1) * perPage.value)
const endIndex = computed(() => startIndex.value + parseInt(perPage.value))
const totalPages = computed(() => Math.max(1, Math.ceil(filteredWarnings.value.length / perPage.value)))

// Get only the warnings for current page
const paginatedWarnings = computed(() => {
  return filteredWarnings.value.slice(startIndex.value, endIndex.value);
})

// Create array of page buttons to show (max 5)
const pageButtons = computed(() => {
  const buttons = [];
  const totalPagesValue = totalPages.value;
  const currentPageValue = currentPage.value;
  
  if (totalPagesValue <= 5) {
    // Show all pages if 5 or fewer
    for (let i = 1; i <= totalPagesValue; i++) {
      buttons.push(i);
    }
  } else {
    // Always show first page
    buttons.push(1);
    
    // Calculate start and end page numbers
    let startPage = Math.max(2, currentPageValue - 1);
    let endPage = Math.min(totalPagesValue - 1, startPage + 2);
    
    // Adjust if at the beginning
    if (currentPageValue <= 3) {
      startPage = 2;
      endPage = 4;
    }
    
    // Adjust if at the end
    if (currentPageValue >= totalPagesValue - 2) {
      startPage = totalPagesValue - 3;
      endPage = totalPagesValue - 1;
    }
    
    // Add ellipsis after page 1 if needed
    if (startPage > 2) {
      buttons.push('...');
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPagesValue - 1) {
      buttons.push('...');
    }
    
    // Always show last page
    buttons.push(totalPagesValue);
  }
  
  return buttons;
})

// Format date function
const formatDate = (date) => {
  if (!date) return 'Không có dữ liệu';
  
  try {
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return date;
  }
}

// Open warning detail modal
const openWarningDetail = (warning) => {
  selectedWarning.value = warning;
}

// Fetch all warnings
const fetchWarnings = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get(API_URL);
    const processedWarnings = [];
    
    // Process the nested data structure
    response.data.forEach(item => {
      // Check if the item has predictions array
      if (item.predictions && Array.isArray(item.predictions)) {
        // For each prediction, create a warning entry
        item.predictions.forEach(prediction => {
          processedWarnings.push({
            id: `${item.airport_code}-${prediction.timestamp}`, // Create unique ID
            airport_code: item.airport_code,
            location_data: item.location_data,
            timestamp: prediction.timestamp,
            summary: prediction.summary,
            forecast: prediction.forecast,
            weather_code: prediction.weather_code,
            weather_info: prediction.weather_info
          });
        });
      } else if (item.Content) {
        // Handle old format data if it exists
        processedWarnings.push(item);
      }
    });
    
    warnings.value = processedWarnings;
    updateStatistics();
    // Reset to first page when data changes
    currentPage.value = 1;
  } catch (err) {
    error.value = 'Lỗi khi tải dữ liệu cảnh báo';
    console.error('Error fetching warnings:', err);
  } finally {
    isLoading.value = false;
  }
}

// Update statistics based on current warnings
const updateStatistics = () => {
  statistics.value = {
    high: warnings.value.filter(w => getWarningLevel(w) === 'high').length,
    medium: warnings.value.filter(w => getWarningLevel(w) === 'medium').length,
    low: warnings.value.filter(w => getWarningLevel(w) === 'low').length
  }
}

// Refresh data
const refreshData = async () => {
  await fetchWarnings();
}

// Initialize on component mount
onMounted(() => {
  fetchWarnings();
});
</script>

<style>
body {
  background-color: #f3f4f6;
}
</style>