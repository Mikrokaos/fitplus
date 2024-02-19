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
import { add, trashOutline } from "ionicons/icons";
import { IActivityType } from "@/types/ActivityType";
import defaultActivity from "../defaultActivity.jpg";

const router = useRouter();

const db = getFirestore();

// Keeps track of all data input from the user towards adding a new activity
const newActivity = ref({
	type: "",
	duration: 0,
	calorieConsumption: 0,
	timestamp: Date.now(), // Current date and time
	// userNickname: "",
	notes: "",
	imageUrl: "",
	id: "",
});

const activityTypes: Ref<IActivityType[]> = ref([]);

const activityCollection = collection(getFirestore(), "activities");

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
	if (!newActivity.value.imageUrl) {
		newActivity.value.imageUrl = defaultActivity;
		return;
	}

	try {
		// Generating a Unique ID for the new activity
		const generateUUID = uuidv4();
		// Creating a Unique Image Name
		const imageName = `activities/${generateUUID}-${new Date().getTime()}.jpg`;
		// Creating storage reference
		const storage = getStorage();
		const imageRef = storageRef(storage, imageName);
		// Fetching the image as blob
		const response = await fetch(newActivity.value.imageUrl);
		const blob = await response.blob();
		// Uploading the image to the storage
		const snapshot = await uploadBytes(imageRef, blob);
		// Getting the download URL
		const downloadURL = await getDownloadURL(snapshot.ref);
		// Updating the Activity object
		newActivity.value.imageUrl = downloadURL;
		newActivity.value.id = generateUUID;
		// Adding the new activity to the database
		await setDoc(doc(activityCollection, generateUUID), newActivity.value);

		const successToast = await toastController.create({
			message: "Activity added successfully!",
			duration: 2000,
			position: "bottom",
			color: "success",
		});
		await successToast.present();
		// Redirecting to the home page
		router.replace("/home");
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
	console.log(types); // Check the fetched data
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
					<ion-select v-model="newActivity.type" placeholder="Select One">
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
					<ion-button @click="triggerCamera" expand="block"
						>Upload Image</ion-button
					>
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
						style="max-width: 100%" />
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
