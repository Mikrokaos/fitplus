<script setup lang="ts">
interface Props {
	imageURL: string;
}

const props = defineProps<Props>();
console.log(props.imageURL);
</script>

<template>
	<div class="image-container">
		<img class="activity-image" :src="imageURL" alt="Activity Image" />
	</div>
</template>

<style scoped>
.image-container {
	max-width: 400px;
	margin: auto;
}

.activity-image {
	width: 100%;
	height: auto;
	object-fit: cover;
	border-radius: 8px;
}
</style>
