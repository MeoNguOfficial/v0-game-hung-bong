import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin", "latin-ext"] })
const _geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"] })

export const metadata: Metadata = {
  title: "Catch Master - Power by V0 App",
  description: "Created with v0 and MeoNguOfficial",
  generator: "v0.app",
  icons: {
    icon: {
      url: "https://cdn-icons-png.magnific.com/512/12368/12368485.png",
    },
    apple: "https://cdn-icons-png.magnific.com/512/12368/12368485.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${_geist.className}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
