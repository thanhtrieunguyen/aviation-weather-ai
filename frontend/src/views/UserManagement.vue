<template>
  <div class="p-6 flex">
    <div class="flex-grow mr-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Quản lý Người dùng</h1>
        <button
          @click="openAddUserModal"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Thêm người dùng
        </button>
      </div>

      <!-- Loading Indicator -->
      <div v-if="loading" class="text-center py-4">
        <span class="text-gray-600">Đang tải...</span>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {{ error }}
      </div>

      <div v-else class="bg-white rounded shadow">
        <table class="w-full">
          <thead class="bg-gray-100">
            <tr>
              <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Tên người dùng</th>
              <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Email</th>
              <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Vai trò</th>
              <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Trạng thái</th>
              <th class="py-3 px-4 text-left text-sm font-medium text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user._id" class="border-t border-gray-200">
              <td class="py-3 px-4">{{ user.name }}</td>
              <td class="py-3 px-4">{{ user.email }}</td>
              <td class="py-3 px-4">{{ user.role }}</td>
              <td class="py-3 px-4">
                <button 
                  @click="toggleUserStatus(user)"
                  :class="[
                    'px-2 py-1 rounded text-sm',
                    user.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ user.status === 'active' ? 'Hoạt động' : 'Không hoạt động' }}
                </button>
              </td>
              <td class="py-3 px-4">
                <button @click="editUser(user)" class="text-blue-600 hover:text-blue-800 mr-2">Sửa</button>
                <button @click="confirmDelete(user)" class="text-red-600 hover:text-red-800">Xóa</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- User Form Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div class="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">
          {{ editingUser ? 'Sửa người dùng' : 'Thêm người dùng mới' }}
        </h2>
        <form @submit.prevent="saveUser">
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Tên người dùng</label>
            <input
              v-model="userForm.name"
              type="text"
              class="w-full p-2 border rounded"
              required
            />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
              v-model="userForm.email"
              type="email"
              class="w-full p-2 border rounded"
              required
            />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Mật khẩu</label>
            <input
              v-model="userForm.password"
              type="password"
              class="w-full p-2 border rounded"
              :required="!editingUser"
            />
          </div>
          <div class="mb-4">
            <label class="block text-gray-700 text-sm font-bold mb-2">Vai trò</label>
            <select v-model="userForm.role" class="w-full p-2 border rounded">
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              @click="showModal = false"
              class="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {{ editingUser ? 'Cập nhật' : 'Thêm' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const API_URL = 'http://localhost:5000/users';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

const users = ref<User[]>([]);
const userForm = ref({ name: '', email: '', password: '', role: 'User', status: 'active' });
const editingUser = ref<User | null>(null);
const showModal = ref(false);
const loading = ref(false);
const error = ref('');

const fetchUsers = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await axios.get(API_URL);
    users.value = response.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Lỗi khi lấy danh sách người dùng';
  } finally {
    loading.value = false;
  }
};

const openAddUserModal = () => {
  editingUser.value = null;
  userForm.value = { name: '', email: '', password: '', role: 'User', status: 'active' };
  showModal.value = true;
};

const editUser = (user: User) => {
  editingUser.value = user;
  userForm.value = {
    name: user.name,
    email: user.email,
    password: '', // Không load password cũ
    role: user.role,
    status: user.status
  };
  showModal.value = true;
};

const saveUser = async () => {
  if (!userForm.value.email || userForm.value.email.trim() === '') {
    error.value = 'Email không được để trống';
    return;
  }
  
  loading.value = true;
  try {
    if (editingUser.value) {
      await axios.put(`${API_URL}/${editingUser.value._id}`, userForm.value);
    } else {
      await axios.post(API_URL, userForm.value);
    }
    await fetchUsers();
    showModal.value = false;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Lỗi khi lưu người dùng';
  } finally {
    loading.value = false;
  }
};

const confirmDelete = async (user: User) => {
  if (confirm(`Bạn có chắc muốn xóa người dùng ${user.name}?`)) {
    loading.value = true;
    try {
      await axios.delete(`${API_URL}/${user._id}`);
      await fetchUsers();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Lỗi khi xóa người dùng';
    } finally {
      loading.value = false;
    }
  }
};

const toggleUserStatus = async (user: User) => {
  loading.value = true;
  try {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await axios.patch(`${API_URL}/${user._id}/status`, { status: newStatus });
    await fetchUsers();
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Lỗi khi cập nhật trạng thái người dùng';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchUsers);
</script>