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
	ref as storageRef,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

// initializing storage and database, define reactive states
const router = useRouter();
const route = useRoute();
const storage = getStorage();
const db = getFirestore();

const inLoginMode = ref(false);
const inRegisterMode = ref(false);

// if no profile picture is provided, use the default profile picture
const defaultProfilePic =
	"https://firebasestorage.googleapis.com/v0/b/fitplustds200.appspot.com/o/profilePictures%2FdefaultProfilePic.png?alt=media&token=d3a65220-6f07-469e-a4ca-1ce4466a21f1";

// define the user details object
const userDetails = ref({
	id: "",
	name: "",
	email: "",
	password: "",
	profilePicture: "",
	userName: "",
});

// lifecycle hook to check the auth action and set the mode accordingly
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

// function to login the user
const login = async () => {
	// call the login method from the auth service
	try {
		const user = await authService.login(
			userDetails.value.email,
			userDetails.value.password
		);
		// if the user is logging in as guest, get the id token and store it in local storage
		const idToken = await user.getIdToken(true);
		localStorage.setItem("idToken", idToken);
		localStorage.removeItem("isGuest");
		router.replace("/activity");
	} catch (error) {
		const toast = await toastController.create({
			message: "Invalid email or password",
			duration: 2000,
		});
		toast.present();
	}
};
// function to register the user
const register = async () => {
	// call the register method from the auth service
	try {
		const userCredential = await authService.register(
			userDetails.value.email,
			userDetails.value.password
		);
		// if the user is registered successfully, create the user profile
		if (userCredential && userCredential.uid) {
			const uid = userCredential.uid;
			let profilePictureUrl = userDetails.value.profilePicture
				? await uploadProfilePicture(userDetails.value.profilePicture, uid)
				: defaultProfilePic;
			// set the user profile data in the firestore
			await setDoc(doc(db, "userProfile", uid), {
				name: userDetails.value.name,
				email: userDetails.value.email,
				userName: userDetails.value.userName,
				profilePicture: profilePictureUrl,
			});

			console.log("User profile created with UID:", uid);
			// login the user after registration
			await login(userDetails.value.email, userDetails.value.password);
		} else {
			throw new Error("No user credential returned.");
		}
	} catch (error) {
		console.error("Registration error:", error);
		alert("Registration failed: " + error.message);
	}
};

// Function to upload the profile picture to Firebase Storage and return the URL
async function uploadProfilePicture(filePath, userId) {
	const fileRef = storageRef(storage, `profilePictures/${userId}-${uuidv4()}`);
	const blob = await fetch(filePath).then((r) => r.blob());
	const snapshot = await uploadBytes(fileRef, blob);
	return getDownloadURL(snapshot.ref);
}

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
								<ion-button @click="triggerCamera" color="black">
									<ion-icon size="large" :icon="cameraOutline" />
								</ion-button>
								<div v-if="userDetails.profilePicture" class="image-preview">
									<img
										:src="userDetails.profilePicture"
										alt="Profile picture preview" />
									<ion-button @click="removeImagePreview" color="danger"
										><ion-icon size="small" :icon="trashOutline"
									/></ion-button>
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
