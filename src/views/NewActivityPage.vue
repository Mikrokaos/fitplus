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
import {
	add,
	camera,
	cameraOutline,
	logOut,
	trashOutline,
} from "ionicons/icons";
import { IActivityType } from "@/types/ActivityType";
import { getAuth, updateCurrentUser } from "firebase/auth";
import { authService } from "@/services/firebase.AuthService";
import { IUserProfile } from "../types/UserProfile";
import MapPicker from "@/components/MapPicker.vue";

interface SelectCustomEvent<T> {
	detail: { value: T };
	target: HTMLIonSelectElement;
}

const storage = getStorage();
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
	location: {
		latitude: null,
		longitude: null,
	},
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

const handleLocationChange = (location) => {
	newActivity.value.location.latitude = location.latitude;
	newActivity.value.location.longitude = location.longitude;
	console.log("Location updated:", newActivity.value.location);
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
	} else {
		console.error("No photo taken");
	}
};

// Handle (preview) image removal
const removeImagePreview = () => {
	newActivity.value.imageUrl = "";
};

onMounted(async () => {
	const user = authService.currentUser();
	if (user) {
		const userRef = doc(db, "userProfile", user.uid);
		const docSnap = await getDoc(userRef);
		if (docSnap.exists()) {
			userProfile.value = docSnap.data(); // Assuming this contains userName
		}
	}
});

//Handle data POSTing
const postNewActivity = async () => {
	if (
		!newActivity.value.type ||
		newActivity.value.duration <= 0 ||
		newActivity.value.calorieConsumption <= 0
	) {
		alert("Please fill in all required fields");
		return;
	}

	try {
		//const userId = authService.currentUser()?.uid || "guest";
		const userName = userProfile.value ? userProfile.value.userName : "Guest";
		const generateUUID = uuidv4();
		let imageUrl = newActivity.value.imageUrl;

		if (imageUrl) {
			const imageName = `activities/${generateUUID}-${Date.now()}.jpg`;
			const imageRef = storageRef(storage, imageName);
			const blob = await (await fetch(imageUrl)).blob();
			const snapshot = await uploadBytes(imageRef, blob);
			imageUrl = await getDownloadURL(snapshot.ref);
		}

		const activityData = {
			...newActivity.value,
			userName,
			imageUrl,
		};

		await setDoc(doc(activityCollection, generateUUID), activityData);
		toastController
			.create({
				message: "Activity added successfully!",
				duration: 2000,
				color: "success",
			})
			.then((toast) => toast.present());
		router.replace("/activity");
	} catch (error) {
		toastController
			.create({
				message: `Error: ${error.message}`,
				duration: 2000,
				color: "danger",
			})
			.then((toast) => toast.present());
		console.error("Error posting new activity", error);
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
				<ion-title>FitPlus</ion-title>
			</ion-toolbar>
		</ion-header>

		<ion-content :fullscreen="true" class="ion-padding">
			<div style="max-width: 600px; margin: auto">
				<ion-card>
					<ion-card-header>
						<ion-card-title>Add New Activity</ion-card-title>
					</ion-card-header>

					<ion-card-content>
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
								<ion-input
									type="number"
									v-model="newActivity.duration"></ion-input>
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

							<MapPicker
								mode="editable"
								:initialLatitude="currentLatitude"
								:initialLongitude="currentLongitude"
								@location-changed="handleLocationChange" />

							<ion-item>
								<ion-button @click="triggerCamera" color="black" size="large">
									<ion-icon slot="start" :icon="cameraOutline" />
								</ion-button>
								<ion-button
									@click="removeImagePreview"
									color="danger"
									v-if="newActivity.imageUrl">
									<ion-icon slot="start" :icon="trashOutline" />Remove
								</ion-button>
							</ion-item>

							<ion-item lines="none" v-if="newActivity.imageUrl">
								<img
									:src="newActivity.imageUrl"
									alt="Activity image"
									style="max-width: 100%; display: block; margin: auto" />
							</ion-item>

							<ion-button
								@click="postNewActivity"
								color="black"
								:disabled="!formIsValid">
								Submit Activity
							</ion-button>
						</ion-list>
					</ion-card-content>
				</ion-card>
			</div>
		</ion-content>
	</ion-page>
</template>
