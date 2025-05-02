<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-bold">Hệ thống Cảnh báo Chuyến bay</h1>
      <div class="flex gap-2">
        <button 
          @click="showCreateDialog = true"
          class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Thêm cảnh báo
        </button>
        <button 
          @click="refreshData" 
          :disabled="isLoading"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {{ isLoading ? 'Đang làm mới...' : 'Làm mới dữ liệu' }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            placeholder="Tìm kiếm cảnh báo..."
            class="w-full border rounded px-3 py-2"
          />
          <select 
            v-model="filters.level" 
            class="w-full border rounded px-3 py-2"
          >
            <option value="">Mức độ</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>
          <select 
            v-model="filters.status" 
            class="w-full border rounded px-3 py-2"
          >
            <option value="">Trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="processing">Đang xử lý</option>
            <option value="resolved">Đã xử lý</option>
          </select>
        </div>
      </div>

      <!-- Cài đặt ngưỡng -->
      <div class="bg-white rounded p-4">
        <h2 class="font-semibold mb-3">Cài đặt ngưỡng</h2>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span>Nhiệt độ tối đa</span>
            <input
              v-model="thresholds.maxTemp"
              type="Number_Flight"
              class="border rounded w-20 px-2 py-1 text-right"
              placeholder="35"
            />
          </div>
          <div class="flex justify-between items-center">
            <span>Độ ẩm tối đa</span>
            <input
              v-model="thresholds.maxHumidity"
              type="Number_Flight"
              class="border rounded w-20 px-2 py-1 text-right"
              placeholder="80"
            />
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

      <table v-else class="w-full">
        <thead>
          <tr class="bg-gray-50">
            <th class="border p-2 text-left">Số hiệu</th> 
            
            <th class="border p-2 text-left">Thời gian</th>
            <th class="border p-2 text-left">Nội dung</th>
            <th class="border p-2 text-left">Mức độ</th>
            <th class="border p-2 text-left">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="alert in filteredAlerts" :key="alert._id">
            <td class="border p-2">{{ alert.Number_Flight }}</td> 
            
            <td class="border p-2">{{ formatDate(alert.time) }}</td>
            <td class="border p-2">{{ alert.content }}</td>
            <td class="border p-2">
              <span :class="{
                'text-red-600': alert.level === 'high',
                'text-yellow-600': alert.level === 'medium',
                'text-blue-600': alert.level === 'low'
              }">
                {{ 
                  alert.level === 'high' ? 'Cao' : 
                  alert.level === 'medium' ? 'Trung bình' : 'Thấp' 
                }}
              </span>
            </td>
            <td class="border p-2">
              <select 
                v-model="alert.status"
                class="border rounded px-2 py-1 w-full"
                @change="updateAlertStatus(alert._id, alert.status)"
              >
                <option value="pending">Chờ xử lý</option>
                <option value="processing">Đang xử lý</option>
                <option value="resolved">Đã xử lý</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>


    </div>

    <!-- Modal thêm cảnh báo mới -->
    <div v-if="showCreateDialog" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen">
        <div class="fixed inset-0 bg-black opacity-30"></div>
        <div class="relative bg-white rounded-lg w-full max-w-md p-6">
          <h3 class="text-lg font-semibold mb-4">Thêm cảnh báo mới</h3>
          
          <form @submit.prevent="handleCreateAlert" class="space-y-4">
            <div>
              <label class="block mb-1">Số hiệu</label>
              <input 
                v-model="newAlert.Number_Flight"
                type="text"
                class="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label class="block mb-1">Nội dung cảnh báo</label>
              <input 
                v-model="newAlert.content"
                type="text"
                class="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label class="block mb-1">Mức độ</label>
              <select 
                v-model="newAlert.level"
                class="w-full border rounded px-3 py-2"
                required
              >
                <option value="high">Cao</option>
                <option value="medium">Trung bình</option>
                <option value="low">Thấp</option>
              </select>
            </div>

           

            <div class="flex justify-end gap-2 mt-6">
              <button
                type="button"
                @click="showCreateDialog = false"
                class="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? 'Đang lưu...' : 'Lưu' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:5000/alerts'

const isLoading = ref(false)
const isSubmitting = ref(false)
const showCreateDialog = ref(false)
const alerts = ref([])
const error = ref(null)

const statistics = ref({
  high: 0,
  medium: 5,
  low: 6
})

const filters = ref({
  search: '',
  level: '',
  status: ''
})

const thresholds = ref({
  maxTemp: 35,
  maxHumidity: 80
})

const newAlert = ref({
  content: '',
  level: 'medium',
  Number_Flight: ''
})

// Computed property for filtered alerts
const filteredAlerts = computed(() => {
  return alerts.value.filter(alert => {
    const matchSearch = alert.content.toLowerCase().includes(filters.value.search.toLowerCase())
    const matchLevel = !filters.value.level || alert.level === filters.value.level
    const matchStatus = !filters.value.status || alert.status === filters.value.status
    return matchSearch && matchLevel && matchStatus
  })
})

// Format date function
const formatDate = (date) => {
  return new Date(date).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Fetch all alerts
const fetchAlerts = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(API_URL)
    alerts.value = response.data
    updateStatistics()
  } catch (err) {
    error.value = 'Lỗi khi tải dữ liệu cảnh báo'
    console.error('Error fetching alerts:', err)
  } finally {
    isLoading.value = false
  }
}

// Update statistics based on current alerts
const updateStatistics = () => {
  statistics.value = {
    high: alerts.value.filter(a => a.level === 'high').length,
    medium: alerts.value.filter(a => a.level === 'medium').length,
    low: alerts.value.filter(a => a.level === 'low').length
  }
}

// Update alert status
const updateAlertStatus = async (alertId, newStatus) => {
  try {
    await axios.put(`${API_URL}/${alertId}`, {
      status: newStatus
    })
    await fetchAlerts()
  } catch (err) {
    error.value = 'Lỗi khi cập nhật trạng thái'
    console.error('Error updating alert status:', err)
  }
}

// Handle create new alert
const handleCreateAlert = async () => {
  isSubmitting.value = true
  try {
    // Log dữ liệu trước khi gửi
    const alertData = {
      content: newAlert.value.content,
      Number_Flight: newAlert.value.Number_Flight,
      level: newAlert.value.level,
      status: 'pending',
      time: new Date().toISOString()
    }
    console.log('Sending alert data:', alertData);

    const response = await axios.post(API_URL, alertData);
    console.log('Server response:', response.data);

    await fetchAlerts();
    showCreateDialog.value = false;
    resetNewAlert();
  } catch (err) {
    console.error('Error details:', {
      message: err.message,
      response: err.response?.data,
      data: err.response?.config?.data
    });
    error.value = `Lỗi khi tạo cảnh báo: ${err.response?.data?.message || err.message}`;
  } finally {
    isSubmitting.value = false;
  }
};

// Reset new alert form
const resetNewAlert = () => {
  newAlert.value = {
    content: '',
    level: 'medium',
    Number_Flight: ''
  }
}

// Refresh data
const refreshData = async () => {
  await fetchAlerts()
}

// Initialize on component mount
onMounted(() => {
  fetchAlerts()
})
</script>

<style>
body {
  background-color: #f3f4f6;
}
</style>