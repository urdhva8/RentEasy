
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
          const { data: profile, error } = await supabase
            .from('users')
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
              email: supabaseUser.email || '', 
              role: profile.role as UserRole,
              phoneNumber: profile.phone_number || undefined,
              profileImageUrl: profile.profile_image_url || undefined,
            });
          } else {
            console.warn(`Profile not found for user ${supabaseUser.id}. Setting user with basic auth info.`);
            setUser({ 
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                name: supabaseUser.email?.split('@')[0] || 'New User', 
                role: 'tenant', 
                profileImageUrl: undefined,
                phoneNumber: undefined,
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
      return false;
    }

    if (data.user) {
      setPostAuthCaption("Finding a home made easy"); 
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, role: UserRole, pass: string, phoneNumber?: string): Promise<boolean> => {
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: pass,
    });

    if (authError) {
      console.error("Supabase registration error:", authError.message);
      setLoading(false); // Ensure loading is false on error
      return false;
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          // id: authData.user.id, // Let the DB default (auth.uid()) handle this
          name,
          email, 
          role,
          phone_number: phoneNumber,
        });

      if (profileError) {
        console.error("Error creating user profile in Supabase:", profileError.message);
        // User is created in auth, but profile creation failed.
        // setLoading(false) will be handled by onAuthStateChange eventually, 
        // but for immediate feedback or retry, consider setting it here too.
        // For now, let onAuthStateChange handle it.
        // We might want to sign out the user or delete the auth user if profile creation is critical
        // For now, it will proceed, and onAuthStateChange will fetch basic info.
        return false; // Indicate failure if profile creation fails
      }
      
      if (role === 'owner') {
          setPostAuthCaption("Renting a home made easy");
      } else {
          setPostAuthCaption("Finding a home made easy");
      }
      return true;
    }
    setLoading(false); // Ensure loading is false if authData.user is null
    return false;
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Supabase logout error:", error.message);
    }
    setPostAuthCaption(null); 
    router.push("/login");
    // setUser(null) and setLoading(false) will be handled by onAuthStateChange
  };

  const updateProfileImage = async (imageUrl: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    const { data: updatedProfile, error } = await supabase
      .from('users')
      .update({ profile_image_url: imageUrl })
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

  // Adjusted loading condition slightly to avoid flash of loading screen if postAuthCaption is active
  if (loading && !postAuthCaption && (pathname.startsWith('/login') || pathname.startsWith('/register') || !user)) {
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
