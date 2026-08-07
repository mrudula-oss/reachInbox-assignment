import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReachInbox Dashboard",
  description: "Schedule and review emails with ReachInbox",
};

import { GoogleOAuthProvider } from "@react-oauth/google";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "test-client-id"}>
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
