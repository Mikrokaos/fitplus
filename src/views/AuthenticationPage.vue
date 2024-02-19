<script setup lang="ts">
import { authService } from "@/services/firebase.AuthService";
import {
	IonButton,
	IonContent,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonPage,
	IonToggle,
	toastController,
} from "@ionic/vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Camera, CameraResultType } from "@capacitor/camera";
import {
	getFirestore,
	doc,
	setDoc,
	getDocs,
	collection,
	query,
	where,
} from "firebase/firestore";
import { trashOutline } from "ionicons/icons";
import {
	getStorage,
	uploadBytes,
	getDownloadURL,
	ref as dbRef,
} from "firebase/storage";
import { getIdToken } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";

const router = useRouter();

const db = getFirestore();

const inRegisterMode = ref(false);

const userDetails = ref({
	id: "",
	name: "",
	email: "",
	password: "",
	profilePicture: "",
	userName: "",
});

const userProfilesCollection = collection(getFirestore(), "userProfile");

const login = async () => {
	try {
		const user = await authService.login(
			userDetails.value.email,
			userDetails.value.password
		);
		const idToken = await user.getIdToken(true);
		localStorage.setItem("idToken", idToken);
		router.replace("/home");
	} catch (error) {
		const toast = await toastController.create({
			message: "Invalid email or password",
			duration: 2000,
		});
		toast.present();
	}
};

const isUserNameUnique = async (userName: string) => {
	const userProfilesCollection = collection(getFirestore(), "userProfile");
	const querySnapshot = await getDocs(
		query(userProfilesCollection, where("userName", "==", userName))
	);
	return querySnapshot.empty;
};

const register = async () => {
	try {
		const userNameUnique = await isUserNameUnique(userDetails.value.userName);
		if (!userNameUnique) {
			const toast = await toastController.create({
				message: "Username already taken",
				duration: 2000,
			});
			toast.present();
			return;
		}
		await authService.register(
			userDetails.value.email,
			userDetails.value.password
		);
		await postProfilePicture();
		const { password, ...profileWithoutPassword } = userDetails.value;
		const userProfile = {
			...profileWithoutPassword,
		};
		await setDoc(
			doc(userProfilesCollection, userDetails.value.id),
			userProfile
		);
		await login();
	} catch (error) {
		console.error(error);
	}
};

const logout = async () => {
	try {
		await authService.logout();
		localStorage.removeItem("idToken");
		router.replace("/login");
	} catch (error) {
		console.error(error);
	}
};

const triggerCamera = async () => {
	const image = await Camera.getPhoto({
		quality: 100,
		allowEditing: true,
		resultType: CameraResultType.DataUrl,
	});
	if (image.webPath) {
		userDetails.value.profilePicture = image.webPath;
	}
};

const removeImagePreview = () => {
	userDetails.value.profilePicture = "";
};

const postProfilePicture = async () => {
	if (userDetails.value.profilePicture === "") {
		userDetails.value.profilePicture = "img/defaultProfilePicture.png";
		return;
	}
	try {
		const generateUUID = uuidv4();
		const imageName = `profilePictures/${generateUUID}-${new Date().getTime()}.jpg`;
		const storage = getStorage();
		const imageRef = dbRef(storage, imageName);
		const response = await fetch(userDetails.value.profilePicture);
		const blob = await response.blob();
		const snapshot = await uploadBytes(imageRef, blob);
		const url = await getDownloadURL(snapshot.ref);
		userDetails.value.profilePicture = url;

		userDetails.value.id = generateUUID;
		await setDoc(doc(userProfilesCollection, generateUUID), userDetails.value);
		const successToast = await toastController.create({
			message: "Profile created successfully!",
			duration: 2000,
			position: "bottom",
			color: "success",
		});
		await successToast.present();
		router.replace("/home");
	} catch {
		const errorToast = await toastController.create({
			message: "Something went wrong, please try again",
			duration: 2000,
			position: "bottom",
			color: "danger",
		});
		await errorToast.present();
	}
};
</script>
<template>
	<IonPage>
		<IonContent class="ion-padding">
			<IonList>
				<IonListHeader>
					<h1>{{ inRegisterMode ? "Register" : "Login" }}</h1>
				</IonListHeader>
				<IonItem>
					<IonLabel position="floating">Email</IonLabel>
					<IonInput v-model="userDetails.email" type="email"></IonInput>
				</IonItem>
				<IonItem>
					<IonLabel position="floating">Password</IonLabel>
					<IonInput v-model="userDetails.password" type="password"></IonInput>
				</IonItem>
				<IonItem v-if="inRegisterMode">
					<IonLabel position="floating">Name</IonLabel>
					<IonInput v-model="userDetails.name" type="text"></IonInput>
				</IonItem>
				<IonItem v-if="inRegisterMode">
					<IonLabel position="floating">Username</IonLabel>
					<IonInput v-model="userDetails.userName" type="text"></IonInput>
				</IonItem>
				<IonItem v-if="inRegisterMode">
					<IonLabel position="floating">Profile Picture</IonLabel>
					<IonInput v-model="userDetails.profilePicture" type="text"></IonInput>
					<IonButton @click="triggerCamera">Take Picture</IonButton>
					<IonButton @click="removeImagePreview">
						<IonIcon :icon="trashOutline"></IonIcon>
					</IonButton>
				</IonItem>
				<IonButton @click="inRegisterMode ? register() : login()">
					{{ inRegisterMode ? "Register" : "Login" }}
				</IonButton>
				<IonButton @click="inRegisterMode = !inRegisterMode">
					{{
						inRegisterMode
							? "Already have an account?"
							: "Don't have an account?"
					}}
				</IonButton>
			</IonList>
		</IonContent>
	</IonPage>
</template>
