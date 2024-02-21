import {
	getAuth,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
} from "firebase/auth";

export const authService = {
	async register(email: string, password: string) {
		const userCredential = await createUserWithEmailAndPassword(
			getAuth(),
			email,
			password
		);
		return userCredential?.user;
	},
	async login(email: string, password: string) {
		const userCredential = await signInWithEmailAndPassword(
			getAuth(),
			email,
			password
		);
		return userCredential?.user;
	},
	async logout() {
		return await signOut(getAuth());
	},
	currentUser() {
		return getAuth().currentUser;
	},
};
