import type { Metadata } from "next"
import { Geist, Geist_Mono, Fraunces, Quicksand, Baloo_2 } from "next/font/google"
import { AuthProvider } from "@/lib/auth"
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

export const metadata: Metadata = {
  title: "Polaris — your cute PCOS bestie 🌸",
  description:
    "Track everything, spot your patterns, ask the girls, and walk into your gyno visit ready. Polaris is your soft, smart companion for PCOS and your cycle.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${quicksand.variable} ${baloo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
