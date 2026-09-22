import type { Metadata } from "next";
import { Open_Sans, Geist_Mono, Unbounded, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Шрифты указателя. Кириллица обязательна: весь контент русский, а у Geist Mono
 * кириллического набора нет — русские подписи в нём падали на системный фоллбэк.
 */
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "TEOS · Демо-стенд",
  description: "Указатель страниц: дашборды, витрины графиков и прототипы техподдержки",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${openSans.variable} ${geistMono.variable} ${unbounded.variable} ${plexMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
