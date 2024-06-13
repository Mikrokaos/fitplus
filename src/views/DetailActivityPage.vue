<script setup lang="ts">
import {
	IonModal,
	IonTextarea,
	IonBackButton,
	IonButton,
	IonAvatar,
	IonFooter,
	IonIcon,
	IonItem,
	IonListHeader,
	IonLabel,
	IonList,
	IonCardHeader,
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
import { ref, onMounted } from "vue";
import { chatboxOutline, trash, accessibilityOutline } from "ionicons/icons";
import { useRoute } from "vue-router";
import {
	collection,
	getDocs,
	getFirestore,
	query,
	getDoc,
	setDoc,
	deleteDoc,
	addDoc,
	orderBy,
	doc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { IActivityResponse } from "@/models/ActivityModels";
import MapPicker from "@/components/MapPicker.vue";
import defaultProfilePicture from "../assets/defaultProfilePic.png";

const route = useRoute();

//initialize constants and references
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

const userDetails = ref({
	userName: "",
	profilePicture: "",
});

const activitiesRef = doc(activitiesCollection, id as string);
console.log(id);

// lifecycle hook to fetch the activity and comments
onIonViewDidEnter(async () => {
	currentUserData.value = getAuth().currentUser;
	await fetchActivities();
	await fetchComments();
	console.log("Activity", activity.value);
});

//fetching the activity from Firestore
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
		isLoadingActivity.value = false;
	}
};

const fetchComments = async () => {
	if (!id) return;
	comments.value = await fetchCommentsForActivity(id as string);
};
// lifecycle hook to fetch user profile data when mounted
onMounted(() => {
	const auth = getAuth();
	onAuthStateChanged(auth, (user) => {
		if (user) {
			fetchUserProfile(user.uid);
		} else {
			console.log("No user is signed in.");
		}
	});
});
// fetching user profile from firestore
const fetchUserProfile = async (uid) => {
	try {
		const userRef = doc(db, "userProfile", uid);
		const userSnap = await getDoc(userRef);
		if (userSnap.exists()) {
			const userData = userSnap.data();
			return {
				userName: userData.userName || "Guest",
				userAvatar: userData.profilePicture || defaultProfilePicture,
			};
		} else {
			console.log("No user profile found for UID:", uid);
			return { userName: "Guest", userAvatar: defaultProfilePicture };
		}
	} catch (error) {
		console.error("Error fetching user profile:", error);
		return { userName: "Guest", userAvatar: defaultProfilePicture };
	}
};

// function to add a new comment
const addComment = async () => {
	const commentsCollectionRef = collection(
		db,
		"activities",
		id as string,
		"comments"
	);
	// fetch the user profile, if the user is logged in. If not, use the default profile picture
	let userProfile = { userName: "Guest", userAvatar: defaultProfilePicture };
	if (currentUserData.value && currentUserData.value.uid) {
		userProfile = await fetchUserProfile(currentUserData.value.uid);
	}
	// create a new comment object
	const newComment = {
		userId: currentUserData.value ? currentUserData.value.uid : "guest",
		userName: userProfile.userName,
		userAvatar: userProfile.userAvatar,
		text: newCommentText.value,
		timestamp: new Date(),
	};
	// add the new comment to the comments collection
	try {
		await addDoc(commentsCollectionRef, newComment);
		console.log("Comment added");
		isModalOpen.value = false;
		newCommentText.value = "";
		await fetchComments();
	} catch (error) {
		console.error("Error adding comment", error);
	}
};
// function to update the comments. Not working yet
const updateComments = async (updatedComment: string) => {
	try {
		await setDoc(activitiesRef, { comments: updatedComment }, { merge: true });
		activity.value.comments = updatedComment;
	} catch (error) {
		console.error("Error updating comments", error);
	}
};
// function to delete a comment. I havent got this to work yet
const deleteComment = async (commentId) => {
	if (!id || !commentId) {
		console.error("Activity ID or Comment ID is missing.");
		return;
	}
	try {
		const commentRef = doc(db, "activities", id, "comments", commentId);
		await deleteDoc(commentRef);
		console.log(`Comment with ID ${commentId} deleted.`);

		await fetchComments();
	} catch (error) {
		console.error("Error deleting comment", error);
	}
};
// function for fetching the comments for an activity posted
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
				<ion-title>{{ activity?.userName }}</ion-title>
			</ion-toolbar>
		</ion-header>

		<ion-content :fullscreen="true" v-if="activity && !isLoadingActivity">
			<div style="max-width: 600px; margin: auto">
				<ion-card>
					<ion-card-header> </ion-card-header>
					<ion-card-content>
						<div v-if="activity.imageUrl" class="image-container">
							<img :src="activity.imageUrl" alt="Activity Image" />
						</div>

						<MapPicker
							v-if="activity.location"
							mode="readonly"
							:initialLatitude="activity.location.latitude"
							:initialLongitude="activity.location.longitude" />

						<div class="details-container">
							<ion-chip>
								<ion-icon :icon="accessibilityOutline"></ion-icon>
								<ion-label>{{ activity.type }}</ion-label>
							</ion-chip>
							<h2>{{ activity.duration }} minutes</h2>
							<h2>{{ activity.calorieConsumption }} calories</h2>
							<p>{{ activity.notes }}</p>
						</div>

						<ion-list>
							<ion-list-header>
								<ion-label>Comments</ion-label>
							</ion-list-header>
							<ion-item
								v-for="comment in comments"
								:key="comment.id"
								class="comment-item">
								<ion-avatar slot="start">
									<img
										:src="comment.userAvatar || defaultAvatar"
										alt="User Avatar" />
								</ion-avatar>
								<ion-label>
									<h2>{{ comment.userName || "Guest" }}</h2>
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
			</div>
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

		<ion-modal :is-open="isModalOpen" @did-dismiss="isModalOpen = false">
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
	border-radius: 8px;
	max-width: 100%;
	height: auto;
	display: block;
	margin: 0 auto;
}

.details-container {
	padding: 16px;
}

.submit-comment-button {
	margin-top: 20px;
}
</style>
