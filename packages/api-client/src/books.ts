/**
 * Books abstraction layer
 *
 * MIGRATION NOTE: When migrating to NestJS, replace Supabase calls
 * with REST API calls to /books/* endpoints.
 */

import { supabase } from './supabaseClient.js';
import type { Book, BookWithOwner, CreateBookInput, UpdateBookInput } from './types.js';

export interface BookFilters {
  genre?: string;
  is_lendable?: boolean;
  owner_id?: string;
  search?: string;
}

export async function getBooks(filters?: BookFilters): Promise<Book[]> {
  let query = supabase.from('books').select('*');

  if (filters?.genre) {
    query = query.eq('genre', filters.genre);
  }

  if (filters?.is_lendable !== undefined) {
    query = query.eq('is_lendable', filters.is_lendable);
  }

  if (filters?.owner_id) {
    query = query.eq('owner_id', filters.owner_id);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,author.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Book[];
}

export async function getUserBooks(userId: string): Promise<Book[]> {
  return getBooks({ owner_id: userId });
}

export async function getAvailableBooks(
  filters?: Omit<BookFilters, 'is_lendable'>,
): Promise<BookWithOwner[]> {
  let query = supabase
    .from('books')
    .select('*, owner:users!owner_id(id, email, display_name, avatar_url)')
    .eq('is_lendable', true);

  if (filters?.genre) {
    query = query.eq('genre', filters.genre);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,author.ilike.%${filters.search}%`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as BookWithOwner[];
}

export async function getBook(id: string): Promise<BookWithOwner> {
  const { data, error } = await supabase
    .from('books')
    .select('*, owner:users!owner_id(id, email, display_name, avatar_url)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as BookWithOwner;
}

export async function createBook(input: CreateBookInput): Promise<Book> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('books')
    .insert({ ...input, owner_id: userData.user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Book;
}

export async function updateBook(id: string, input: UpdateBookInput): Promise<Book> {
  const { data, error } = await supabase.from('books').update(input).eq('id', id).select().single();

  if (error) throw error;
  return data as Book;
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', id);

  if (error) throw error;
}
