/**
 * Authentication abstraction layer
 *
 * Currently implemented with Supabase Auth.
 * MIGRATION NOTE: Replace Supabase calls with REST API calls to /auth/* endpoints.
 */

import { supabase } from './supabaseClient.js';
import type { SignUpCredentials, SignInCredentials, AuthUser, Session } from './types.js';

export async function signUp(credentials: SignUpCredentials) {
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        name: credentials.name,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(credentials: SignInCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  if (!data.session) return null;

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
    user: {
      id: data.session.user.id,
      email: data.session.user.email ?? '',
      user_metadata: data.session.user.user_metadata,
    },
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;

  if (!data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email ?? '',
    user_metadata: data.user.user_metadata,
  };
}

export function onAuthStateChange(callback: (user: AuthUser | null, event?: string) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (!session?.user) {
        callback(null, event);
        return;
      }

      callback({
        id: session.user.id,
        email: session.user.email ?? '',
        user_metadata: session.user.user_metadata,
      }, event);
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}
