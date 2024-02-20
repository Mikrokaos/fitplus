<script setup lang="ts">
import { ref, onMounted } from "vue";
import { GoogleMap } from "@capacitor/google-maps";

const mapContainerRef = ref(null);

onMounted(async () => {
	if (mapContainerRef.value) {
		const map = await GoogleMap.create({
			id: "my-google-map",
			element: mapContainerRef.value,
			apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
			config: {
				center: { lat: -34.397, lng: 150.644 },
				zoom: 8,
			},
		});

		google.maps.event.addListener(marker, "dragend", () => {
			const position = marker.getPosition();
			console.log(position.lat(), position.lng());
			// Emit the event up to the parent component
			context.emit("location-changed", {
				lat: position.lat(),
				lng: position.lng(),
			});
		});
	}
});
</script>

<template>
	<capacitor-google-maps>
		<div ref="mapContainer" class="map-container"></div>
	</capacitor-google-maps>
</template>

<style>
.map-container {
	width: 100%;
	height: 300px;
}
</style>
