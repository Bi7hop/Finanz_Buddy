export interface Transaction {
    id: number;
    created_at: string;
    user_id: string;
    amount: number;
    date: string;
    description: string;
    category: string;
    type: string;
    updated_at: string;
  }