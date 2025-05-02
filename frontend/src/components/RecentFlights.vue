<template>
  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="text-lg font-semibold mb-4">Chuyến bay gần đây</h2>
    
    <div v-if="loading" class="flex justify-center items-center h-60">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-50 p-4 rounded-lg text-red-600">
      {{ error }}
    </div>
    
    <div v-else-if="flights.length === 0" class="flex justify-center items-center h-60 bg-gray-50 rounded-lg">
      <div class="text-center text-gray-500">Không có dữ liệu chuyến bay</div>
    </div>
    
    <div v-else class="overflow-x-auto">
      <table class="min-w-full">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mã chuyến bay
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tuyến
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thời gian
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Trạng thái
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="flight in flights" :key="flight.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">{{ flight.number }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ flight.from }} → {{ flight.to }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ flight.time }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                :class="{
                  'bg-green-100 text-green-800': flight.status === 'Đúng giờ' || flight.status === 'Đã hạ cánh',
                  'bg-yellow-100 text-yellow-800': flight.status === 'Bị trễ',
                  'bg-blue-100 text-blue-800': flight.status === 'Đã cất cánh',
                  'bg-red-100 text-red-800': flight.status === 'Đã hủy',
                  'bg-gray-100 text-gray-800': !['Đúng giờ', 'Đã hạ cánh', 'Bị trễ', 'Đã cất cánh', 'Đã hủy'].includes(flight.status)
                }"
              >
                {{ flight.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  flights: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  }
})
</script>