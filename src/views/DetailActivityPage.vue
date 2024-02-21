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
/*import { authService } from "@/services/firebase.AuthService";
import { Geolocation } from "@capacitor/geolocation";
import { GoogleMap } from "@capacitor/google-maps"; */
import { useRouter } from "vue-router";
import router from "@/router";
import { IActivityResponse } from "@/models/ActivityModels";
import MapPicker from "@/components/MapPicker.vue";

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
	// await readGeoLocation();
});

/*const readGeoLocation = async () => {
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
			id: "my-google-map",
			element: myMapRef.value,
			apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
			config: {
				center: {
					lat: activity.value.location?.latitude,
					lng: activity.value.location?.longitude,
				},
				zoom: 16,
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
}; */

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
					<ion-back-button defaultHref="/activity"></ion-back-button>
				</ion-buttons>
				<ion-title>{{ activity?.type }}</ion-title>
			</ion-toolbar>
		</ion-header>

		<ion-content :fullscreen="true" v-if="activity && !isLoadingActivity">
			<ion-grid>
				<ion-row>
					<ion-col size-md="8" offset-md="2">
						<div v-if="activity.imageUrl" class="image-container">
							<img :src="activity.imageUrl" alt="Activity Image" />
						</div>
					</ion-col>
				</ion-row>
				<ion-row>
					<ion-col size-md="8" offset-md="2">
						<ion-card>
							<MapPicker
								v-if="activity.location"
								mode="readonly"
								:initialLatitude="activity.location.latitude"
								:initialLongitude="activity.location.longitude" />
						</ion-card>
					</ion-col>
				</ion-row>
				<ion-row>
					<ion-col size-md="8" offset-md="2">
						<ion-card class="details-container">
							<ion-card-header>
								<ion-card-subtitle
									>{{ activity.duration }} minutes</ion-card-subtitle
								>
								<ion-card-subtitle
									>{{ activity.calorieConsumption }} calories</ion-card-subtitle
								>
							</ion-card-header>
							<ion-card-content>
								<ion-text>{{ activity.notes }}</ion-text>
							</ion-card-content>
						</ion-card>
					</ion-col>
				</ion-row>
				<ion-row>
					<ion-col size-md="8" offset-md="2">
						<ion-card>
							<ion-card-header>
								<ion-card-title>Comments</ion-card-title>
							</ion-card-header>
							<ion-card-content>
								<ion-list>
									<ion-item v-for="comment in comments" :key="comment.id">
										<ion-avatar slot="start">
											<img src="" alt="User Avatar" />
											<!-- Placeholder for user avatar -->
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
							</ion-card-content>
						</ion-card>
					</ion-col>
				</ion-row>
			</ion-grid>
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

		<ion-modal
			:is-open="isModalOpen"
			:initial-breakpoint="0.25"
			:breakpoints="[0, 0.25, 0.5, 0.75]"
			@did-dismiss="isModalOpen = false">
			<ion-content class="ion-padding">
				<ion-item lines="none">
					<ion-label position="floating">New comment</ion-label>
					<ion-textarea v-model="newCommentText"></ion-textarea>
				</ion-item>
				<ion-button
					@click="addComment"
					expand="full"
					class="submit-comment-button"
					>Add Comment</ion-button
				>
			</ion-content>
		</ion-modal>
	</ion-page>
</template>

<style scoped>
.image-container img {
	width: 100%;
	height: auto;
	display: block;
	margin: 0 auto;
}

.details-container {
	text-align: center;
	padding: 16px;
}

.submit-comment-button {
	margin-top: 20px;
}
</style>
