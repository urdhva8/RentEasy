
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
            setUser({
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
                role: (supabaseUser.user_metadata?.role as UserRole) || 'tenant',
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
            console.warn(`Profile not found for user ${supabaseUser.id}. Setting user with basic auth info.`);
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
      setPostAuthCaption("Finding a home made easy"); 
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
      // User is created in auth, now create their profile in public.users
      // Rely on the 'id' column in 'users' table to have DEFAULT auth.uid()
      // And RLS policy WITH CHECK (auth.uid() = id)
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          // DO NOT provide 'id' here, let DB default handle it.
          name,
          email,
          role,
          phone_number: phoneNumber || null, // Ensure null if empty or undefined
          profile_image_url: null, // Explicitly set if not provided initially
        });

      if (profileError) {
        console.error("Error creating user profile in Supabase:", profileError.message);
        // User is created in auth, but profile creation failed.
        // setLoading(false) will be handled by onAuthStateChange eventually, 
        // but for immediate feedback or retry, consider setting it here too.
        setLoading(false); 
        return false; 
      }
      
      if (role === 'owner') {
          setPostAuthCaption("Renting a home made easy");
      } else {
          setPostAuthCaption("Finding a home made easy");
      }
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
