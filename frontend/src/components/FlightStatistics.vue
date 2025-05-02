<template>
  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="text-lg font-semibold mb-4">Thống kê chuyến bay</h2>
    
    <div v-if="loading" class="flex justify-center items-center h-52">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="bg-blue-50 p-3 rounded-lg">
          <span class="text-sm text-gray-500">Tổng số chuyến</span>
          <div class="text-xl font-bold text-blue-700">{{ stats.totalFlights }}</div>
        </div>
        
        <div class="bg-green-50 p-3 rounded-lg">
          <span class="text-sm text-gray-500">Đúng giờ</span>
          <div class="text-xl font-bold text-green-700">{{ stats.onTime }}</div>
        </div>
        
        <div class="bg-yellow-50 p-3 rounded-lg">
          <span class="text-sm text-gray-500">Bị trễ</span>
          <div class="text-xl font-bold text-yellow-700">{{ stats.delayed }}</div>
        </div>
        
        <div class="bg-red-50 p-3 rounded-lg">
          <span class="text-sm text-gray-500">Đã hủy</span>
          <div class="text-xl font-bold text-red-700">{{ stats.cancelled }}</div>
        </div>
      </div>
      
      <div class="mt-4">
        <h3 class="text-md font-medium mb-2">Tỷ lệ lấp đầy</h3>
        <div class="w-full bg-gray-200 rounded-full h-4">
          <div 
            class="h-4 rounded-full bg-blue-600" 
            :style="{ width: `${stats.occupancyRate}%` }"
          ></div>
        </div>
        <div class="text-right mt-1 text-sm">{{ stats.occupancyRate }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})
</script>