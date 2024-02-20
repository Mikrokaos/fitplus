<script setup lang="ts">
import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonChip,
	IonContent,
	IonHeader,
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonTextarea,
	IonTitle,
	IonToolbar,
	toastController,
} from "@ionic/vue";
import { onMounted, ref, Ref } from "vue";
import { Camera, CameraResultType } from "@capacitor/camera";
import {
	getFirestore,
	doc,
	setDoc,
	getDoc,
	getDocs,
	collection,
} from "firebase/firestore";
import {
	getStorage,
	uploadBytes,
	getDownloadURL,
	ref as storageRef,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { add, camera, cameraOutline, trashOutline } from "ionicons/icons";
import { IActivityType } from "@/types/ActivityType";
import { getAuth, updateCurrentUser } from "firebase/auth";
import { authService } from "@/services/firebase.AuthService";
import { IUserProfile } from "../types/UserProfile";

interface SelectCustomEvent<T> {
	detail: { value: T };
	target: HTMLIonSelectElement;
}

const userProfile = ref<IUserProfile | null>(null);
const router = useRouter();
const db = getFirestore();
const auth = getAuth();

// Keeps track of all data input from the user towards adding a new activity
const newActivity = ref({
	type: "",
	duration: 0,
	calorieConsumption: 0,
	timestamp: Date.now(),
	userName: "",
	notes: "",
	imageUrl: "",
	id: "",
});

const activityTypes: Ref<IActivityType[]> = ref([]);

const isGuest = computed(() => {
	return localStorage.getItem("isGuest") === "true";
});

const activityCollection = collection(getFirestore(), "activities");

const handleTypeChange = (event: SelectCustomEvent<string>) => {
	newActivity.value.type = event.detail.value;
	console.log("Selected type:", newActivity.value.type);
};

// Fetch the user's name from the user profile
const fetchUserProfile = async (userId: string) => {
	const userRef = doc(db, "userProfile", userId);
	const userSnapshot = await getDoc(userRef);
	if (userSnapshot.exists()) {
		const userProfile = userSnapshot.data() as IUserProfile;
	} else {
		console.error("User profile not found");
	}
};

onMounted(async () => {
	if (auth.currentUser) {
		await fetchUserProfile(auth.currentUser.uid);
	}
});

// Open the device camera or file picker
const triggerCamera = async () => {
	const photo = await Camera.getPhoto({
		quality: 100,
		allowEditing: false,
		resultType: CameraResultType.Uri,
	});

	if (photo.webPath) {
		newActivity.value.imageUrl = photo.webPath;
	}
};

// Handle (preview) image removal
const removeImagePreview = () => {
	newActivity.value.imageUrl = "";
};

//Handle data POSTing
const postNewActivity = async () => {
	if (isGuest.value && newActivity.value.imageUrl) {
		alert("Guest user cannot upload images. Please register or log in");
		return;
	}

	try {
		// Generating a Unique ID for the new activity
		const generateUUID = uuidv4();
		const imageName = `activities/${generateUUID}-${new Date().getTime()}.jpg`;
		let imageUrl = ""; // Initialize imageUrl variable

		if (!isGuest && newActivity.value.imageUrl) {
			// If user has uploaded an image, upload it to Firebase Storage
			const storage = getStorage();
			const imageRef = storageRef(storage, imageName);
			const response = await fetch(newActivity.value.imageUrl);
			const blob = await response.blob();
			const snapshot = await uploadBytes(imageRef, blob);
			imageUrl = await getDownloadURL(snapshot.ref);
		} else {
			// Use the default image URL if the user hvaent uploaded an image
			imageUrl = "gs://fitplustds200.appspot.com/images/defaultActivity.jpg";
		}

		// Preparing the activity object with the imageUrl
		const activityData = {
			type: newActivity.value.type,
			duration: Number(newActivity.value.duration),
			calorieConsumption: Number(newActivity.value.calorieConsumption),
			timestamp: Date.now(),
			userName: isGuest.value ? "Guest" : "",
			notes: newActivity.value.notes,
			imageUrl: imageUrl,
		};

		console.log(activityData);

		await setDoc(doc(activityCollection, generateUUID), activityData);

		const successToast = await toastController.create({
			message: "Activity added successfully!",
			duration: 2000,
			position: "bottom",
			color: "success",
		});
		await successToast.present();
		router.replace("/activity");
	} catch (error) {
		const errorToast = await toastController.create({
			message: "Something went wrong, please try again",
			duration: 2000,
			position: "bottom",
			color: "danger",
		});
		await errorToast.present();
		console.error(error);
	}
};

async function fetchActivityTypes(): Promise<IActivityType[]> {
	const querySnapshot = await getDocs(collection(db, "activityTypes"));
	const types = querySnapshot.docs.map((doc) => ({
		...(doc.data() as IActivityType),
		id: doc.id,
	}));
	return types;
}

onMounted(async () => {
	activityTypes.value = await fetchActivityTypes();
});

// Form validation
const formIsValid = computed(() => {
	console.log("Type:", newActivity.value.type);
	console.log("Duration:", newActivity.value.duration);
	console.log("Calorie Consumption:", newActivity.value.calorieConsumption);
	const isValid =
		newActivity.value.type !== "" &&
		newActivity.value.duration > 0 &&
		newActivity.value.calorieConsumption > 0;
	console.log("Form is valid:", isValid);
	return isValid;
});
</script>

<template>
	<ion-page>
		<ion-header :translucent="true">
			<ion-toolbar>
				<ion-buttons slot="start">
					<ion-back-button default-href="/"></ion-back-button>
				</ion-buttons>
				<ion-title>Add New Activity</ion-title>
			</ion-toolbar>
		</ion-header>

		<ion-content :fullscreen="true">
			<ion-list>
				<ion-item>
					<ion-label>Activity Type</ion-label>
					<ion-select
						@ionChange="handleTypeChange($event)"
						placeholder="Select One">
						<ion-select-option
							v-for="type in activityTypes"
							:value="type.name"
							:key="type.id">
							{{ type.name }}
						</ion-select-option>
					</ion-select>
				</ion-item>

				<ion-item>
					<ion-label position="floating">Duration (minutes)</ion-label>
					<ion-input type="number" v-model="newActivity.duration"></ion-input>
				</ion-item>

				<ion-item>
					<ion-label position="floating">Calories Burned</ion-label>
					<ion-input
						type="number"
						v-model="newActivity.calorieConsumption"></ion-input>
				</ion-item>

				<ion-item>
					<ion-label position="floating">Notes (optional)</ion-label>
					<ion-textarea v-model="newActivity.notes"></ion-textarea>
				</ion-item>

				<ion-item>
					<ion-button
						@click="triggerCamera"
						:icon="cameraOutline"
						fill="outline"></ion-button>
					<ion-button
						@click="removeImagePreview"
						color="danger"
						fill="outline"
						v-if="newActivity.imageUrl"
						>Remove Image</ion-button
					>
				</ion-item>
				<ion-item lines="none" v-if="newActivity.imageUrl">
					<img
						:src="newActivity.imageUrl"
						alt="Activity image"
						style="max-width: 50%" />
				</ion-item>

				<ion-button
					@click="postNewActivity"
					expand="block"
					:disabled="!formIsValid.valueOf"
					>Submit Activity</ion-button
				>
			</ion-list>
		</ion-content>
	</ion-page>
</template>
