
"use client";

import type { User, UserRole } from "@/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MOCK_USERS, saveMockUsers, updateUserProfileImage as apiUpdateUserProfileImage } from "@/lib/mock-data";
import { FullScreenCaption } from "@/components/layout/full-screen-caption";

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, role: UserRole, pass: string, phoneNumber?: string) => Promise<boolean>;
  logout: () => void;
  updateProfileImage: (imageUrl: string) => Promise<boolean>;
  loading: boolean;
  isOwner: boolean;
  isTenant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = "renteasy_user";

const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen bg-background dark">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // True until initial user check from localStorage is done
  const [postAuthCaption, setPostAuthCaption] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }
    setLoading(false); // Initial user check complete
  }, []);

  useEffect(() => {
    // Handle showing caption and then redirecting
    if (postAuthCaption && user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
      const timer = setTimeout(() => {
        setPostAuthCaption(null);
        router.push("/dashboard");
      }, 3000);
      return () => clearTimeout(timer);
    }
    // Handle general redirection logic when not showing a caption and initial load is done
    else if (!loading && !postAuthCaption) {
      if (user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
        router.push("/dashboard");
      } else if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/register') && pathname !== '/help') {
        // router.push("/login"); // Kept commented as per previous interaction
      }
    }
  }, [user, loading, pathname, router, postAuthCaption]);


  const login = async (email: string, pass: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    const foundUser = MOCK_USERS.find(u => u.email === email);
    if (foundUser) {
      const userToStore: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
        phoneNumber: foundUser.phoneNumber,
        profileImageUrl: foundUser.profileImageUrl,
      };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userToStore));
      setUser(userToStore);
      if (userToStore.role === 'owner') {
        setPostAuthCaption("Renting a home made easy");
      } else {
        setPostAuthCaption("Finding a home made easy");
      }
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, role: UserRole, pass: string, phoneNumber?: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
    if (MOCK_USERS.find(u => u.email === email)) {
      return false;
    }
    const newUser: User = { id: String(Date.now()), name, email, role, phoneNumber, profileImageUrl: undefined };
    MOCK_USERS.push(newUser);
    saveMockUsers();

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
    if (newUser.role === 'owner') {
        setPostAuthCaption("Renting a home made easy");
      } else {
        setPostAuthCaption("Finding a home made easy");
      }
    return true;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
    setPostAuthCaption(null);
    router.push("/login");
  };

  const updateProfileImage = async (imageUrl: string): Promise<boolean> => {
    if (!user) return false;
    // setLoading(true); // This might be for a different kind of loading state (e.g., image upload in progress)
    const updatedUser = apiUpdateUserProfileImage(user.id, imageUrl);
    if (updatedUser) {
      setUser(updatedUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      // setLoading(false);
      return true;
    }
    // setLoading(false);
    return false;
  };

  const isOwner = user?.role === 'owner';
  const isTenant = user?.role === 'tenant';

  // --- Render Logic ---

  // 1. If post-authentication caption should be shown
  if (postAuthCaption && user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    return <FullScreenCaption text={postAuthCaption} />;
  }

  // 2. If initial loading from localStorage is still in progress
  if (loading) {
    return <LoadingScreen />;
  }

  // 3. If user is authenticated, on an auth page, and caption is done (i.e., redirecting to dashboard)
  // This prevents the auth page from flashing after the caption.
  if (user && (pathname.startsWith('/login') || pathname.startsWith('/register')) && !postAuthCaption) {
    return <LoadingScreen />;
  }

  // 4. Otherwise, provide the context and render children
  // AppLayout will handle its own loading/redirect logic if user is null on a protected route.
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
