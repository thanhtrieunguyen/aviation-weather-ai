<template>
  <span :class="[
    'px-2 py-1 rounded-full text-sm font-medium',
    statusClasses[status] || statusClasses.default
  ]">
    {{ statusText }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true
  }
})

const statusClasses = {
  'on-time': 'bg-green-100 text-green-800',
  'delayed': 'bg-red-100 text-red-800',
  'in-flight': 'bg-blue-100 text-blue-800',
  'default': 'bg-gray-100 text-gray-800'
}

const statusText = computed(() => {
  const texts = {
    'on-time': 'Đúng giờ',
    'delayed': 'Bị hoãn',
    'in-flight': 'Đang bay',
    'default': 'Unknown'
  }
  return texts[props.status] || texts.default
})
</script>