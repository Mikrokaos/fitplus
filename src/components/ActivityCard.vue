<script lang="ts">
import {
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCardContent,
	IonImg,
} from "@ionic/vue";
import { defineComponent, PropType } from "vue";
import { IActivity } from "@/models/ActivityModels"; // Adjust the import path as necessary

export default defineComponent({
	name: "ActivityCard",
	components: {
		IonCard,
		IonCardHeader,
		IonCardTitle,
		IonCardContent,
		IonImg,
	},
	props: {
		activity: {
			type: Object as PropType<IActivity>,
			required: true,
		},
		defaultImageUrl: {
			type: String,
			default: "gs://fitplustds200.appspot.com/images/defaultActivity.jpg", // Provide a default image URL
		},
	},
});
</script>
<template>
	<ion-card>
		<ion-card-header>
			<ion-card-title>{{ activity.type }}</ion-card-title>
		</ion-card-header>
		<ion-card-content>
			<p>Duration: {{ activity.duration }} minutes</p>
			<p>Calories Burned: {{ activity.calorieConsumption }}</p>
			<p>Nickname: {{ activity.userNickname }}</p>
			<p>Notes: {{ activity.notes || "No notes" }}</p>
			<ion-img
				:src="activity.imageUrl || defaultImageUrl"
				alt="Activity Image"></ion-img>
		</ion-card-content>
	</ion-card>
</template>
