<script lang="ts">
import {
	IonCard,
	IonCardHeader,
	IonCardTitle,
	IonCardContent,
	IonImg,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { IActivity } from "@/models/ActivityModels";

export default defineComponent({
	components: { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg },
	props: {
		activity: {
			type: Object as () => IActivity,
			required: true,
		},
	},
	methods: {
		navigateToDetail(id?: string) {
			if (id) {
				this.$router.push({ name: "ActivityDetail", params: { id } });
			}
		},
	},
});
</script>

<template>
	<ion-card @click="navigateToDetail(activity.id)">
		<ion-card-header>
			<ion-card-title>{{ activity.type }}</ion-card-title>
		</ion-card-header>
		<ion-card-content>
			<div>Duration: {{ activity.duration }} minutes</div>
			<div>Calories: {{ activity.calorieConsumption }}</div>
			<ion-img :src="activity.imageUrl" v-if="activity.imageUrl"></ion-img>
		</ion-card-content>
	</ion-card>
</template>
