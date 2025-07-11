
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/toaster";

const reactLogoPngDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARAAAAEQAQMAAABLA0GnAAAABlBMVEUAIABfX1/o7AatAAAAAXRSTlMAQObYZgAAAI5JREFUeNpjYBgFo2AUjIJRMApGwSigcwFGBq4A8T8kASvYn1B7+J8hxn8g9H9wSAyQAFjsv3E+QPwPy4Bx/A+L/x+W/h8s/4/k/s/S/yP5/zP9/zP//zP+/zP//zOABGBaGv+P5f8Pmf8fsv8/Ev8/Av8/gvA/gtA/Atk/QNk/QOWfAPVPAfVPAfVPAQXUAAAAASUVORK5CYII=";

export const metadata: Metadata = {
  title: "RentEasy",
  description: "Find your next rental easily with RentEasy",
  icons: {
    icon: reactLogoPngDataUri,
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
        <link rel="icon" href={reactLogoPngDataUri} />
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
