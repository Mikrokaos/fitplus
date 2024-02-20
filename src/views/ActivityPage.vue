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
import { addCircleOutline, arrowBackOutline } from "ionicons/icons";
import ActivityCard from "@/components/ActivityCard.vue";

const currentUserData = ref(null);
const db = getFirestore();
const activities = ref([]);
const router = useRouter();

const currentUser = () => {
	return authService.currentUser();
};

const defaultImageUrl =
	"https://firebasestorage.googleapis.com/v0/b/fitplustds200.appspot.com/o/images%2FdefaultActivity.jpg?alt=media&token=your-token";

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

console.log(defaultImageUrl);

const goBack = () => {
	router.back();
};
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonButtons slot="start">
					<IonButton @click="goBack">
						<IonIcon :icon="arrowBackOutline" />
					</IonButton>
				</IonButtons>
				<IonTitle>FitPlus</IonTitle>
				<IonButtons slot="end">
					<IonMenuButton></IonMenuButton>
				</IonButtons>
			</IonToolbar>
		</IonHeader>
		<IonContent class="custom-background" :fullscreen="true">
			<div v-if="activities.length">
				<ActivityCard
					v-for="activity in activities"
					:key="activity.id"
					:activity="activity"
					:default-image-url="defaultImageUrl" />
			</div>
			<div v-else>
				<p>No activities logged yet.</p>
			</div>
		</IonContent>
		<IonFooter>
			<IonToolbar>
				<IonButton color="black" :router-link="'/new-activity'">
					<IonIcon :icon="addCircleOutline" />
				</IonButton>
			</IonToolbar>
		</IonFooter>
	</IonPage>
</template>

<style scoped>
.custom-background {
	--background: #a7a2a2;
}
</style>
