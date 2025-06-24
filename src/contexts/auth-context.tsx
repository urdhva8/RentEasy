
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
  updateUserProfileData: (updatedData: { name?: string; phoneNumber?: string }) => Promise<boolean>; // New function
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
    if (user && !loading && postAuthCaption === "Logging in...") {
      if (user.role === 'owner') {
        setPostAuthCaption("Turn your property into profit — the easy way.");
      } else if (user.role === 'tenant') {
        setPostAuthCaption("Your perfect rental, just a click away");
      }
    }
  }, [user, loading, postAuthCaption]);


  useEffect(() => {
    if (postAuthCaption) {
        const timer = setTimeout(() => {
            setPostAuthCaption(null);
            router.push("/dashboard");
        }, 2000);
        return () => clearTimeout(timer);
    }
  }, [postAuthCaption, router]);


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
       // Profile creation is now handled by a trigger in Supabase.
      // We just set the appropriate login caption.
      if (role === 'owner') {
          setPostAuthCaption("Turn your property into profit — the easy way.");
      } else {
          setPostAuthCaption("Your perfect rental, just a click away");
      }
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
      .select('profile_image_url'); 

    setLoading(false);
    if (error) {
      console.error("Error updating profile image URL in Supabase:", error.message);
      return false;
    }
    
    if (updatedData && updatedData.length > 0) {
      setUser(prevUser => prevUser ? ({ ...prevUser, profileImageUrl: updatedData[0].profile_image_url || undefined }) : null);
      return true;
    } else {
      console.warn(`Profile image update: No user profile found in 'public.users' for id: ${user.id}. Image URL not updated in DB.`);
      return false; 
    }
  };

  const updateUserProfileData = async (updatedData: { name?: string; phoneNumber?: string }): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    const dataToUpdate: { name?: string; phone_number?: string; updated_at: string } = {
        updated_at: new Date().toISOString(),
    };
    if (updatedData.name !== undefined) dataToUpdate.name = updatedData.name;
    if (updatedData.phoneNumber !== undefined) dataToUpdate.phone_number = updatedData.phoneNumber;


    const { data: resultData, error } = await supabase
      .from('users')
      .update(dataToUpdate)
      .eq('id', user.id)
      .select('name, phone_number');
    
    setLoading(false);
    if (error) {
      console.error("Error updating user profile data in Supabase:", error.message);
      return false;
    }

    if (resultData && resultData.length > 0) {
      setUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          name: resultData[0].name || prevUser.name,
          phoneNumber: resultData[0].phone_number || prevUser.phoneNumber,
        };
      });
      return true;
    } else {
       console.warn(`User profile data update: No user profile found in 'public.users' for id: ${user.id} or no changes made.`);
       // It could also mean the data provided was the same as existing, so Supabase might not return data.
       // For simplicity, we'll treat it as potentially no row found if no data is returned.
       return false;
    }
  };


  const isOwner = user?.role === 'owner';
  const isTenant = user?.role === 'tenant';

  if (postAuthCaption) {
    return <FullScreenCaption text={postAuthCaption} />;
  }

  if (loading && !user && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
     return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfileImage, updateUserProfileData, loading, isOwner, isTenant }}>
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
