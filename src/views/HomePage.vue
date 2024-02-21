<script setup lang="ts">
import {
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
} from "@ionic/vue";
import { useRouter } from "vue-router";

const router = useRouter();

//function to navigate to the authentication page with the specified action
const goToAuth = (authAction) => {
	router.push({ name: "Authentication", query: { authAction: authAction } });
};
// if the user dont want to login or register, they can continue as guest
const continueAsGuest = () => {
	localStorage.setItem("isGuest", "true");
	router.push("/activity");
};
</script>

<template>
	<IonPage>
		<IonContent class="ion-padding custom-background" :fullscreen="true">
			<div class="welcome-card">
				<IonCard class="ion-text-center">
					<IonCardHeader>
						<IonCardTitle>Welcome to FitPlus!</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<div class="action-buttons">
							<IonButton @click="goToAuth('login')" color="black"
								>Login</IonButton
							>
							<IonButton @click="goToAuth('register')" color="black"
								>Register</IonButton
							>
							<IonButton @click="continueAsGuest" color="black"
								>Continue as Guest</IonButton
							>
						</div>
					</IonCardContent>
				</IonCard>
			</div>
		</IonContent>
	</IonPage>
</template>

<style scoped>
.custom-background {
	--background: #a7a2a2;
}

.welcome-card {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	border-radius: 20px;
}

.action-buttons {
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 20px;
}
</style>
