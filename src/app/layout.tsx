import "@/styles/globals.css";

import { type Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCReactProvider } from "@/trpc/react";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Mailflow AI",
  description: "Email, calendar, plugins, and agents powered by Mailflow AI",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <TooltipProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster richColors closeButton position="top-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
