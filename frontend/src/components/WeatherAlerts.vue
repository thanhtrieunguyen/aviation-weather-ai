<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold">Cảnh báo thời tiết</h2>
      
      <div class="flex space-x-1" v-if="alerts.length > 0">
        <button 
          @click="filterType = 'all'" 
          class="px-2 py-1 text-xs rounded" 
          :class="filterType === 'all' ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'"
        >
          Tất cả ({{alerts.length}})
        </button>
        <button 
          @click="filterType = 'high'" 
          class="px-2 py-1 text-xs rounded" 
          :class="filterType === 'high' ? 'bg-red-200' : 'bg-red-50 hover:bg-red-100'"
        >
          Cao ({{highAlerts}})
        </button>
        <button 
          @click="filterType = 'medium'" 
          class="px-2 py-1 text-xs rounded" 
          :class="filterType === 'medium' ? 'bg-yellow-200' : 'bg-yellow-50 hover:bg-yellow-100'"
        >
          TB ({{mediumAlerts}})
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="flex justify-center items-center h-40">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="alerts.length === 0" class="flex items-center justify-center h-40 bg-green-50 rounded-lg">
      <div class="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-green-700 text-sm">Không có cảnh báo thời tiết</p>
      </div>
    </div>
    
    <div v-else class="space-y-2 max-h-52 overflow-y-auto">
      <div 
        v-for="(alert, index) in filteredAlerts" 
        :key="index" 
        v-show="index < displayCount || showAll"
        class="p-2 rounded-lg cursor-pointer" 
        :class="{
          'bg-red-50': alert.level === 'high',
          'bg-yellow-50': alert.level === 'medium',
          'bg-blue-50': alert.level === 'low'
        }"
        @click="expandAlert(alert)"
      >
        <div class="flex items-start">
          <div class="mr-2 mt-0.5 flex-shrink-0">
            <svg v-if="alert.type === 'warning'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs truncate">{{ alert.message }}</p>
            <p class="text-xs mt-1 text-gray-500">{{ alert.time }}</p>
          </div>
        </div>
      </div>
      
      <div v-if="filteredAlerts.length > displayCount && !showAll" class="text-center pt-2">
        <button @click="showAll = true" class="text-blue-500 text-xs hover:underline">
          Xem thêm {{ filteredAlerts.length - displayCount }} cảnh báo
        </button>
      </div>
      <div v-else-if="showAll && filteredAlerts.length > displayCount" class="text-center pt-2">
        <button @click="showAll = false" class="text-blue-500 text-xs hover:underline">
          Thu gọn
        </button>
      </div>
    </div>
    
    <!-- Chi tiết cảnh báo khi click -->
    <div v-if="selectedAlert" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg max-w-md w-full max-h-80 overflow-y-auto">
        <div class="flex justify-between items-start mb-3">
          <h3 class="font-semibold">Chi tiết cảnh báo</h3>
          <button @click="selectedAlert = null" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <div :class="{
          'p-3 rounded-lg': true,
          'bg-red-50': selectedAlert.level === 'high',
          'bg-yellow-50': selectedAlert.level === 'medium',
          'bg-blue-50': selectedAlert.level === 'low'
        }">
          <p class="mb-2">{{ selectedAlert.message }}</p>
          <p class="text-sm text-gray-500">{{ selectedAlert.time }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, computed } from 'vue'

const props = defineProps({
  alerts: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Số lượng cảnh báo hiển thị mặc định
const displayCount = 3
const showAll = ref(false)
const selectedAlert = ref(null)
const filterType = ref('all')

// Số lượng cảnh báo theo mức độ
const highAlerts = computed(() => props.alerts.filter(a => a.level === 'high').length)
const mediumAlerts = computed(() => props.alerts.filter(a => a.level === 'medium').length)

// Lọc cảnh báo theo mức độ
const filteredAlerts = computed(() => {
  if (filterType.value === 'all') return props.alerts
  return props.alerts.filter(alert => alert.level === filterType.value)
})

// Mở chi tiết cảnh báo
const expandAlert = (alert) => {
  selectedAlert.value = alert
}
</script>