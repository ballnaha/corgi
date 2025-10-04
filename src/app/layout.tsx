import type { Metadata, Viewport } from "next";
import '@fontsource/prompt/300.css';
import '@fontsource/prompt/400.css';
import '@fontsource/prompt/500.css';
import '@fontsource/prompt/600.css';
import '@fontsource/prompt/700.css';
import "./globals.css";
import LineAuthProvider from "@/components/LineAuthProvider";
import { AuthProvider } from "@/hooks/useSimpleAuth";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import ThemeProvider from "@/components/ThemeProvider";
import ClientOnly from "@/components/ClientOnly";
import BottomNavigation from "@/components/BottomNavigation";
import NextAuthSessionProvider from "@/components/NextAuthSessionProvider";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: "Natpi & Corgi Farm and Pet Shop - ร้านขายสัตว์เลี้ยงและอุปกรณ์ครบครัน",
  description: "ร้านขายสัตว์เลี้ยงและอุปกรณ์สัตว์เลี้ยงครบครัน ด้วยความรักและใส่ใจในทุกรายละเอียด สุนัข แมว นก อาหารสัตว์ ของเล่น",
  keywords: "สัตว์เลี้ยง, สุนัข, แมว, นก, อาหารสัตว์, ของเล่นสัตว์, คอร์กี้, pet shop",
  authors: [{ name: "Natpi & Corgi Farm and Pet Shop" }],
  robots: "index, follow",  
  openGraph: {
    title: "Natpi & Corgi Farm and Pet Shop - ร้านขายสัตว์เลี้ยงและอุปกรณ์ครบครัน",
    description: "ร้านขายสัตว์เลี้ยงและอุปกรณ์สัตว์เลี้ยงครบครัน ด้วยความรักและใส่ใจในทุกรายละเอียด",
    type: "website",
    locale: "th_TH",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <script 
          async 
          src="https://www.googletagmanager.com/gtag/js?id=G-HC3MM6TD4E"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-HC3MM6TD4E');
            `,
          }}
        />
        <script 
          src="https://static.line-scdn.net/liff/edge/2/sdk.js"
          async
        />
      </head>
      <body suppressHydrationWarning>
        <ClientOnly>
          <AppRouterCacheProvider>
            <ThemeProvider>
              <NextAuthSessionProvider>
                <AuthProvider>
                  <LineAuthProvider>
                    {children}
                    <BottomNavigation />
                  </LineAuthProvider>
                </AuthProvider>
              </NextAuthSessionProvider>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
