export interface IActivity {
	id?: string;
	type: string;
	duration: number;
	calorieConsumption: number;
	timestamp: number;
	userName: string;
	notes?: string;
	imageUrl?: string;
}
