<script setup lang="ts">
import {
	IonButton,
	IonContent,
	IonHeader,
	IonPage,
	IonTitle,
	IonToolbar,
} from "@ionic/vue";
import { useRouter } from "vue-router";

// Use useRouter to access the router instance
const router = useRouter();
</script>

<template>
	<IonPage>
		<IonHeader>
			<IonToolbar>
				<ion-title :router-link="'/home'">FitPlus</ion-title>
				<IonButtons slot="end">
					<IonButton @click="router.push('/authentication')">Login</IonButton>
				</IonButtons>
			</IonToolbar>
		</IonHeader>
		<IonContent class="ion-padding"> </IonContent>
	</IonPage>
</template>
