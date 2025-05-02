<template>
  <div class="relative" ref="menuContainer">
    <div
      class="cursor-pointer flex items-center space-x-2"
      @click="toggleMenu"
    >
      <UserIcon class="h-6 w-6 text-gray-700" />
    </div>
    <div
      v-if="openMenu"
      class="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg"
      ref="menu"
    >
      <ul class="py-2">
        <li
          @click="goToProfile"
          class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
        >
          Profile
        </li>
        <li class="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
        <li
          @click="logout"
          class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500"
        >
          Logout
        </li>
      </ul>
    </div>
    <ProfileModal v-if="isProfileOpen" @close="isProfileOpen = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from 'vue-router'; 
import { UserIcon } from "@heroicons/vue/24/outline";
import ProfileModal from "./ProfileModal.vue";

const router = useRouter(); 

const openMenu = ref(false);
const isProfileOpen = ref(false);
const menuContainer = ref(null);  
const goToProfile = () => {
  openMenu.value = false; 
  router.push('/profile'); 
};
const logout = () => {
  localStorage.removeItem('userToken');
  router.push('/login');
};
const toggleMenu = () => {
  openMenu.value = !openMenu.value;
};
const handleClickOutside = (event) => {
  if (menuContainer.value && !menuContainer.value.contains(event.target)) {
    openMenu.value = false;
  }
};
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
