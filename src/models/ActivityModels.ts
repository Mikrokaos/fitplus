export interface IActivity {
	id?: string;
	type: string;
	duration: number;
	calorieConsumption: number;
	timestamp: number;
	userNickname: string;
	notes?: string;
	imageUrl?: string;
}
