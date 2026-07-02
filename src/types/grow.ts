export interface Strain {
  id: string;
  user_id?: string;
  name: string;
  type: 'Híbrido' | 'Índica' | 'Sativa' | 'CBD';
}

export interface Lot {
  id: string;
  user_id?: string;
  name: string;
  strain: string;
  plant_count: number;
  stage: 'Germinación' | 'Vegetativo' | 'Floración' | 'Secado' | 'Curado';
  start_date: string;
  notes?: string;
  is_archived: boolean;
}

export interface Log {
  id: string;
  user_id?: string;
  lot_id: string;
  date: string;
  temp: number;
  humidity: number;
  vpd: number;
  ph?: number;
  ec?: number;
  water_amount?: number;
  watered_by?: string;
  notes?: string;
}

export interface Task {
  id: string;
  user_id?: string;
  lot_id: string;
  title: string;
  date: string;
  type: 'riego' | 'fertilizante' | 'poda' | 'preventivo' | 'otro';
  notes?: string;
  is_completed: boolean;
}

export interface Helper {
  id: string;
  user_id?: string;
  name: string;
}


