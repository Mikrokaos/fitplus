import { createRouter, createWebHistory } from "@ionic/vue-router";
import { RouteRecordRaw } from "vue-router";
import HomePage from "../views/HomePage.vue";
import NewActivityPage from "../views/NewActivityPage.vue";
import AuthenticationPage from "../views/AuthenticationPage.vue";
import ActivityPage from "../views/ActivityPage.vue";

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
		name: "Login",
		component: AuthenticationPage,
	},
	{
		path: "/activity",
		name: "Activity",
		component: ActivityPage,
	},
];

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
});

export default router;
