<script setup lang="ts">
import {
	IonModal,
	IonSpinner,
	IonTextarea,
	IonBackButton,
	IonButton,
	IonAvatar,
	IonText,
	IonIcon,
	IonItem,
	IonListHeader,
	IonLabel,
	IonList,
	IonCardHeader,
	IonCardSubtitle,
	IonButtons,
	IonCard,
	IonCardContent,
	IonChip,
	IonContent,
	IonHeader,
	IonPage,
	IonTitle,
	IonToolbar,
	onIonViewDidEnter,
} from "@ionic/vue";
import { ref } from "vue";
import {
	chatboxOutline,
	arrowBack,
	trash,
	heart,
	heartOutline,
	constructOutline,
} from "ionicons/icons";
import { useRoute } from "vue-router";
import {
	collection,
	getDocs,
	getFirestore,
	query,
	where,
	getDoc,
	setDoc,
	updateDoc,
	doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { authService } from "@/services/firebase.AuthService";
import { Geolocation } from "@capacitor/geolocation";
import { GoogleMap } from "@capacitor/google-maps";
import { useRouter } from "vue-router";
import router from "@/router";

const route = useRoute();
</script>
