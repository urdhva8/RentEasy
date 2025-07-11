
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/toaster";

const reactLogoSvgDataUri = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%22-11.5 -10.23174 23 20.46348%22><title>React Logo</title><circle cx=%220%22 cy=%220%22 r=%222.05%22 fill=%22%2361dafb%22/><g stroke=%22%2361dafb%22 stroke-width=%221%22 fill=%22none%22><ellipse rx=%2211%22 ry=%224.2%22/><ellipse rx=%2211%22 ry=%224.2%22 transform=%22rotate(60)%22/><ellipse rx=%2211%22 ry=%224.2%22 transform=%22rotate(120)%22/></g></svg>";

export const metadata: Metadata = {
  title: "RentEasy",
  description: "Find your next rental easily with RentEasy",
  icons: {
    icon: reactLogoSvgDataUri,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Forcefully setting the favicon with a link tag to override environment defaults */}
        <link rel="icon" href={reactLogoSvgDataUri} />
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
