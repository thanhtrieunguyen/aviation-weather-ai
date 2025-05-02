<template>
  <div class="weather-icon">
    <component :is="iconComponent" class="w-full h-full" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  SunIcon,
  CloudIcon,
  EyeIcon,
  ArrowsUpDownIcon,
  SparklesIcon,
  CloudArrowUpIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps({
  type: {
    type: String,
    required: true
  }
})

const iconComponent = computed(() => {
  const icons = {
    temperature: SunIcon,
    humidity: CloudIcon,
    windSpeed: SparklesIcon,
    visibility: EyeIcon,
    pressure: ArrowsUpDownIcon,
    cloudCover: CloudArrowUpIcon
  }
  return icons[props.type] || SunIcon
})
</script>