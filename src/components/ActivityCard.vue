<script lang="ts">
import {
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCardContent,
} from "@ionic/vue";
import ActivityImage from "./ActivityImage.vue"; // Adjust the import path to where your ImageCard is located
import { defineComponent, PropType } from "vue";
import { IActivity } from "../models/ActivityModels";

export default defineComponent({
	name: "ActivityCard",
	components: {
		IonCard,
		IonCardHeader,
		IonCardTitle,
		IonCardContent,
		ActivityImage, // Register the ImageCard component
	},
	props: {
		activity: {
			type: Object as PropType<IActivity>,
			required: true,
		},
		defaultImageUrl: {
			type: String,
			default: "gs://fitplustds200.appspot.com/images/defaultActivity.jpg", // Need to make this work
		},
	},
});
</script>

<template>
	<ion-card class="activity-card">
		<ion-card-header>
			<ion-card-title>{{ activity.type }}</ion-card-title>
		</ion-card-header>
		<ion-card-content>
			<activity-image :imageURL="activity.imageUrl || defaultImageUrl" />
			<div class="activity-details">
				<p>Duration: {{ activity.duration }} minutes</p>
				<p>Calories Burned: {{ activity.calorieConsumption }}</p>
				<p>{{ activity.userName }}</p>
				<p>Notes: {{ activity.notes || "No notes" }}</p>
			</div>
		</ion-card-content>
	</ion-card>
</template>

<style scoped>
.activity-card {
	max-width: 600px; /* Set the maximum width of the card */
	margin: auto; /* Center the card */
	margin-bottom: 16px; /* Add some margin at the bottom of the card */
	margin-top: 10px;
}

.activity-details {
	padding: 16px; /* Add some padding inside the card for the text */
}
</style>
