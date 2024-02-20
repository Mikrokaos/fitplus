<script setup lang="ts">
import {
	onIonViewDidEnter,
	IonContent,
	IonButtons,
	IonButton,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonCardSubtitle,
	IonCard,
	IonHeader,
	IonPage,
	IonTitle,
	IonToolbar,
	IonIcon,
} from "@ionic/vue";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { authService } from "@/services/firebase.AuthService";
import { addCircleOutline } from "ionicons/icons";
import ActivityCard from "@/components/ActivityCard.vue";

const currentUserData = ref(null);
const db = getFirestore();
const activities = ref([]);
const router = useRouter();

const currentUser = () => {
	return authService.currentUser();
};

const logout = async () => {
	try {
		await authService.logout();
		currentUserData.value = null;
	} catch (error) {
		console.error(error);
	}
};

onIonViewDidEnter(async () => {
	currentUserData.value = await currentUser();
	fetchActivities();
});

const refreshActivities = async (event: CustomEvent) => {
	await fetchActivities();
	if (event && event.target) {
		(event.target as HTMLIonRefresherElement).complete();
	}
};

// Fetching activities from Firestore
const fetchActivities = async () => {
	const results = [];
	const activitiesSnapshot = await getDocs(collection(db, "activities"));
	activitiesSnapshot.forEach((doc) => {
		const activityData = doc.data();
		results.push({
			...activityData,
			id: doc.id,
		});
	});
	activities.value = results;
};
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonTitle>FitPlus</IonTitle>
				<IonButtons slot="end">
					<IonButton :router-link="'/new-activity'">
						<IonIcon :icon="addCircleOutline" />
					</IonButton>
				</IonButtons>
			</IonToolbar>
		</IonHeader>
		<IonContent class="custom-background" :fullscreen="true">
			<div v-if="activities.length">
				<ActivityCard
					v-for="activity in activities"
					:key="activity.id"
					:activity="activity"
					:defaultImageUrl="defaultImageUrl" />
			</div>
			<div v-else>
				<p>No activities logged yet.</p>
			</div>
		</IonContent>
	</IonPage>
</template>

<style scoped>
.custom-background {
	--background: linear-gradient(135deg, #542663 20%, #327a3b 100%);
}
</style>
