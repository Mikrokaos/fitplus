<script lang="ts">
import {
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCardContent,
} from "@ionic/vue";
import ActivityImage from "./ActivityImage.vue";
import { defineComponent, PropType } from "vue";
import { IActivity } from "../models/ActivityModels";
import defaultActivityImage from "@/assets/defaultActivity.jpg";

export default defineComponent({
	name: "ActivityCard",
	components: {
		IonCard,
		IonCardHeader,
		IonCardTitle,
		IonCardContent,
		ActivityImage,
	},
	props: {
		activity: {
			type: Object as PropType<IActivity>,
			required: true,
		},
		defaultImageUrl: {
			type: String,
			default: defaultActivityImage,
		},
	},
});
</script>

<template>
	<ion-card class="activity-card">
		<ion-card-header>
			<ion-card-title>{{ activity.userName }}</ion-card-title>
		</ion-card-header>
		<ion-card-content>
			<activity-image :imageURL="activity.imageUrl || defaultImageUrl" />
			<div class="activity-details">
				<p>{{ activity.notes || "No notes" }}</p>
			</div>
		</ion-card-content>
	</ion-card>
</template>

<style scoped>
.activity-card {
	max-width: 400px;
	margin: auto;
	margin-bottom: 16px;
	margin-top: 10px;
}

.activity-details {
	padding: 16px;
}
</style>
