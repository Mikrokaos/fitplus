<script setup lang="ts">
import { ref, onMounted } from "vue";
import { GoogleMap } from "@capacitor/google-maps";
import { Geolocation } from "@capacitor/geolocation";

const props = defineProps({
	mode: String,
	initialLatitude: Number,
	initialLongitude: Number,
});

// Define reactive states and emit custom event
const currentLatitude = ref(props.initialLatitude);
const currentLongitude = ref(props.initialLongitude);
const myMapRef = ref(null);
const emit = defineEmits(["location-changed"]);

let myMap;
let markerId;

// Initialize or update the map with the provided coordinates
const initializeOrUpdateMap = async (latitude, longitude) => {
	if (!myMap) {
		// Initialize the map
		try {
			myMap = await GoogleMap.create({
				id: "my-google-map",
				element: myMapRef.value,
				apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
				config: {
					center: { lat: latitude, lng: longitude },
					zoom: 16,
				},
			});
		} catch (error) {
			console.error("Error creating map:", error);
			return;
		}
	} else {
		// Update map center
		myMap.setCamera({
			coordinate: { lat: latitude, lng: longitude },
			zoom: 16,
		});
	}

	// Update or create marker
	if (markerId !== undefined) {
		await myMap.removeMarker(markerId);
	}
	markerId = await myMap.addMarker({
		coordinate: { lat: latitude, lng: longitude },
	});

	// Setup click listener if mode is editable
	if (props.mode === "editable") {
		myMap.setOnMapClickListener(async (event) => {
			initializeOrUpdateMap(event.latitude, event.longitude);
			emit("location-changed", {
				latitude: event.latitude,
				longitude: event.longitude,
			});
		});
	}
};

// Fetch current location or use provided props
const fetchCurrentLocationAndInitialize = async () => {
	let latitude = props.initialLatitude;
	let longitude = props.initialLongitude;

	// Fetch current location if no initial coordinates are provided
	if (latitude === undefined || longitude === undefined) {
		try {
			const position = await Geolocation.getCurrentPosition();
			latitude = position.coords.latitude;
			longitude = position.coords.longitude;
		} catch (error) {
			console.error("Error fetching current location:", error);
			return;
		}
	}

	currentLatitude.value = latitude;
	currentLongitude.value = longitude;
	initializeOrUpdateMap(latitude, longitude);
};

onMounted(fetchCurrentLocationAndInitialize);
</script>

<template>
	<div ref="myMapRef" class="map-container"></div>
</template>

<style>
.map-container {
	margin-top: 20px;
	height: 300px;
	width: 100%;
	border-radius: 8px;
}
</style>
