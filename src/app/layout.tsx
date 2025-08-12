import type { Metadata } from "next";
import '@fontsource/prompt/300.css';
import '@fontsource/prompt/400.css';
import '@fontsource/prompt/500.css';
import '@fontsource/prompt/600.css';
import '@fontsource/prompt/700.css';
import "./globals.css";

export const metadata: Metadata = {
  title: "CorgiShop - ร้านขายสัตว์เลี้ยงและอุปกรณ์ครบครัน",
  description: "ร้านขายสัตว์เลี้ยงและอุปกรณ์สัตว์เลี้ยงครบครัน ด้วยความรักและใส่ใจในทุกรายละเอียด สุนัข แมว นก อาหารสัตว์ ของเล่น",
  keywords: "สัตว์เลี้ยง, สุนัข, แมว, นก, อาหารสัตว์, ของเล่นสัตว์, คอร์กี้, pet shop",
  authors: [{ name: "CorgiShop Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "CorgiShop - ร้านขายสัตว์เลี้ยงและอุปกรณ์ครบครัน",
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
    <html lang="th">
      <body style={{ fontFamily: 'Prompt, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
