
"use client"; // Required for useState and useEffect

import { ReactNode, useEffect, useState } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      <main className="w-full max-w-md">
        {children}
      </main>
      <footer className="mt-8 text-center text-sm text-primary-foreground/80">
        <p>&copy; {currentYear || new Date().getFullYear()} RentEasy. All rights reserved.</p>
      </footer>
    </div>
  );
}
