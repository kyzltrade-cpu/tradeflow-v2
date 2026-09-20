import { createClient } from './server';
import type { Inquiry, Quote, Supplier, Customer, QuoteCostComponent, SupplierQuote, User } from '../db-types';

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  return data as User | null;
}

export async function getInquiries(companyId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('inquiries')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  return (data || []) as Inquiry[];
}

export async function getQuotes(companyId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('quotes')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  return (data || []) as Quote[];
}

export async function getSuppliers(companyId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  return (data || []) as Supplier[];
}

export async function getCustomers(companyId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  return (data || []) as Customer[];
}

export async function getQuoteCostComponents(quoteId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('quote_cost_components')
    .select('*')
    .eq('quote_id', quoteId)
    .order('sort_order');
  return (data || []) as QuoteCostComponent[];
}

export async function getSupplierQuotes(companyId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('supplier_quotes')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  return (data || []) as SupplierQuote[];
}
