
"use client";

import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // Optional: show a loading spinner or a blank page while redirecting
    return (
        <div className="flex items-center justify-center min-h-screen bg-background dark">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
  }

  return (
    <div className="dark min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        &copy; {new Date().getFullYear()} RentEasy. All rights reserved.
      </footer>
    </div>
  );
}
