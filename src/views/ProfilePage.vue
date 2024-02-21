<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
	IonAvatar,
	IonButton,
	IonContent,
	IonHeader,
	IonInput,
	IonItem,
	IonIcon,
	IonLabel,
	IonPage,
	IonTextarea,
	IonTitle,
	IonToolbar,
} from "@ionic/vue";
import { arrowBackOutline } from "ionicons/icons";
import { useRouter } from "vue-router";
import { Camera, CameraResultType } from "@capacitor/camera";
import {
	doc,
	getDoc,
	getDocs,
	updateDoc,
	collection,
	query,
	where,
	getFirestore,
} from "firebase/firestore";
import {
	getDownloadURL,
	uploadBytes,
	ref as storageRef,
	getStorage,
} from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { authService } from "@/services/firebase.AuthService";
import defaultProfilePicture from "../assets/defaultProfilePic.png";

const router = useRouter();
const db = getFirestore();
const storage = getStorage();
const activities = ref([]);

const userDetails = ref({
	userName: "",
	bio: "",
	profilePicture: "",
	activitiesCount: 0,
	name: "",
	email: "",
});

const goBack = () => {
	router.back();
};

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

const fetchUserProfile = async (uid) => {
	try {
		const userRef = doc(db, "userProfile", uid);
		const userSnap = await getDoc(userRef);
		if (userSnap.exists()) {
			const userData = userSnap.data();
			userDetails.value = {
				...userData,
				profilePicture: userData.profilePicture || defaultProfilePicture,
			};
		} else {
			console.log("No user profile found for UID:", uid);
		}
	} catch (error) {
		console.error("Error fetching user profile:", error);
	}
};

const updateProfile = async () => {
	const user = authService.currentUser();
	if (user) {
		await updateDoc(doc(db, "userProfile", user.uid), {
			userName: userDetails.value.userName,
			bio: userDetails.value.bio,
			profilePicture: userDetails.value.profilePicture,
		});
	}
};

const triggerCamera = async () => {
	const image = await Camera.getPhoto({
		quality: 90,
		allowEditing: true,
		resultType: CameraResultType.Uri,
	});

	const blob = await fetch(image.webPath).then((res) => res.blob());
	const storagePath = `profilePictures/${authService.currentUser().uid}`;
	const imageRef = storageRef(storage, storagePath);

	await uploadBytes(imageRef, blob).then(async (snapshot) => {
		const downloadURL = await getDownloadURL(snapshot.ref);
		userDetails.value.profilePicture = downloadURL;
	});
};

console.log(db);
const user = authService.currentUser();
if (user) {
	console.log(user.uid);
}
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<IonButtons slot="start">
					<IonButton @click="goBack" color="black">
						<IonIcon :icon="arrowBackOutline" />
					</IonButton>
				</IonButtons>
				<IonTitle class="ion-text-center">FitPlus</IonTitle>
			</IonToolbar>
		</IonHeader>
		<IonContent class="ion-padding profile-content">
			<div class="profile-header">
				<IonAvatar class="profile-avatar">
					<img :src="userDetails.profilePicture || defaultProfilePicture" />
				</IonAvatar>
				<IonButton color="black" @click="triggerCamera"
					>Change Profile Picture</IonButton
				>
			</div>
			<div class="profile-info">
				<IonItem>
					<IonLabel position="floating">Name</IonLabel>
					<IonInput v-model="userDetails.name" readonly />
				</IonItem>
				<IonItem>
					<IonLabel position="floating">Email</IonLabel>
					<IonInput v-model="userDetails.email" readonly />
				</IonItem>
				<IonItem>
					<IonLabel position="floating">Username</IonLabel>
					<IonInput v-model="userDetails.userName" type="text" />
				</IonItem>
				<IonItem>
					<IonLabel position="floating">Bio</IonLabel>
					<IonTextarea v-model="userDetails.bio" />
				</IonItem>
			</div>
			<IonButton expand="block" @click="updateProfile" color="black"
				>Save Changes</IonButton
			>
		</IonContent>
	</IonPage>
</template>

<style scoped>
.profile-content {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.profile-header {
	margin-bottom: 20px;
	text-align: center;
}

.profile-avatar {
	margin-bottom: 15px;
}

.profile-info {
	width: 100%;
}
</style>
