
export type VisitorType = 'child' | 'family' | 'tourist';
export type Language = 'ar' | 'en';
export type PlantStatus = 'seed' | 'grow' | 'bloom' | 'fruit';

export interface VisitorInfo {
  name: string;
  type: VisitorType;
  language: Language;
}

export interface PlantMemory {
  id: string;
  visitorName: string;
  visitorType: VisitorType;
  language: Language;
  imageUrl: string;
  title: string;
  story: string;
  funFact: string;
  question: string;
  plantNickname: string;
  status: PlantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AIResponse {
  is_plant?: boolean;
  error_message?: string;
  title: string;
  story: string;
  fun_fact: string;
  question: string;
  suggested_plant_name: string;
  seasonal_status_hint: string;
}
