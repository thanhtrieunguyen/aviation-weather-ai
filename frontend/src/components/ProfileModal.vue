<template>
  <div class="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg">
    <h1 class="text-2xl font-semibold text-gray-800 mb-6">Thông tin cá nhân</h1>
    <form @submit.prevent="updateProfile" class="space-y-6">
      <!-- Ảnh đại diện -->
      <div>
        <label for="avatar" class="block text-sm font-medium text-gray-700">Ảnh đại diện</label>
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          alt="Ảnh đại diện"
          class="mt-4 w-24 h-24 object-cover rounded-full border-2 border-gray-300"
        />
        <input
          type="file"
          id="avatar"
          @change="handleAvatarChange"
          class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Tên -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700">Tên</label>
        <input
          type="text"
          id="name"
          v-model="user.name"
          class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập tên của bạn"
        />
      </div>

      <!-- Email -->
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          id="email"
          v-model="user.email"
          class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập email của bạn"
        />
      </div>

      <!-- Số điện thoại -->
      <div>
        <label for="phone" class="block text-sm font-medium text-gray-700">Số điện thoại</label>
        <input
          type="text"
          id="phone"
          v-model="user.phone"
          class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập số điện thoại của bạn"
        />
      </div>

      <!-- Mã chứng chỉ -->
      <div>
        <label for="certificate" class="block text-sm font-medium text-gray-700">Mã chứng chỉ</label>
        <input
          type="text"
          id="certificate"
          v-model="user.certificate"
          class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập mã chứng chỉ của bạn"
        />
      </div>

      <!-- Tuổi -->
      <div>
        <label for="age" class="block text-sm font-medium text-gray-700">Tuổi</label>
        <input
          type="number"
          id="age"
          v-model="user.age"
          class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập tuổi của bạn"
        />
      </div>

      <!-- Giới tính -->
      <div>
        <label for="gender" class="block text-sm font-medium text-gray-700">Giới tính</label>
        <select
          id="gender"
          v-model="user.gender"
          class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
          <option value="other">Khác</option>
        </select>
      </div>

      <!-- Nút lưu -->
      <div class="flex justify-end mt-6">
        <button
          type="submit"
          class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
        >
          Lưu thay đổi
        </button>
      </div>
    </form>
    <div v-if="isUpdated" class="mt-4 text-green-600 font-medium">
      Thông tin đã được cập nhật thành công!
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const user = ref({
  name: "Nguyễn Văn A",
  email: "nguyenvana@example.com",
  phone: "0123456789",
  certificate: "",
  age: 25,
  gender: "male",
});

const avatarUrl = ref(null);
const isUpdated = ref(false);
const handleAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    avatarUrl.value = URL.createObjectURL(file);
  }
};
const updateProfile = () => {
  console.log("Cập nhật thông tin:", user.value);
  isUpdated.value = true;
  setTimeout(() => {
    isUpdated.value = false;
  }, 3000);
};
</script>
