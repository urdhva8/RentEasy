
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "RentEasy",
  description: "Find your next rental easily with RentEasy",
  icons: null, // Explicitly try to disable default icons via metadata
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Attempt to force a blank favicon */}
        <link rel="icon" href="data:;base64,iVBORw0KGgo=" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
