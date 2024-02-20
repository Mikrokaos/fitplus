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
import AuthenticationPage from "./AuthenticationPage.vue";

const router = useRouter();
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
							<IonButton :router-link="'/authentication'" color="black"
								>Register</IonButton
							>
							<IonButton :router-link="'/authentication'" color="black"
								>Login</IonButton
							>
							<IonButton :router-link="'/activity'" color="black"
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
	--background: linear-gradient(135deg, #d54ffe 20%, #00f2fe 100%);
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
