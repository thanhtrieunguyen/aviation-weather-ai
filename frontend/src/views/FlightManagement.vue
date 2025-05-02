<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Quản lý Chuyến bay</h1>
      <button
        @click="showAddFlightForm = true"
        class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
      >
        Thêm chuyến bay
      </button>
      <button 
        @click="adjustPricesForWeather"
        class="ml-4 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition duration-200"
      >
        Điều chỉnh giá theo thời tiết
      </button>
    </div>

    <!-- Form thêm chuyến bay -->
    <div
      v-if="showAddFlightForm"
      class="bg-white p-6 rounded-lg shadow-md mb-6 transform transition-all duration-300"
    >
      <h2 class="text-xl font-semibold mb-4">Thêm chuyến bay mới</h2>
      <form @submit.prevent="addFlight">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block font-medium">Mã chuyến bay</label>
            <input
              v-model="newFlight.Number_Flight"
              type="text"
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>
          <div>
            <label class="block font-medium">Email Phi Công</label>
            <input
              v-model="newFlight.Pilot_email"
              type="email"
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>
          <div>
            <label class="block font-medium">Hãng</label>
            <input
              v-model="newFlight.Plane"
              type="text"
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>
          <div>
            <label class="block font-medium">Điểm đi</label>
            <select
              v-model="newFlight.From"
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
              required
            >
              <option value="" disabled>Chọn sân bay</option>
              <option v-for="airport in airports" :key="airport.code" :value="airport.code">
                {{ airport.fullName }} ({{ airport.code }})
              </option>
            </select>
          </div>
          <div>
            <label class="block font-medium">Quá cảnh</label>
            <select
              v-model="newFlight.Transit"
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Không quá cảnh</option>
              <option v-for="airport in airports" :key="airport.code" :value="airport.code">
                {{ airport.fullName }} ({{ airport.code }})
              </option>
            </select>
          </div>
          <div>
            <label class="block font-medium">Điểm đến</label>
            <select
              v-model="newFlight.To"
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
              required
            >
              <option value="" disabled>Chọn sân bay</option>
              <option v-for="airport in airports" :key="airport.code" :value="airport.code">
                {{ airport.fullName }} ({{ airport.code }})
              </option>
            </select>
          </div>
          <div>
            <label class="block font-medium">Thời gian khởi hành</label>
            <input
              v-model="newFlight.Time_depart"
              type="datetime-local"
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>
          <div>
            <label class="block font-medium">Thời gian hạ cánh</label>
            <input
              v-model="newFlight.Time_landing"
              type="datetime-local"
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>
          <div>
            <label class="block font-medium">Cổng khởi hành</label>
            <input
              v-model="newFlight.Gate_depart"
              type="text"
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>
          <div>
            <label class="block font-medium">Giá ban đầu (VNĐ)</label>
            <input
              v-model="newFlight.Initial_price"
              type="number"
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>
          <div>
            <label class="block font-medium">Giá hiện tại (VNĐ)</label>
            <input
              v-model="newFlight.Current_price"
              type="number"
              class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-4">
          <button
            type="button"
            @click="showAddFlightForm = false"
            class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
          >
            Thêm
          </button>
        </div>
      </form>
    </div>

    <!-- Modal chỉnh sửa -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showEditModal = false"
    >
      <div
        class="bg-white p-6 rounded-lg shadow-md w-full max-w-md transform transition-all duration-300"
      >
        <h2 class="text-xl font-semibold mb-4">Chỉnh sửa chuyến bay</h2>
        <form @submit.prevent="saveChanges">
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="block font-medium">Mã chuyến bay</label>
              <input
                v-model="editedFlight.Number_Flight"
                type="text"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <label class="block font-medium">Email Phi Công</label>
              <input
                v-model="editedFlight.Pilot_email"
                type="email"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <label class="block font-medium">Loại máy bay</label>
              <input
                v-model="editedFlight.Plane"
                type="text"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <label class="block font-medium">Điểm đi</label>
              <select
                v-model="editedFlight.From"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
                required
              >
                <option value="" disabled>Chọn sân bay</option>
                <option v-for="airport in airports" :key="airport.code" :value="airport.code">
                  {{ airport.fullName }} ({{ airport.code }})
                </option>
              </select>
            </div>
            <div>
              <label class="block font-medium">Quá cảnh</label>
              <select
                v-model="editedFlight.Transit"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Không quá cảnh</option>
                <option v-for="airport in airports" :key="airport.code" :value="airport.code">
                  {{ airport.fullName }} ({{ airport.code }})
                </option>
              </select>
            </div>
            <div>
              <label class="block font-medium">Điểm đến</label>
              <select
                v-model="editedFlight.To"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
                required
              >
                <option value="" disabled>Chọn sân bay</option>
                <option v-for="airport in airports" :key="airport.code" :value="airport.code">
                  {{ airport.fullName }} ({{ airport.code }})
                </option>
              </select>
            </div>
            <div>
              <label class="block font-medium">Thời gian khởi hành</label>
              <input
                v-model="editedFlight.Time_depart"
                type="datetime-local"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <label class="block font-medium">Thời gian hạ cánh</label>
              <input
                v-model="editedFlight.Time_landing"
                type="datetime-local"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <label class="block font-medium">Cổng khởi hành</label>
              <input
                v-model="editedFlight.Gate_depart"
                type="text"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <label class="block font-medium">Trạng thái</label>
              <select
                v-model="editedFlight.Status"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
              >
                <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
              </select>
            </div>
            <div>
              <label class="block font-medium">Giá ban đầu (VNĐ)</label>
              <input
                v-model="editedFlight.Initial_price"
                type="number"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
            <div>
              <label class="block font-medium">Giá hiện tại (VNĐ)</label>
              <input
                v-model="editedFlight.Current_price"
                type="number"
                class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300"
                required
              />
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-4">
            <button
              type="button"
              @click="showEditModal = false"
              class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Bảng danh sách chuyến bay -->
    <div class="overflow-x-auto bg-white rounded-lg shadow-md">
      <table class="min-w-full table-auto border-collapse">
        <thead>
          <tr class="bg-gray-100">
            <th class="px-6 py-3 text-left font-semibold">Mã Chuyến Bay</th>
            <th class="px-6 py-3 text-left font-semibold">Email Phi Công</th>
            <th class="px-6 py-3 text-left font-semibold">Máy Bay</th>
            <th class="px-6 py-3 text-left font-semibold">Điểm Đi</th>
            <th class="px-6 py-3 text-left font-semibold">Quá Cảnh</th>
            <th class="px-6 py-3 text-left font-semibold">Điểm Đến</th>
            <th class="px-6 py-3 text-left font-semibold">Khởi Hành</th>
            <th class="px-6 py-3 text-left font-semibold">Hạ Cánh</th>
            <th class="px-6 py-3 text-left font-semibold">Cổng</th>
            <th class="px-6 py-3 text-left font-semibold">Trạng thái</th>
            <th class="px-6 py-3 text-left font-semibold">Giá ban đầu</th>
            <th class="px-6 py-3 text-left font-semibold">Giá hiện tại</th>
            <th class="px-6 py-3 text-left font-semibold">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(flight, index) in flights" :key="index" class="odd:bg-white even:bg-gray-50">
            <td class="px-6 py-3">{{ flight.Number_Flight }}</td>
            <td class="px-6 py-3">{{ flight.Pilot_email || '—' }}</td>
            <td class="px-6 py-3">{{ flight.Plane }}</td>
            <td class="px-6 py-3">{{ getAirportName(flight.From) }}</td>
            <td class="px-6 py-3">{{ flight.Transit ? getAirportName(flight.Transit) : '—' }}</td>
            <td class="px-6 py-3">{{ getAirportName(flight.To) }}</td>
            <td class="px-6 py-3">{{ formatDateTime(flight.Time_depart) }}</td>
            <td class="px-6 py-3">{{ formatDateTime(flight.Time_landing) }}</td>
            <td class="px-6 py-3">{{ flight.Gate_depart }}</td>
            <td class="px-6 py-3">{{ flight.Status }}</td>
            <td class="px-6 py-3">{{ formatCurrency(flight.Initial_price) }}</td>
            <td class="px-6 py-3">{{ formatCurrency(flight.Current_price) }}</td>
            <td class="px-6 py-3">
              <button
                @click="editFlight(flight)"
                class="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600 transition duration-200"
              >
                Sửa
              </button>
              <button
                @click="deleteFlight(flight._id)"
                class="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition duration-200"
              >
                Xóa
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { format } from 'date-fns';
import vi from 'date-fns/locale/vi';
import Swal from 'sweetalert2';

