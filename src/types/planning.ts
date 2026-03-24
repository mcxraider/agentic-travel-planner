export interface TripInputFormData {
  destination: string;
  destination_cities: string[];
  start_date: Date | undefined;
  end_date: Date | undefined;
  budget: number | '';
  currency: string;
  adults: number;
  children: number;
  elderly: number;
  budget_scope: string;
}
