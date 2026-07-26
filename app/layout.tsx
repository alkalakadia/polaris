import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Fraunces, Quicksand, Baloo_2, DM_Serif_Display, DM_Sans } from "next/font/google"
import { AuthProvider } from "@/lib/auth"
import { PwaRegister } from "@/components/pwa-register"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
})

// Quicksand — soft, rounded, friendly UI font for the patient app.
const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
})

// Baloo 2 — playful rounded display font for cute headings.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
})

// MyPMOS design system (from the Figma): DM Serif Display for headlines,
// DM Sans for body/UI.
const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
})
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "MyPMOS — your PMOS companion",
  description:
    "Track everything, spot your patterns, and walk into your doctor's visit ready. MyPMOS is a smart companion for PMOS (formerly PCOS) and your cycle.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "MyPMOS" },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#FF6FA5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${quicksand.variable} ${baloo.variable} ${dmSerif.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
