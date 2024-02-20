export interface IActivity {
	id?: string;
	type: string;
	duration: number;
	calorieConsumption: number;
	timestamp: number;
	userName: string;
	notes?: string;
	imageUrl?: string;
	comments?: string[];
	location?: string;
}

export interface IActivityResponse {
	activities_by_id: IActivity;
}

export interface IActivityListResponse {
	activities: IActivity[];
}
