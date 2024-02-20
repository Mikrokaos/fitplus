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
	IonText,
	IonToggle,
	toastController,
} from "@ionic/vue";
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
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
import { trashOutline, cameraOutline } from "ionicons/icons";
import {
	getStorage,
	uploadBytes,
	getDownloadURL,
	ref as dbRef,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

const router = useRouter();
const route = useRoute();

const db = getFirestore();

const inLoginMode = ref(false);
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

onMounted(() => {
	const authAction = route.query.authAction;
	console.log("Auth action:", authAction);
	if (authAction === "register") {
		inRegisterMode.value = true;
		inLoginMode.value = false;
	} else if (authAction === "login") {
		inLoginMode.value = true;
		inRegisterMode.value = false;
	}
});

const login = async () => {
	try {
		const user = await authService.login(
			userDetails.value.email,
			userDetails.value.password
		);
		const idToken = await user.getIdToken(true);
		localStorage.setItem("idToken", idToken);
		localStorage.removeItem("isGuest"); // Remove the guest flag if it exists
		router.replace("/activity");
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

const navigateToRegister = () => {
	inRegisterMode.value = true;
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
		router.replace("/home");
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
		router.replace("/activity");
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

const navigateToLogin = () => {
	inRegisterMode.value = false;
};
</script>
<template>
	<IonPage>
		<IonContent class="ion-padding custom-background">
			<div class="login-content">
				<IonCard class="login-card">
					<IonList>
						<IonListHeader>
							<IonTitle class="ion-text-center title">
								{{ inRegisterMode ? "Register" : "Login" }}
							</IonTitle>
						</IonListHeader>

						<IonItem class="input-item">
							<IonLabel position="floating">Email</IonLabel>
							<IonInput v-model="userDetails.email" type="email"></IonInput>
						</IonItem>

						<IonItem class="input-item">
							<IonLabel position="floating">Password</IonLabel>
							<IonInput
								v-model="userDetails.password"
								type="password"></IonInput>
						</IonItem>

						<template v-if="inRegisterMode">
							<IonItem class="input-item">
								<IonLabel position="floating">Name</IonLabel>
								<IonInput v-model="userDetails.name" type="text"></IonInput>
							</IonItem>
							<IonItem class="input-item">
								<IonLabel position="floating">Username</IonLabel>
								<IonInput v-model="userDetails.userName" type="text"></IonInput>
							</IonItem>
							<div class="profile-pic-upload">
								<IonButton fill="clear" @click="triggerCamera" color="white">
									<IonIcon
										:icon="cameraOutline"
										size="large"
										color="light"></IonIcon>
								</IonButton>
								<div v-if="userDetails.profilePicture" class="image-preview">
									<img
										:src="userDetails.profilePicture"
										alt="Profile picture preview" />
									<IonButton fill="clear" @click="removeImagePreview">
										<IonIcon :icon="trashOutline" color="danger"></IonIcon>
									</IonButton>
								</div>
							</div>
						</template>

						<IonButton
							expand="block"
							@click="inRegisterMode ? register() : login()"
							class="auth-button"
							color="light">
							{{ inRegisterMode ? "Confirm" : "Login" }}
						</IonButton>
					</IonList>
				</IonCard>
			</div>
		</IonContent>
	</IonPage>
</template>

<style scoped>
.custom-background {
	--background: #a7a2a2;
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
	width: 100%;
}

.login-card {
	width: 85vw;
	max-width: 400px;
	margin: auto;
	border-radius: 8px;
	padding: 20px;
	background: #1f1e1e;
}

.title {
	font-size: 1.5rem; /* Adjust title font size */
}

.input-item {
	--padding-start: 0;
	--padding-end: 0;
	--inner-padding-end: 0;
	--inner-padding-start: 0;
}

.profile-pic-upload {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-top: 15px;
}

.image-preview img {
	width: 100px; /* Adjust image preview size */
	height: 100px;
	object-fit: cover;
	border-radius: 50%;
}

.auth-button {
	margin-top: 20px;
}
</style>
