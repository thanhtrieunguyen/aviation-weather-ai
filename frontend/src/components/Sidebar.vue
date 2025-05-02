<template>
  <aside class="w-64 bg-white border-r border-gray-200">
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center gap-2">
        <img src="../airplane.png" alt="Logo" class="w-20 h-20" />
        <a href="/"><h1 class="text-xl font-bold">Airport Management</h1></a>
        
      </div>
    </div>
    
    <nav class="p-4">
      <ul class="space-y-2">
        <li v-for="item in menuItems" :key="item.name">
          <router-link 
            :to="item.to"
            v-slot="{ isActive }"
          >
            <a 
              :class="[ 
                'flex items-center gap-3 px-4 py-2 rounded-lg',
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50' 
              ]"
            >
              <component :is="item.icon" class="w-5 h-5" />
              {{ item.name }}
            </a>
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="absolute bottom-0 w-64 p-4 border-t border-gray-200">
      <button @click="logout" class="flex items-center gap-2 text-gray-700 hover:text-gray-900">
        <ArrowLeftOnRectangleIcon class="w-5 h-5" />
        Logout
      </button>
    </div>
  </aside>
</template>

<script setup>
import {
  HomeIcon,
  CloudIcon,
  ExclamationCircleIcon,
  PaperAirplaneIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/vue/24/outline'

import { useRouter } from 'vue-router'

const menuItems = [
  { name: 'Dashboard Chính', icon: HomeIcon, to: '/' },
  { name: 'Quản lý Thời Tiết', icon: CloudIcon, to: '/weather' },
  { name: 'Cảnh Báo Chuyến Bay', icon: ExclamationCircleIcon, to: '/alerts' },
  { name: 'Cảnh Báo Thời Tiết', icon: ExclamationCircleIcon, to: '/alertsflights' },
  { name: 'Quản lý Chuyến bay', icon: PaperAirplaneIcon, to: '/flights' },
  { name: 'Phân tích & Báo cáo', icon: ChartBarIcon, to: '/reports' },
  { name: 'Quản lý Người dùng', icon: UserGroupIcon, to: '/users' },
]
const router = useRouter()

const logout = () => {
  localStorage.removeItem('userToken')
  router.push('/login')
}
</script>