const flights = ref([]);
const showAddFlightForm = ref(false);
const showEditModal = ref(false);
const newFlight = ref({
  Number_Flight: '',
  Plane: '',
  From: '',
  Transit: '',
  To: '',
  Time_depart: '',
  Time_landing: '',
  Gate_depart: '',
  Status: 'Đúng giờ',
  Pilot_email: '',
  Initial_price: 1000000,
  Current_price: 1000000
});
const editedFlight = ref({ ...newFlight.value });
const statusOptions = ['Đúng giờ', 'Bị trễ', 'Đã cất cánh', 'Đã hạ cánh', 'Đã hủy', 'Chuyển hướng'];

const airports = ref([
{ code: 'HAN', name: 'Hà Nội', fullName: 'Sân bay Quốc tế Nội Bài' },
    { code: 'SGN', name: 'Hồ Chí Minh', fullName: 'Sân bay Quốc tế Tân Sơn Nhất' },
    { code: 'DND', name: 'Đà Nẵng', fullName: 'Sân bay Quốc tế Đà Nẵng' },
    { code: 'HPH', name: 'Hải Phòng', fullName: 'Sân bay Quốc tế Cát Bi' },
    { code: 'CMH', name: 'Cà Mau', fullName: 'Sân bay Cà Mau' },
    { code: 'DLI', name: 'Đà Lạt', fullName: 'Sân bay Liên Khương' },
    { code: 'CXR', name: 'Nha Trang', fullName: 'Sân bay Cam Ranh' },
    { code: 'PQC', name: 'Phú Quốc', fullName: 'Sân bay Phú Quốc' },
    { code: 'HUE', name: 'Huế', fullName: 'Sân bay Phú Bài' },
    { code: 'VCS', name: 'Côn Đảo', fullName: 'Sân bay Côn Đảo' },
    { code: 'BMV', name: 'Buôn Ma Thuột', fullName: 'Sân bay Buôn Ma Thuột' },
    { code: 'VCL', name: 'Chu Lai', fullName: 'Sân bay Quốc tế Chu Lai' },
    { code: 'DIN', name: 'Điện Biên Phủ', fullName: 'Sân bay Điện Biên Phủ' },
    { code: 'VDH', name: 'Đồng Hới', fullName: 'Sân bay Đồng Hới' },
    { code: 'UIH', name: 'Phú Cát', fullName: 'Sân bay Phú Cát' },
    { code: 'PXU', name: 'Pleiku', fullName: 'Sân bay Pleiku' },
    { code: 'THD', name: 'Thọ Xuân', fullName: 'Sân bay Thọ Xuân' },
    { code: 'VDO', name: 'Vân Đồn', fullName: 'Sân bay Quốc tế Vân Đồn' },
    { code: 'VII', name: 'Vinh', fullName: 'Sân bay Vinh' },
    { code: 'VTG', name: 'Vũng Tàu', fullName: 'Sân bay Vũng Tàu' },
]);

