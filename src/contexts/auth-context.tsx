
"use client";

import type { User, UserRole } from "@/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FullScreenCaption } from "@/components/layout/full-screen-caption";
import { supabase } from "@/lib/supabaseClient";
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, role: UserRole, pass: string, phoneNumber?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfileImage: (imageUrl: string) => Promise<boolean>;
  loading: boolean;
  isOwner: boolean;
  isTenant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen bg-background dark">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [postAuthCaption, setPostAuthCaption] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        const supabaseUser = session?.user;
        if (supabaseUser) {
          const { data: profiles, error } = await supabase
            .from('users')
            .select('id, name, email, role, phone_number, profile_image_url')
            .eq('id', supabaseUser.id);

          if (error) {
            console.error('Error fetching user profile:', error.message);
            // Fallback to auth data if profile fetch fails
            setUser({
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
                role: (supabaseUser.user_metadata?.role as UserRole) || 'tenant',
                phoneNumber: supabaseUser.user_metadata?.phone_number || undefined,
                profileImageUrl: supabaseUser.user_metadata?.profile_image_url || undefined,
            });
          } else if (profiles && profiles.length > 0) {
            if (profiles.length > 1) {
              console.warn(`Multiple profiles found for user ${supabaseUser.id}. Using the first one.`);
            }
            const profile = profiles[0];
            setUser({
              id: profile.id,
              name: profile.name || '',
              email: profile.email || supabaseUser.email || '',
              role: profile.role as UserRole,
              phoneNumber: profile.phone_number || undefined,
              profileImageUrl: profile.profile_image_url || undefined,
            });
          } else {
            // Profile not found in public.users, fallback to auth data
            console.warn(`Profile not found in public.users for authenticated user ${supabaseUser.id}. Using auth data as fallback.`);
            setUser({
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'New User',
                role: (supabaseUser.user_metadata?.role as UserRole) || 'tenant',
                profileImageUrl: supabaseUser.user_metadata?.profile_image_url || undefined,
                phoneNumber: supabaseUser.user_metadata?.phone_number || undefined,
            });
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && !loading && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
      if (postAuthCaption === "Logging in...") {
        if (user.role === 'owner') {
          setPostAuthCaption("Turn your property into profit — the easy way.");
        } else if (user.role === 'tenant') {
          setPostAuthCaption("Your perfect rental, just a click away");
        } else {
          setPostAuthCaption("Welcome to RentEasy!");
        }
      }
    }
  }, [user, loading, pathname, postAuthCaption]);


  useEffect(() => {
    if (postAuthCaption && user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
      const timer = setTimeout(() => {
        setPostAuthCaption(null);
        router.push("/dashboard");
      }, 2000);
      return () => clearTimeout(timer);
    }
    else if (!loading && !postAuthCaption && user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
      router.push("/dashboard");
    }
  }, [user, loading, pathname, router, postAuthCaption]);


  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });

    if (error) {
      console.error("Supabase login error:", error.message);
      setLoading(false);
      return false;
    }

    if (data.user) {
      setPostAuthCaption("Logging in...");
      // User state will be set by onAuthStateChange
      return true;
    }
    setLoading(false);
    return false;
  };

  const register = async (name: string, email: string, role: UserRole, pass: string, phoneNumber?: string): Promise<boolean> => {
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { 
          name: name,
          role: role,
          phone_number: phoneNumber
        }
      }
    });

    if (authError) {
      console.error("Supabase registration error:", authError.message);
      setLoading(false);
      return false;
    }

    if (authData.user) {
      // The user is created in auth.users. Now create their profile in public.users.
      // The `id` column in `public.users` should have `DEFAULT auth.uid()`.
      // The RLS policy for INSERT on `public.users` should be `WITH CHECK (auth.uid() = id)`.
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          // DO NOT explicitly set the `id` here; rely on the database default `auth.uid()`.
          name,
          email,
          role,
          phone_number: phoneNumber || null,
          profile_image_url: null,
          // `created_at` and `updated_at` should also have database defaults.
        });

      if (profileError) {
        console.error("Error creating user profile in Supabase:", profileError.message);
        // User is created in auth, but profile creation failed.
        // setLoading(false) will be handled by onAuthStateChange eventually, 
        // but for immediate feedback or retry, consider setting it here too.
        // For now, onAuthStateChange will still pick up the auth user.
        // Potentially, this could leave the user in a state where they are authenticated
        // but don't have a profile in public.users, which can cause issues later.
        setPostAuthCaption("Registration successful, profile data pending..."); // Indicate some issue
        // It might be better to return false or throw an error to signify incomplete registration.
        // However, for now, let's allow onAuthStateChange to proceed.
        return false; // Indicating profile creation failed.
      }
      
      // Profile creation successful
      if (role === 'owner') {
          setPostAuthCaption("Turn your property into profit — the easy way.");
      } else {
          setPostAuthCaption("Your perfect rental, just a click away");
      }
      // User state will be set by onAuthStateChange
      return true;
    }
    setLoading(false);
    return false;
  };

  const logout = async () => {
    setLoading(true); 
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase logout error:", error.message);
      }
    } catch (e) {
      console.error("Exception during Supabase signout:", e);
    } finally {
      setUser(null);
      setPostAuthCaption(null); 
      router.push("/login");
      setLoading(false); 
    }
  };

  const updateProfileImage = async (imageUrl: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    const { data: updatedData, error } = await supabase
      .from('users')
      .update({ profile_image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('profile_image_url'); // Select the column to confirm update

    if (error) {
      console.error("Error updating profile image URL in Supabase:", error.message);
      setLoading(false);
      return false;
    }

    // Check if the update actually returned data (i.e., if a row was found and updated)
    if (updatedData && updatedData.length > 0) {
      setUser(prevUser => prevUser ? ({ ...prevUser, profileImageUrl: updatedData[0].profile_image_url || undefined }) : null);
      setLoading(false);
      return true;
    } else {
      // This case means no row matched user.id, so nothing was updated.
      // This is a strong indication that the user's profile row is missing in `public.users`.
      console.warn(`Profile image update: No user profile found in 'public.users' for id: ${user.id}. Image URL not updated in DB.`);
      setLoading(false);
      return false; // Indicate failure as the DB was not updated.
    }
  };

  const isOwner = user?.role === 'owner';
  const isTenant = user?.role === 'tenant';

  if (postAuthCaption && user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return <FullScreenCaption text={postAuthCaption} />;
  }

  if (loading && !user && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
     return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfileImage, loading, isOwner, isTenant }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
