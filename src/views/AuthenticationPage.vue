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
	IonTitle,
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
		localStorage.removeItem("isGuest"); // Remove the guest flag if it exists
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
		// Capture the returned user object from the authService.register call
		const user = await authService.register(
			userDetails.value.email,
			userDetails.value.password
		);

		// Post the profile picture and get its URL
		const profilePictureUrl = await postProfilePicture();

		const { password, ...userProfileData } = userDetails.value;
		const userProfile = {
			...userProfileData,
			id: user.uid,
			profilePicture: profilePictureUrl,
		};

		// Create the user profile document in Firestore
		await setDoc(doc(db, "userProfiles", user.uid), userProfile);

		// Optionally, log the user in immediately after registration
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
		allowEditing: false,
		resultType: CameraResultType.Uri,
	});
	if (image.webPath) {
		console.log(image.webPath);
		userDetails.value.profilePicture = image.webPath;
	}
};

const removeImagePreview = () => {
	userDetails.value.profilePicture = "";
};

const postProfilePicture = async () => {
	if (userDetails.value.profilePicture === "") {
		alert("You have to upload a profile picture first!");
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
		<IonContent class="ion-padding custom-background">
			<div class="login-content">
				<IonCard class="login-card">
					<IonList>
						<IonListHeader>
							<IonTitle class="ion-text-center">{{
								inRegisterMode ? "Register" : "Login"
							}}</IonTitle>
						</IonListHeader>
						<IonItem>
							<IonLabel position="floating">Email</IonLabel>
							<IonInput v-model="userDetails.email" type="email"></IonInput>
						</IonItem>
						<IonItem>
							<IonLabel position="floating">Password</IonLabel>
							<IonInput
								v-model="userDetails.password"
								type="password"></IonInput>
						</IonItem>
						<IonItem v-if="inRegisterMode">
							<IonLabel position="floating">Name</IonLabel>
							<IonInput v-model="userDetails.name" type="text"></IonInput>
						</IonItem>
						<IonItem v-if="inRegisterMode">
							<IonLabel position="floating">Username</IonLabel>
							<IonInput v-model="userDetails.userName" type="text"></IonInput>
						</IonItem>
						<IonItem v-if="inRegisterMode && !userDetails.profilePicture">
							<IonButton
								@click="triggerCamera"
								class="image-picker"
								color="light">
								Add Profile Picture
							</IonButton>
						</IonItem>
						<section v-if="inRegisterMode && userDetails.profilePicture">
							<img
								:src="userDetails.profilePicture"
								alt="Profile picture preview" />
							<IonButton
								@click="removeImagePreview"
								fill="default"
								class="remove-image-preview">
								<IonIcon
									slot="icon-only"
									:icon="trashOutline"
									color="danger"></IonIcon>
							</IonButton>
						</section>
						<IonButton
							class="ion-center"
							sise="default"
							@click="inRegisterMode ? register() : login()">
							{{ inRegisterMode ? "Register" : "Login" }}
						</IonButton>
						<IonButton size="default" @click="inRegisterMode = !inRegisterMode">
							{{ inRegisterMode ? "Already have an account?" : "Register?" }}
						</IonButton>
					</IonList>
				</IonCard>
			</div>
		</IonContent>
	</IonPage>
</template>
<style scoped>
.custom-background {
	--background: linear-gradient(135deg, #00f2fe 0%, #d54ffe 100%);
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
}

.login-content {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100%;
	width: 100%;
}
.login-card {
	width: 85vw;
	max-width: 400px;
	margin: auto;
	border-radius: 20px;

	padding: 20px;
	background: rgb(31, 30, 30);
}

.image-picker {
	height: auto;
	padding: 10px;
	border: 2px dashed #8a8a8a;
	border-radius: 8px;
	font-size: medium;
	text-align: center;
	cursor: pointer;
}
</style>