// Hàm lấy tên sân bay từ mã
const getAirportName = (code) => {
  if (!code) return '—';
  const airport = airports.value.find(a => a.code === code);
  return airport ? `${airport.fullName} (${code})` : code;
};

const fetchFlights = async () => {
  try {
    const response = await axios.get('http://localhost:5000/flights');
    flights.value = response.data;
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu chuyến bay:', error);
  }
};

const addFlight = async () => {
  try {
    await axios.post('http://localhost:5000/flights', newFlight.value);
    await fetchFlights();
    newFlight.value = {
      Number_Flight: '',
      Plane: '',
      From: '',
      Transit: '',
      To: '',
      Time_depart: '',
      Time_landing: '',
      Gate_depart: '',
      Status: 'Đúng giờ',
      Pilot_email: '',
      Initial_price: 1000000,
      Current_price: 1000000
    };
    showAddFlightForm.value = false;
    Swal.fire('Thành công!', 'Chuyến bay mới đã được thêm.', 'success');
  } catch (error) {
    console.error('Lỗi khi thêm chuyến bay:', error);
    Swal.fire('Lỗi!', 'Không thể thêm chuyến bay. Vui lòng thử lại.', 'error');
  }
};

const editFlight = (flight) => {
  editedFlight.value = { ...flight };
  showEditModal.value = true;
};

