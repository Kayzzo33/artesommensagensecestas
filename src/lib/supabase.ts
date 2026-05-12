import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://gyghrqnhaiazxtdwylbs.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5Z2hycW5oYWlhenh0ZHd5bGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDE5MDYsImV4cCI6MjA5NDE3NzkwNn0.YQCA6jJeBMHcN1yX9lh4SwN6a9UZq7ISNAnGH_6ls9o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  is_promo: boolean;
  display_order: number;
  active: boolean;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  cost_price: number | null;
  category_id: string | null;
  images: string[];
  allows_message: boolean;
  message_fee: number;
  featured: boolean;
  active: boolean;
  stock_qty: number;
};

export type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
};

export type Neighborhood = {
  id: string;
  name: string;
  shipping_fee: number;
  active: boolean;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  neighborhood_id: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  items: unknown;
  subtotal: number;
  shipping_fee: number;
  total: number;
  personal_message: string | null;
  notes: string | null;
  status: string;
  whatsapp_sent: boolean;
  created_at: string;
};

export type StoreSettings = {
  id: number;
  whatsapp_number: string;
  whatsapp_message_template: string | null;
  store_name: string;
  store_logo_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  address: string | null;
  opening_hours: string | null;
};

export type FinancialRecord = {
  id: string;
  type: 'receita' | 'despesa';
  amount: number;
  description: string;
  category: string | null;
  reference_date: string;
  created_at: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  cost_price: number;
  quantity: number;
  minimum_qty: number;
  category: string | null;
  supplier: string | null;
  notes: string | null;
  created_at: string;
};
