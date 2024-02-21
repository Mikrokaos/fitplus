import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import HomePage from "../views/HomePage.vue";
import NewActivityPage from "../views/NewActivityPage.vue";
import AuthenticationPage from "../views/AuthenticationPage.vue";
import ActivityPage from "../views/ActivityPage.vue";
import DetailActivityPage from "../views/DetailActivityPage.vue";
import ProfilePage from "../views/ProfilePage.vue";

const routes: Array<RouteRecordRaw> = [
	{
		path: "/",
		redirect: "/home",
	},
	{
		path: "/home",
		name: "Home",
		component: HomePage,
	},
	{
		path: "/new-activity",
		name: "NewActivity",
		component: NewActivityPage,
	},
	{
		path: "/authentication",
		name: "Authentication",
		component: AuthenticationPage,
		props: true,
	},
	{
		path: "/activity",
		name: "Activity",
		component: ActivityPage,
	},
	{
		path: "/activity/:id",
		name: "ActivityDetails",
		component: DetailActivityPage,
	},
	{
		path: "/profile",
		name: "Profile",
		component: ProfilePage,
	},
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;
