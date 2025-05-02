<template>
  <div class="flex h-screen bg-gray-100">
    <Sidebar />
    <div class="flex-1 overflow-auto">
      <Header />
      <router-view />
      <Bottom />
    </div>
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import Bottom from './components/Bottom.vue'
</script>