<template>
  <div class="bg-white rounded-lg shadow-sm p-4">
    <h2 class="text-lg font-semibold mb-4">Bản đồ thời tiết tương tác</h2>
    <div ref="mapContainer" class="h-[400px] rounded-lg overflow-hidden"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const props = defineProps({
  selectedAirport: {
    type: Object,
    default: null
  }
})

const mapContainer = ref(null)
const map = ref(null)
const marker = ref(null)

// Initialize map
onMounted(() => {
  // Set default view to Vietnam's center
  map.value = L.map(mapContainer.value).setView([16.0474, 108.2012], 5)
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value)
})

// Watch for changes in selected airport
watch(() => props.selectedAirport, (newAirport) => {
  if (!newAirport || !map.value) return

  // Parse latitude and longitude
  const lat = parseFloat(newAirport.latitude)
  const lng = parseFloat(newAirport.longitude)

  // Remove existing marker if any
  if (marker.value) {
    marker.value.remove()
  }

  // Add new marker
  marker.value = L.marker([lat, lng])
    .addTo(map.value)
    .bindPopup(`<b>${newAirport.name}</b><br>${newAirport.iata}`)
    .openPopup()

  // Center map on airport
  map.value.setView([lat, lng], 13)
}, { immediate: true })
</script>

<style scoped>
/* Fix Leaflet marker icon issue */
:global(.leaflet-default-icon-path) {
  background-image: url("https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png");
}
</style>