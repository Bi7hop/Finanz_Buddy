export interface Budget {
  id: number;
  created_at: string;
  user_id: string;
  category: string;       
  category_icon?: string; 
  amount: number;
  period: string;
  updated_at: string;
}