import type { Metadata } from "next";
import "./globals.css";
import "./common.scss";
import { Roboto } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { SpotRateProvider } from "@/context/SpotRateContext";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Aurify Technologies",
  description:
    "Modern super admin dashboard with comprehensive management tools",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`antialiased ${roboto.className}`}>
        <AuthProvider>
          <SpotRateProvider>{children}</SpotRateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