const saveChanges = async () => {
  try {
    await axios.put(`http://localhost:5000/flights/${editedFlight.value._id}`, editedFlight.value);
    await fetchFlights();
    showEditModal.value = false;
    Swal.fire('Thành công!', 'Chuyến bay đã được cập nhật.', 'success');
  } catch (error) {
    console.error('Lỗi khi cập nhật chuyến bay:', error);
    Swal.fire('Lỗi!', 'Không thể cập nhật chuyến bay. Vui lòng thử lại.', 'error');
  }
};

const deleteFlight = async (flightId) => {
  const result = await Swal.fire({
    title: 'Bạn có chắc chắn?',
    text: 'Hành động này sẽ xóa chuyến bay này!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy',
  });

  if (result.isConfirmed) {
    try {
      const response = await axios.delete(`http://localhost:5000/flights/${flightId}`);
      console.log('Response from delete:', response.data); // Debug response
      await fetchFlights();
      Swal.fire('Thành công!', 'Chuyến bay đã được xóa thành công.', 'success');
    } catch (error) {
      console.error('Lỗi khi xóa chuyến bay:', error.response ? error.response.data : error.message);
      Swal.fire('Lỗi!', 'Không thể xóa chuyến bay. Vui lòng thử lại.', 'error');
    }
  }
};

const adjustPricesForWeather = async () => {
  try {
    const response = await axios.post('http://127.0.0.1:5000/check_data_weather');
    if (response.data.Code === 200) {
      await fetchFlights();
      Swal.fire(
        'Thành công!', 
        `Đã điều chỉnh giá cho ${response.data.price_adjustments.count} chuyến bay bị ảnh hưởng bởi thời tiết.`, 
        'success'
      );
    } else {
      Swal.fire('Lỗi!', response.data.Message || 'Không thể điều chỉnh giá chuyến bay. Vui lòng thử lại.', 'error');
    }
  } catch (error) {
    console.error('Lỗi khi điều chỉnh giá:', error.response ? error.response.data : error.message);
    Swal.fire('Lỗi!', 'Không thể điều chỉnh giá chuyến bay. Vui lòng thử lại.', 'error');
  }
};

// Hàm định dạng ngày giờ
const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  
  // Parse the dateTime string into a Date object
  const date = new Date(dateTime);
  
  // Format date using UTC methods to avoid timezone conversion
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes} ${day}/${month}/${year}`;
};

// Hàm định dạng tiền tệ
const formatCurrency = (amount) => {
  if (!amount) return '0 VNĐ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

onMounted(fetchFlights);
</script>