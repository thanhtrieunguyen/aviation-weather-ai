<template>
  <button 
    @click="toggleTheme" 
    class="p-2 text-gray-600 hover:text-gray-900"
  >
    <SunIcon v-if="isDark" class="w-6 h-6" />
    <MoonIcon v-else class="w-6 h-6" />
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline'

const isDark = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
}
</script>