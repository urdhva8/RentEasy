
"use client";

import type { User, UserRole } from "@/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FullScreenCaption } from "@/components/layout/full-screen-caption";
import { supabase } from "@/lib/supabaseClient";
import type { AuthChangeEvent, Session, User as SupabaseAuthUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, role: UserRole, pass: string, phoneNumber?: string) => Promise<boolean>;
  logout: () => Promise<void>; // Changed to Promise<void>
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
            .from('users') // Assumes a 'users' table in your Supabase public schema
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error.message);
            setUser(null);
          } else if (profile) {
            setUser({
              id: profile.id,
              name: profile.name || '',
              email: supabaseUser.email || '', // Use email from auth.user for consistency
              role: profile.role as UserRole, // Make sure 'role' column exists and stores valid UserRole
              phoneNumber: profile.phone_number || undefined,
              profileImageUrl: profile.profile_image_url || undefined,
            });
          } else {
            // User exists in auth.users but not in public.users table.
            // This might happen if profile creation failed after signup or for new social logins.
            // A robust app would handle profile creation here or guide the user.
            console.warn(`Profile not found for user ${supabaseUser.id}. Setting user with basic auth info.`);
            setUser({ // Fallback user object
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                name: supabaseUser.email?.split('@')[0] || 'New User', // Placeholder name
                role: 'tenant', // Default role, or consider a profile setup step
                profileImageUrl: undefined,
                phoneNumber: undefined,
            });
          }
        } else {
          setUser(null); // No active session
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Handle showing caption and then redirecting after login/registration
    if (postAuthCaption && user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
      const timer = setTimeout(() => {
        setPostAuthCaption(null);
        router.push("/dashboard");
      }, 2000); // Show caption for 2 seconds
      return () => clearTimeout(timer);
    }
    // Handle general redirection for authenticated users away from auth pages
    else if (!loading && !postAuthCaption && user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
      router.push("/dashboard");
    }
    // AppLayout will handle redirecting unauthenticated users from protected pages
  }, [user, loading, pathname, router, postAuthCaption]);


  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });

    if (error) {
      console.error("Supabase login error:", error.message);
      // setLoading(false) will be handled by onAuthStateChange
      return false;
    }

    if (data.user) {
      // onAuthStateChange will fetch profile and set user.
      // Set caption based on a temporary assumption or a quick profile peek if critical.
      // For simplicity, let's set a generic caption; onAuthStateChange will establish the user's role.
      setPostAuthCaption("Finding a home made easy"); // Or fetch role for specific caption
      return true;
    }
    // setLoading(false); // onAuthStateChange will handle this
    return false;
  };

  const register = async (name: string, email: string, role: UserRole, pass: string, phoneNumber?: string): Promise<boolean> => {
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: pass,
      // Supabase user_metadata for new users can be set here if needed,
      // but creating a separate profile in 'users' table is more common for public data.
    });

    if (authError) {
      console.error("Supabase registration error:", authError.message);
      // setLoading(false);
      return false;
    }

    if (authData.user) {
      // Insert user details into your public 'users' table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id, // Link to the auth.users table
          name,
          email, // Storing email in profile table can be convenient
          role,
          phone_number: phoneNumber,
          // profile_image_url will be null initially
        });

      if (profileError) {
        console.error("Error creating user profile in Supabase:", profileError.message);
        // User is created in auth, but profile creation failed.
        // Consider cleanup or retry logic for a production app.
        // For now, onAuthStateChange will still pick up the auth user.
      }
      
      if (role === 'owner') {
          setPostAuthCaption("Renting a home made easy");
      } else {
          setPostAuthCaption("Finding a home made easy");
      }
      // onAuthStateChange will set the user state.
      return true;
    }
    // setLoading(false);
    return false;
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Supabase logout error:", error.message);
    }
    // setUser(null) and setLoading(false) will be handled by onAuthStateChange
    setPostAuthCaption(null); // Clear any active caption
    router.push("/login");
  };

  const updateProfileImage = async (imageUrl: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    // Note: For production, `imageUrl` (if a data URI) should be uploaded to Supabase Storage,
    // and the public URL from storage saved here. This example directly saves the provided URL/data URI.
    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update({ profile_image_url: imageUrl })
      .eq('id', user.id)
      .select('profile_image_url') // Only select the field we care about
      .single();

    if (error) {
      console.error("Error updating profile image URL in Supabase:", error.message);
      setLoading(false);
      return false;
    }

    if (updatedProfile) {
      // Update local user state optimistically or based on returned data
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

  if (loading && !user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    // Show loading screen on auth pages if genuinely loading initial state
    return <LoadingScreen />;
  }
  
  // AppLayout also has a loading screen, this one is specific to AuthContext's initial load
  // or transitions managed by AuthContext. Avoid double loading screens if possible.
  // The primary loading screen for page protection is in AppLayout.
  // This loading state is more for transitions within AuthContext itself.

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
