<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-200 to-blue-500">
    <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
      <h1 class="text-2xl font-bold text-center mb-6 text-blue-900">Hệ Thống Quản Lý Sân Bay</h1>

      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 text-gray-700">Tên đăng nhập</label>
          <input
            v-model="username"
            type="text"
            class="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500"
            placeholder="Nhập tên đăng nhập"
            required
          />
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 text-gray-700">Mật khẩu</label>
          <input
            v-model="password"
            type="password"
            class="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500"
            placeholder="Nhập mật khẩu"
            required
          />
        </div>

        <div class="flex items-center justify-between mb-6">
          <label class="flex items-center">
            <input type="checkbox" v-model="rememberMe" class="mr-2" />
            <span class="text-sm text-gray-700">Ghi nhớ đăng nhập</span>
          </label>
          <a href="#" class="text-sm text-blue-500 hover:underline">Quên mật khẩu?</a>
        </div>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-300"
        >
          Đăng nhập
        </button>
      </form>

      <p class="text-center mt-4 text-sm text-gray-600">
        Chưa có tài khoản? <a href="#" class="text-blue-500 hover:underline">Đăng ký ngay</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const router = useRouter()

const login = async () => {
  try {
    const response = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: username.value,
        password: password.value,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('userToken', data.token);
      alert(`Đăng nhập thành công!`);
      router.push('/');
    } else {
      alert(data.message || 'Tên đăng nhập hoặc mật khẩu không đúng!');
    }
  } catch (error) {
    console.error('Lỗi server:', error);
    alert('Có lỗi xảy ra, vui lòng thử lại!');
  }
};


function handleLogin() {
  if (username.value && password.value) {
    login()
  } else {
    alert('Vui lòng nhập đầy đủ thông tin đăng nhập') 
  }
}
</script>

<style>
body {
  font-family: Arial, sans-serif;
}
</style>
