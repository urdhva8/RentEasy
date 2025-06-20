"use client";

import type { User, UserRole } from "@/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FullScreenCaption } from "@/components/layout/full-screen-caption";
import { supabase } from "@/lib/supabaseClient"; // Ensure this path is correct
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
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error.message);
            // Fallback: If profile fetch fails but auth user exists, 
            // set a basic user object. This can happen if the profile row hasn't been created yet
            // or if RLS prevents access (though select policy should allow own read).
            setUser({
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
                role: (supabaseUser.user_metadata?.role as UserRole) || 'tenant', // Or a default role
                phoneNumber: supabaseUser.user_metadata?.phone_number || undefined,
                profileImageUrl: supabaseUser.user_metadata?.profile_image_url || undefined,
            });
          } else if (profile) {
            setUser({
              id: profile.id,
              name: profile.name || '',
              email: profile.email || supabaseUser.email || '', 
              role: profile.role as UserRole,
              phoneNumber: profile.phone_number || undefined,
              profileImageUrl: profile.profile_image_url || undefined,
            });
          } else {
             // Profile not found, but user is authenticated. This can happen if profile insert failed.
             // Set basic user info from auth.
            console.warn(`Profile not found for user ${supabaseUser.id}. Setting user with basic auth info.`);
            setUser({ 
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'New User', 
                role: (supabaseUser.user_metadata?.role as UserRole) || 'tenant', // Default role
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
      // User data will be set by onAuthStateChange
      setPostAuthCaption("Finding a home made easy"); 
      // setLoading(false) will be handled by onAuthStateChange
      return true;
    }
    setLoading(false); // If no user and no error, explicitly set loading false
    return false;
  };

  const register = async (name: string, email: string, role: UserRole, pass: string, phoneNumber?: string): Promise<boolean> => {
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { // Optional: Pass metadata that might be useful (e.g., initial role, name)
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
      // User is created in auth, now create their profile in public.users
      // Ensure the 'id' from authData.user.id is used here to link the records
      // and satisfy RLS policies that check auth.uid() = id
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id, // Explicitly provide the user's ID
          name,
          email, // Store email in profile table too for easier querying if needed
          role,
          phone_number: phoneNumber,
          // profile_image_url is not set on registration initially
        });

      if (profileError) {
        console.error("Error creating user profile in Supabase:", profileError.message);
        // User is created in auth, but profile creation failed.
        // Consider cleanup or retry logic for a production app.
        // For now, onAuthStateChange will still pick up the auth user.
        setLoading(false); // Ensure loading is false on profile error
        return false; // Indicate failure if profile creation fails
      }
      
      // Profile created successfully
      if (role === 'owner') {
          setPostAuthCaption("Renting a home made easy");
      } else {
          setPostAuthCaption("Finding a home made easy");
      }
      // setLoading(false) will be handled by onAuthStateChange
      return true;
    }
    setLoading(false); 
    return false;
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Supabase logout error:", error.message);
    }
    // setUser(null) and setLoading(false) will be handled by onAuthStateChange
    setPostAuthCaption(null); 
    router.push("/login");
  };

  const updateProfileImage = async (imageUrl: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update({ profile_image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select('profile_image_url') 
      .single();

    if (error) {
      console.error("Error updating profile image URL in Supabase:", error.message);
      setLoading(false);
      return false;
    }

    if (updatedProfile) {
      setUser(prevUser => prevUser ? ({ ...prevUser, profileImageUrl: updatedProfile.profile_image_url || undefined }) : null);
    }
    setLoading(false);
    return true;
  };

  const isOwner = user?.role === 'owner';
  const isTenant = user?.role === 'tenant';

  if (postAuthCaption && user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return <FullScreenCaption text={postAuthCaption} />;
  }

  if (loading && !user && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
     // This handles the case where the app loads on a protected route without a user
     // And loading is true, meaning onAuthStateChange is still running.
     // AppLayout will also try to redirect, but this can provide an earlier loading screen.
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

// Also ensure your src/types/supabase.ts is correctly generated
// and your src/types/index.ts User interface matches what you store/fetch.
// The `users` table should have `id (uuid, pk, default auth.uid())`, `name (text)`, `email (text)`, `role (text)`, 
// `phone_number (text, nullable)`, `profile_image_url (text, nullable)`, `created_at (timestamptz)`, `updated_at (timestamptz)`.
// RLS policies:
// 1. SELECT for authenticated where auth.uid() = id
// 2. INSERT for authenticated with check auth.uid() = id
// 3. UPDATE for authenticated with check auth.uid() = id and using auth.uid() = id
