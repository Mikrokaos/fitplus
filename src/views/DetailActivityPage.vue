<script setup lang="ts">
import {
	IonModal,
	IonSpinner,
	IonTextarea,
	IonBackButton,
	IonButton,
	IonAvatar,
	IonText,
	IonIcon,
	IonItem,
	IonListHeader,
	IonLabel,
	IonList,
	IonCardHeader,
	IonCardSubtitle,
	IonButtons,
	IonCard,
	IonCardContent,
	IonChip,
	IonContent,
	IonHeader,
	IonPage,
	IonTitle,
	IonToolbar,
	onIonViewDidEnter,
} from "@ionic/vue";
import { ref } from "vue";
import {
	chatboxOutline,
	arrowBack,
	trash,
	heart,
	heartOutline,
	constructOutline,
} from "ionicons/icons";
import { useRoute } from "vue-router";
import {
	collection,
	getDocs,
	getFirestore,
	query,
	where,
	getDoc,
	setDoc,
	updateDoc,
	deleteDoc,
	addDoc,
	orderBy,
	doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { authService } from "@/services/firebase.AuthService";
import { Geolocation } from "@capacitor/geolocation";
import { GoogleMap } from "@capacitor/google-maps";
import { useRouter } from "vue-router";
import router from "@/router";
import { IActivityResponse } from "@/models/ActivityModels";

const route = useRoute();

const { id } = route.params;
const isModalOpen = ref(false);
const newCommentText = ref("");
const isLoadingActivity = ref(true);
const activity = ref<IActivityResponse["activities_by_id"] | null>(null);
const currentUserData = ref(null);
const myMapRef = ref(null);
const comments = ref([]);
const db = getFirestore();
const activitiesCollection = collection(db, "activities");
console.log(activitiesCollection);

const activitiesRef = doc(activitiesCollection, id as string);
console.log(id);

const back = () => {
	router.push("/activity");
};

onIonViewDidEnter(async () => {
	currentUserData.value = getAuth().currentUser;
	await fetchActivities();
	await fetchComments();
	console.log("Activity", activity.value);
	await readGeoLocation();
});

const readGeoLocation = async () => {
	try {
		if (activity.value && !activity.value.location) {
			const position = await Geolocation.getCurrentPosition();
			const latitude = position.coords.latitude;
			const longitude = position.coords.longitude;
			const location = {
				latitude,
				longitude,
			};
			await updateDoc(activitiesRef, { location });
			activity.value.location = location;
		}

		const myMap = await GoogleMap.create({
			id: "my-google-map", // Unique identifier for this map instance
			element: myMapRef.value, // reference to the capacitor-google-map element
			apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "", // Your Google Maps API Key
			config: {
				center: {
					// The initial position to be rendered by the map
					lat: activity.value.location?.latitude,
					lng: activity.value.location?.longitude,
				},
				zoom: 16, // The initial zoom level to be rendered by the map
			},
		});
		const markerId = await myMap.addMarker({
			coordinate: {
				lat: activity.value.location?.latitude,
				lng: activity.value.location?.longitude,
			},
		});
	} catch (error) {
		console.error("Error getting location: ", error);
	}
};

const fetchActivities = async () => {
	try {
		const docSnap = await getDoc(activitiesRef);
		if (docSnap.exists()) {
			activity.value = docSnap.data();
			isLoadingActivity.value = false;
		} else {
			console.log("No activity found");
		}
	} catch (error) {
		console.error("Error fetching the activity", error);
		isLoadingActivity.value = false; // Ensure loading state is updated even on error
	}
};

const fetchComments = async () => {
	if (!id) return;
	comments.value = await fetchCommentsForActivity(id as string);
};

const addComment = async () => {
	const commentsCollectionRef = collection(
		db,
		"activities",
		id as string,
		"comments"
	);

	try {
		const newComment = {
			userId: currentUserData.value ? currentUserData.value.uid : "guest",
			text: newCommentText.value,
			timestamp: new Date(),
		};

		await addDoc(commentsCollectionRef, newComment);

		console.log(addComment, "Comment added");

		isModalOpen.value = false; // Close the modal
		newCommentText.value = ""; // Clear the textarea
		await addDoc(commentsCollectionRef, newComment);
		await fetchComments();
		console.log("Comments fetched successfully");
	} catch (error) {
		console.error("Error adding comment", error);
	}
};

const updateComments = async (updatedComment: string) => {
	try {
		await setDoc(activitiesRef, { comments: updatedComment }, { merge: true });
		activity.value.comments = updatedComment;
	} catch (error) {
		console.error("Error updating comments", error);
	}
};

const deleteComment = async (commentId) => {
	if (!id || !commentId) {
		console.error("Activity ID or Comment ID is missing.");
		return;
	}

	try {
		const commentRef = doc(db, "activities", id, "comments", commentId);
		await deleteDoc(commentRef);
		console.log(`Comment with ID ${commentId} deleted.`);
		// Optionally, refresh comments list here
	} catch (error) {
		console.error("Error deleting comment", error);
	}
};
const fetchCommentsForActivity = async (activityId: string) => {
	const commentsCollectionRef = collection(
		db,
		"activities",
		activityId,
		"comments"
	);
	const querySnapshot = await getDocs(
		query(commentsCollectionRef, orderBy("timestamp", "desc"))
	);

	const comments = querySnapshot.docs.map((doc) => doc.data());
	return comments;
};
</script>
<template>
	<ion-page>
		<ion-header>
			<ion-toolbar>
				<ion-buttons slot="start">
					<ion-back-button defaultHref="/activity">
						<ion-icon :icon="arrowBack" />
					</ion-back-button>
				</ion-buttons>
				<ion-title>Activity Details</ion-title>
			</ion-toolbar>
			<ion-toolbar>
				<ion-title v-if="activity">{{ activity.id }}</ion-title>
			</ion-toolbar>
		</ion-header>

		<ion-content :fullscreen="true" v-if="activity && !isLoadingActivity">
			<ion-card>
				<ion-card-header>
					<div v-if="activity && activity.imageUrl">
						<img
							:src="activity.imageUrl"
							alt="Activity Image"
							style="max-width: 100%; height: auto" />
					</div>
					<ion-card-subtitle>{{ activity.type }}</ion-card-subtitle>
					<ion-card-subtitle>{{ activity.duration }} minutes</ion-card-subtitle>
					<ion-card-subtitle
						>{{ activity.calorieConsumption }} calories</ion-card-subtitle
					>
				</ion-card-header>
				<div>
					<capacitor-google-maps
						ref="myMapRef"
						style="width: 100%; height: 300px; display: inline-block">
					</capacitor-google-maps>
				</div>
				<ion-card-content>
					<ion-text>{{ activity.notes }}</ion-text>
				</ion-card-content>
			</ion-card>
			<ion-card>
				<ion-list>
					<ion-list-header>
						<ion-label>Comments</ion-label>
					</ion-list-header>
					<ion-item v-for="comment in comments" :key="comment.id">
						<ion-avatar>
							<!-- Placeholder for user avatar; adjust as needed -->
							<img src="" alt="User Avatar" />
						</ion-avatar>
						<ion-label>
							<h2>User Name Placeholder</h2>
							<!-- Adjust to display user name if available -->
							<p>{{ comment.text }}</p>
						</ion-label>
						<ion-buttons slot="end">
							<ion-button
								@click="deleteComment(comment.id)"
								color="danger"
								fill="clear">
								<ion-icon :icon="trash" />
							</ion-button>
						</ion-buttons>
					</ion-item>
				</ion-list>
			</ion-card>

			<ion-modal
				:is-open="isModalOpen"
				:initial-breakpoint="0.25"
				:breakpoints="[0, 0.25, 0.5, 0.75]"
				@did-dismiss="isModalOpen = false">
				<ion-content>
					<ion-item lines="none">
						<ion-label position="floating">New comment</ion-label>
						<ion-textarea v-model="newCommentText"></ion-textarea>
						<ion-button @click="addComment">Add comment</ion-button>
					</ion-item>
				</ion-content>
			</ion-modal>
		</ion-content>
		<ion-footer>
			<ion-toolbar>
				<ion-buttons slot="end">
					<ion-button @click="isModalOpen = true">
						<ion-icon :icon="chatboxOutline" />
					</ion-button>
				</ion-buttons>
			</ion-toolbar>
		</ion-footer>
	</ion-page>
</template>
