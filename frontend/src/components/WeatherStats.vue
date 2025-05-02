<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold">Điều kiện thời tiết</h2>
      <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
        Cập nhật tự động
      </span>
    </div>
    
    <div v-if="loading" class="flex justify-center items-center h-52">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else class="grid grid-cols-2 gap-4">
      <div class="flex flex-col bg-blue-50 p-3 rounded-lg">
        <span class="text-sm text-gray-500">Nhiệt độ</span>
        <transition name="fade" mode="out-in">
          <span :key="stats.temperature" class="text-xl font-bold text-blue-700">
            {{ stats.temperature }}°C
          </span>
        </transition>
      </div>
      
      <div class="flex flex-col bg-green-50 p-3 rounded-lg">
        <span class="text-sm text-gray-500">Độ ẩm</span>
        <transition name="fade" mode="out-in">
          <span :key="stats.humidity" class="text-xl font-bold text-green-700">
            {{ stats.humidity }}%
          </span>
        </transition>
      </div>
      
      <div class="flex flex-col bg-amber-50 p-3 rounded-lg">
        <span class="text-sm text-gray-500">Gió</span>
        <transition name="fade" mode="out-in">
          <span :key="stats.windSpeed" class="text-xl font-bold text-amber-700">
            {{ stats.windSpeed }} km/h
          </span>
        </transition>
      </div>
      
      <div class="flex flex-col bg-purple-50 p-3 rounded-lg">
        <span class="text-sm text-gray-500">Tầm nhìn</span>
        <transition name="fade" mode="out-in">
          <span :key="stats.visibility" class="text-xl font-bold text-purple-700">
            {{ stats.visibility }} km
          </span>
        </transition>
      </div>
      
      <div class="flex flex-col bg-rose-50 p-3 rounded-lg">
        <span class="text-sm text-gray-500">Áp suất</span>
        <transition name="fade" mode="out-in">
          <span :key="stats.pressure" class="text-xl font-bold text-rose-700">
            {{ stats.pressure }} hPa
          </span>
        </transition>
      </div>
      
      <div class="flex flex-col bg-cyan-50 p-3 rounded-lg">
        <span class="text-sm text-gray-500">Mây che phủ</span>
        <transition name="fade" mode="out-in">
          <span :key="stats.cloudCover" class="text-xl font-bold text-cyan-700">
            {{ stats.cloudCover }}%
          </span>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>