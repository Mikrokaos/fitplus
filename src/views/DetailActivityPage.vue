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
	doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { authService } from "@/services/firebase.AuthService";
import { Geolocation } from "@capacitor/geolocation";
import { GoogleMap } from "@capacitor/google-maps";
import { useRouter } from "vue-router";
import router from "@/router";

const route = useRoute();

const { id } = route.params;
const isModalOpen = ref(false);
const newCommentText = ref("");
const isLoadingActivity = ref(true);
const activity = ref(null);
const currentUserData = ref(null);
const myMapRef = ref(null);

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
			apiKey: process.env.VUE_APP_GOOGLE_MAPS_API_KEY || "", // Your Google Maps API Key
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
			const activity = docSnap.data();
			console.log("Fetched activity", activity.value);
			activity.value = activity;
			isLoadingActivity.value = false;
		} else {
			console.log("No activity found");
		}
	} catch (error) {
		console.error("Error fetching the activity", error);
	}
};

const addComment = async () => {
	try {
		if (currentUserData.value) {
			const newComment = {
				id: activity.value.comments ? activity.value.comments.length + 1 : 1,
				userId: currentUserData.value.uid,
				text: newCommentText.value,
			};

			const updatedComments = activity.value.comments
				? [...activity.value.comments, newComment]
				: [newComment];
			await updatedComments(updatedComments);
			isModalOpen.value = false;
			newCommentText.value = "";
		} else {
			console.error("User not logged in");
		}
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
	try {
		const targetComment = activity.value.comments.find(
			(comment) => comment.id === commentId
		);
		if (!targetComment) {
			throw new Error("Comment not found");
		}

		const updatedComments = activity.value.comments.filter(
			(comment) => comment.id !== commentId
		);
		await updateComments(updatedComments);
	} catch (error) {
		console.error("Error deleting comment", error);
	}
};
</script>
