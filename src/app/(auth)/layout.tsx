
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      <main className="w-full max-w-md">
        {children}
      </main>
      <footer className="mt-8 text-center text-sm text-primary-foreground/80">
        <p>&copy; {new Date().getFullYear()} RentEasy. All rights reserved.</p>
      </footer>
    </div>
  );
}
