<template>
    <header class="bg-white shadow-sm px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div class="flex items-center">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div class="flex items-center space-x-4">
        <NotificationBell />
        <ThemeToggle />
        <UserProfile />
      </div>
    </header>
  </template>
  
  <script setup>
  import { BellIcon, MoonIcon, UserIcon } from '@heroicons/vue/24/outline'
  import NotificationBell from './NotificationBell.vue'
  import ThemeToggle from './ThemeToggle.vue'
  import UserProfile from './UserProfile.vue'
  </script>
  