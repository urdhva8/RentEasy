
"use client";

import type { User, UserRole } from "@/types";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FullScreenCaption } from "@/components/layout/full-screen-caption";
import { MOCK_USERS, saveMockUsers, updateUserProfileImage as updateMockUserProfileImage } from "@/lib/mock-data";

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, role: UserRole, pass: string, phoneNumber?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfileImage: (imageUrl: string) => Promise<boolean>;
  updateUserProfileData: (updatedData: { name?: string; phoneNumber?: string }) => Promise<boolean>;
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
    // Check for a logged-in user in localStorage on initial load
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('loggedInUserId') : null;
    if (storedUserId) {
      const foundUser = MOCK_USERS.find(u => u.id === storedUserId);
      setUser(foundUser || null);
    }
    setLoading(false);
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
    // Simulate network delay
    await new Promise(res => setTimeout(res, 500));
    
    const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('loggedInUserId', foundUser.id);
      setPostAuthCaption("Logging in...");
      setLoading(false);
      return true;
    }
    
    setLoading(false);
    return false;
  };

  const register = async (name: string, email: string, role: UserRole, pass: string, phoneNumber?: string): Promise<boolean> => {
    setLoading(true);
    await new Promise(res => setTimeout(res, 500));
    
    if (MOCK_USERS.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setLoading(false);
        return false; // Email already exists
    }

    const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name,
        email,
        role,
        phoneNumber,
        profileImageUrl: undefined,
    };

    MOCK_USERS.push(newUser);
    saveMockUsers();
    
    setUser(newUser);
    localStorage.setItem('loggedInUserId', newUser.id);

    if (role === 'owner') {
        setPostAuthCaption("Turn your property into profit — the easy way.");
    } else {
        setPostAuthCaption("Your perfect rental, just a click away");
    }
    setLoading(false);
    return true;
  };

  const logout = async () => {
    setLoading(true);
    await new Promise(res => setTimeout(res, 500));
    setUser(null);
    localStorage.removeItem('loggedInUserId');
    setPostAuthCaption(null);
    router.push("/login");
    setLoading(false);
  };

  const updateProfileImage = async (imageUrl: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    const updatedUser = updateMockUserProfileImage(user.id, imageUrl);
    if(updatedUser) {
        setUser(updatedUser);
        setLoading(false);
        return true;
    }
    setLoading(false);
    return false;
  };

  const updateUserProfileData = async (updatedData: { name?: string; phoneNumber?: string }): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);

    const userIndex = MOCK_USERS.findIndex(u => u.id === user.id);
    if (userIndex === -1) {
        setLoading(false);
        return false;
    }

    const updatedUser = { ...MOCK_USERS[userIndex] };
    if (updatedData.name !== undefined) {
        updatedUser.name = updatedData.name;
    }
    if (updatedData.phoneNumber !== undefined) {
        updatedUser.phoneNumber = updatedData.phoneNumber;
    }

    MOCK_USERS[userIndex] = updatedUser;
    saveMockUsers();
    setUser(updatedUser);

    setLoading(false);
    return true;
  };


  const isOwner = user?.role === 'owner';
  const isTenant = user?.role === 'tenant';

  if (postAuthCaption) {
    return <FullScreenCaption text={postAuthCaption} />;
  }

  // This check is important for routing and preventing access to protected pages
  if (loading && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
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
