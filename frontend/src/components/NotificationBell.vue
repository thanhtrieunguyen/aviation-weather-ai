<template>
  <div class="relative">
    <button 
      @click="toggleNotifications" 
      class="relative p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 rounded-full hover:bg-gray-100"
    >
      <BellIcon class="w-6 h-6" />
      <span 
        v-if="unreadCount > 0" 
        class="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 border-2 border-white text-xs text-white flex items-center justify-center"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>
    <transition 
      enter-active-class="transition ease-out duration-200" 
      enter-from-class="opacity-0 scale-95" 
      enter-to-class="opacity-100 scale-100" 
      leave-active-class="transition ease-in duration-150" 
      leave-from-class="opacity-100 scale-100" 
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-if="isOpen" 
        class="absolute right-0 mt-2 w-96 bg-white shadow-xl rounded-lg overflow-hidden z-50 border border-gray-200"
      >
        <div class="bg-gray-50 p-3 flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <BellIcon class="w-5 h-5 text-gray-500" />
            <span class="font-semibold text-gray-800">Thông báo</span>
            <span 
              v-if="unreadCount > 0" 
              class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full"
            >
              {{ unreadCount }}
            </span>
          </div>
          <button 
            v-if="unreadCount > 0" 
            @click="markAllAsRead" 
            class="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            Đánh dấu đã đọc
          </button>
        </div>
        <div v-if="notifications.length === 0" class="py-8 px-4 text-center">
          <div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <BellIcon class="w-8 h-8 text-gray-400" />
          </div>
          <p class="text-gray-500 mb-1">Không có thông báo mới</p>
          <p class="text-gray-400 text-sm">Thông báo sẽ xuất hiện tại đây</p>
        </div>
        <div v-else class="max-h-96 overflow-y-auto">
          <ul>
            <li 
              v-for="(notification, index) in notifications" 
              :key="index" 
              class="border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
              :class="{ 'bg-gray-50': notification.read }"
              @click="openDetail(notification)"
            >
              <div class="p-3 relative">
                <div 
                  v-if="!notification.read" 
                  class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"
                ></div>
                
                <div class="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                  <span class="flex items-center">
                    <span class="mr-1">✈️</span>
                    {{ notification.flightNumber }}
                  </span>
                </div>
                <div class="flex justify-between items-center mb-1">
                  <div class="flex items-center space-x-2">
                    <span 
                      :class="getSeverityClass(notification.severity)" 
                      class="inline-flex items-center justify-center w-6 h-6 rounded-full"
                    >
                      <span class="text-xs">⚠️</span>
                    </span>
                    <span 
                      class="font-medium text-sm"
                      :class="notification.read ? 'text-gray-600' : 'text-gray-800 font-semibold'"
                    >
                      {{ notification.title }}
                    </span>
                  </div>
                  <span 
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="{
                      'bg-blue-100 text-blue-800': notification.status === 'Đang xử lý',
                      'bg-green-100 text-green-800': notification.status === 'Đã xử lý',
                      'bg-red-100 text-red-800': notification.status === 'Lỗi',
                      'bg-gray-100 text-gray-800': !['Đang xử lý', 'Đã xử lý', 'Lỗi'].includes(notification.status)
                    }"
                  >
                    {{ notification.status }}
                  </span>
                </div>
                <div class="text-xs text-gray-400">
                  {{ formatTime(notification.timestamp) }}
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </transition>
    <transition 
      enter-active-class="transition ease-out duration-300" 
      enter-from-class="opacity-0 translate-y-4" 
      enter-to-class="opacity-100 translate-y-0" 
      leave-active-class="transition ease-in duration-200" 
      leave-from-class="opacity-100 translate-y-0" 
      leave-to-class="opacity-0 translate-y-4"
    >
      <div v-if="selectedNotification" class="fixed inset-0 overflow-y-auto flex items-center justify-center z-[9999]">
        <div class="fixed inset-0 bg-black bg-opacity-40 transition-opacity" @click="closeDetail"></div>
        <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto transform transition-all">
          <div class="flex items-center justify-between p-4 border-b">
            <div class="flex items-center space-x-2">
              <div 
                :class="getSeverityClass(selectedNotification.severity)"
                class="w-8 h-8 rounded-full flex items-center justify-center"
              >
                <span>⚠️</span>
              </div>
              <h2 class="text-lg font-semibold text-gray-800">Chi tiết thông báo</h2>
              <span 
                v-if="selectedNotification.read" 
                class="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full"
              >
                Đã đọc
              </span>
            </div>
            <button @click="closeDetail" class="p-1 rounded-full hover:bg-gray-100">
              <span class="text-xl leading-none text-gray-500">&times;</span>
            </button>
          </div>
          <div class="p-5">
            <div class="mb-4 pb-4 border-b border-gray-100">
              <h3 class="text-xl font-medium text-gray-800 mb-2">{{ selectedNotification.title }}</h3>
              <div 
                class="inline-block px-2 py-1 mb-2 rounded-md text-sm font-medium"
                :class="{
                  'bg-blue-100 text-blue-800': selectedNotification.status === 'Đang xử lý',
                  'bg-green-100 text-green-800': selectedNotification.status === 'Đã xử lý',
                  'bg-red-100 text-red-800': selectedNotification.status === 'Lỗi',
                  'bg-gray-100 text-gray-800': !['Đang xử lý', 'Đã xử lý', 'Lỗi'].includes(selectedNotification.status)
                }"
              >
                {{ selectedNotification.status }}
              </div>
              <p class="text-gray-600 mt-2">{{ selectedNotification.description }}</p>
            </div>
            <div class="space-y-3">
              <div class="flex">
                <div class="w-1/3 text-gray-500">Chuyến bay</div>
                <div class="w-2/3 font-medium">
                  <span class="inline-block mr-1">✈️</span>
                  {{ selectedNotification.flightNumber }}
                </div>
              </div>
              
              <div class="flex">
                <div class="w-1/3 text-gray-500">Tiêu đề</div>
                <div class="w-2/3 font-medium">{{ selectedNotification.title }}</div>
              </div>
              
              <div class="flex">
                <div class="w-1/3 text-gray-500">Mức độ</div>
                <div class="w-2/3">
                  <span 
                    class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-red-100 text-red-800': selectedNotification.severity.toLowerCase() === 'high',
                      'bg-yellow-100 text-yellow-800': selectedNotification.severity.toLowerCase() === 'medium',
                      'bg-green-100 text-green-800': selectedNotification.severity.toLowerCase() === 'low',
                      'bg-gray-100 text-gray-800': !['high', 'medium', 'low'].includes(selectedNotification.severity.toLowerCase())
                    }"
                  >
                    {{ selectedNotification.severity.toUpperCase() }}
                  </span>
                </div>
              </div>
              
              <div class="flex">
                <div class="w-1/3 text-gray-500">Người phụ trách</div>
                <div class="w-2/3 font-medium flex items-center">
                  <span class="inline-block mr-1"></span>
                  {{ selectedNotification.assignee || 'Chưa phân công' }}
                </div>
              </div>
              
              <div class="flex">
                <div class="w-1/3 text-gray-500">Thời gian</div>
                <div class="w-2/3 font-medium flex items-center">
                  <span class="inline-block mr-1"></span>
                  {{ formatTime(selectedNotification.timestamp) }}
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 p-4 flex justify-end space-x-3 rounded-b-lg">
            <button 
              v-if="selectedNotification.status !== 'Đã xử lý'"
              @click="markAsResolved"
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Xử lý
            </button>
            <button 
              @click="toggleReadStatus"
              class="px-4 py-2 border rounded-md hover:bg-gray-100 transition-colors"
              :class="selectedNotification.read ? 'border-gray-300 text-gray-700' : 'border-blue-300 text-blue-700'"
            >
              {{ selectedNotification.read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc' }}
            </button>
            
            <button 
              @click="closeDetail" 
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { BellIcon } from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'

const isOpen = ref(false)
const notifications = ref([])
const selectedNotification = ref(null)
const unreadCount = computed(() => {
  return notifications.value.filter(notification => !notification.read).length
})

const toggleNotifications = () => {
  isOpen.value = !isOpen.value
}

const markAllAsRead = async () => {
  try {
    notifications.value = notifications.value.map(notification => ({
      ...notification,
      read: true
    }))
    const unreadNotifications = notifications.value.filter(n => !n.read && (n._id || n.id))
    for (const notification of unreadNotifications) {
      const notificationId = notification._id || notification.id
      await axios.put(`http://192.168.2.11:5000/incidents/${notificationId}`, {
        read: true
      })
    }
    
    isOpen.value = false
  } catch (error) {
    console.error('Lỗi khi đánh dấu tất cả là đã đọc:', error)
    alert('Có lỗi xảy ra khi cập nhật trạng thái đã đọc')
  }
}

const openDetail = async (notification) => {
  selectedNotification.value = notification
  isOpen.value = false
  if (!notification.read) {
    try {
      notification.read = true
      notifications.value = notifications.value.map(item => {
        if ((item._id === notification._id) || (item.id === notification.id)) {
          return {...item, read: true}
        }
        return item
      })

      const notificationId = notification._id || notification.id
      if (notificationId) {
        await axios.put(`http://192.168.2.11:5000/incidents/${notificationId}`, {
          read: true
        })
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc:', error)
    }
  }
}

const toggleReadStatus = async () => {
  if (!selectedNotification.value) return
  
  try {
    const notificationId = selectedNotification.value._id || selectedNotification.value.id
    const newReadStatus = !selectedNotification.value.read
    
    if (!notificationId) {
      console.error('Không tìm thấy ID cho thông báo')
      return
    }
    selectedNotification.value.read = newReadStatus
    
    notifications.value = notifications.value.map(notification => {
      if ((notification._id === notificationId) || (notification.id === notificationId)) {
        return {...notification, read: newReadStatus}
      }
      return notification
    })
    await axios.put(`http://192.168.2.11:5000/incidents/${notificationId}`, {
      read: newReadStatus
    })
    
    console.log(`Đã chuyển trạng thái đọc thành: ${newReadStatus ? 'Đã đọc' : 'Chưa đọc'}`)
  } catch (error) {
    console.error('Lỗi khi chuyển đổi trạng thái đọc:', error)
    alert('Có lỗi xảy ra khi cập nhật trạng thái đọc')
    if (selectedNotification.value) {
      selectedNotification.value.read = !selectedNotification.value.read
    }
  }
}

const closeDetail = () => {
  selectedNotification.value = null
}

const markAsResolved = async () => {
  if (!selectedNotification.value) return

  try {
    const notificationId = selectedNotification.value._id || selectedNotification.value.id
    
    if (!notificationId) {
      console.error('Không tìm thấy ID cho thông báo')
      alert('Lỗi: Thông báo không có ID hợp lệ')
      return
    }
    
    console.log('Cập nhật trạng thái cho thông báo ID:', notificationId)
    const response = await axios.put(`http://192.168.2.11:5000/incidents/${notificationId}`, {
      status: 'Đã xử lý'
    })

    if (response.data && response.data.success) {
      selectedNotification.value.status = 'Đã xử lý'
      notifications.value = notifications.value.map(notification => {
        if ((notification._id === notificationId) || (notification.id === notificationId)) {
          return {...notification, status: 'Đã xử lý'}
        }
        return notification
      })
      
      closeDetail()
    } else {
      alert('Cập nhật không thành công: ' + (response.data?.error || 'Lỗi không xác định'))
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái:', error)
    alert(`Lỗi cập nhật: ${error.response?.data?.error || error.message}`)
  }
}

const formatTime = (time) => {
  return time ? dayjs(time).format('HH:mm DD/MM/YYYY') : 'Không có dữ liệu'
}

const getSeverityClass = (severity) => {
  if (!severity) return 'bg-gray-100 text-gray-600'
  
  switch (severity.toLowerCase()) {
    case 'high': return 'bg-red-100 text-red-600'
    case 'medium': return 'bg-yellow-100 text-yellow-600'
    case 'low': return 'bg-green-100 text-green-600'
    case 'critical': return 'bg-purple-100 text-purple-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

const fetchIncidents = async () => {
  try {
    const response = await axios.get('http://192.168.2.11:5000/incidents')
    
    if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      const now = dayjs()
      notifications.value = response.data.data
        .filter(incident => {
          const incidentTime = dayjs(incident.timestamp || incident.createdAt)
          const hoursDiff = now.diff(incidentTime, 'hour')
          return hoursDiff < 12
        })
        .map(incident => ({
          id: incident._id,
          _id: incident._id,
          flightNumber: incident.flightNumber,
          title: incident.title,
          description: incident.description,
          severity: incident.severity,
          status: incident.status,
          timestamp: incident.timestamp || incident.createdAt,
          assignee: incident.assignee,
          read: incident.read || false
        }))
      notifications.value.sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1
        return new Date(b.timestamp) - new Date(a.timestamp)
      })
    } else {
      notifications.value = []
    }
  } catch (error) {
    console.error('Lỗi khi tải thông báo:', error)
    notifications.value = [{       
      id: 'error-notification',      
      flightNumber: "N/A",       
      title: "Lỗi kết nối",       
      description: "Không thể tải dữ liệu thông báo!",       
      severity: "high",       
      status: "Lỗi",      
      timestamp: new Date().toISOString(),      
      assignee: "Không có",      
      read: false    }]
  }
}

onMounted(fetchIncidents)
</script>