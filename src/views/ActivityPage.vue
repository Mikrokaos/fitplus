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
import { alertController } from "@ionic/vue";
import { authService } from "@/services/firebase.AuthService";
import { addCircleOutline, logOutOutline, personCircle } from "ionicons/icons";
import ActivityCard from "@/components/ActivityCard.vue";
import defaultActivityImage from "@/assets/defaultActivity.jpg";

// references, reactive states and firestore initialization
const currentUserData = ref(null);
const db = getFirestore();
const activities = ref([]);
const router = useRouter();

// Fetching the current user
const currentUser = () => {
	return authService.currentUser();
};

// Logging out the user
const logout = async () => {
	try {
		await authService.logout();
		currentUserData.value = null;
	} catch (error) {
		console.error(error);
	}
	router.push("/home");
};

// lifecycle hook to fetch activities and current user data
onIonViewDidEnter(async () => {
	currentUserData.value = await currentUser();
	fetchActivities();
});

// Refreshing activities
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

// Navigating to the authentication page based on the action
const goToAuth = (authAction) => {
	router.push({ name: "Authentication", query: { authAction: authAction } });
};

const goToProfile = async () => {
	if (!currentUserData.value) {
		// if no user is logged in, show an alert
		const alert = await alertController.create({
			header: "Authentication Required",
			message: "You need to log in to access the profile page.",
			buttons: [
				{
					text: "Login",
					handler: () => {
						goToAuth("login");
					},
				},
				{
					text: "Register",
					handler: () => {
						goToAuth("register");
					},
				},
			],
		});

		await alert.present();
	} else {
		router.push("/profile");
	}
};
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonTitle>FitPlus</IonTitle>
				<IonButtons slot="end">
					<IonButton @click="goToProfile">
						<IonIcon :icon="personCircle" />
					</IonButton>
				</IonButtons>
			</IonToolbar>
		</IonHeader>
		<IonContent class="custom-background" :fullscreen="true">
			<div v-if="activities.length">
				<ActivityCard
					v-for="activity in activities"
					:router-link="'/activity/' + activity.id"
					:key="activity.id"
					:activity="activity"
					:default-image-url="defaultActivityImage" />
			</div>
			<div v-else>
				<p>No activities logged yet.</p>
			</div>
		</IonContent>
		<IonFooter position="sticky" color="black">
			<IonToolbar class="toolbar-center">
				<IonButton
					slot="start"
					color="black"
					@click="logout"
					class="logout-button">
					<IonIcon :icon="logOutOutline"></IonIcon
				></IonButton>
				<IonButton
					slot="end"
					color="black"
					:router-link="'/new-activity'"
					class="activity-button">
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

.toolbar-center {
	display: flex;
	justify-content: center;
}

.logout-button {
	margin-right: auto;
	margin-left: 40px;
}

.activity-button {
	display: flex;
	margin-left: auto;
	margin-right: 145px;
}
</style>
