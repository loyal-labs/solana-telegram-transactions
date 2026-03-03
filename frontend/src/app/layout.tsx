import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { PhantomWalletProvider } from "@/components/solana/phantom-provider";
import { Header } from "@/components/ui/header";
import { ChatModeProvider } from "@/contexts/chat-mode-context";
import { UserChatsProvider } from "@/providers/user-chats";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Loyal: Privacy Preserving Intelligence",
  description:
    "True private intelligence network: open-source privacy-preserving AI with confidential compute in TEE and attested runtimes.",
  metadataBase: new URL("https://askloyal.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: [{ url: "/favicon.svg" }],
  },
  openGraph: {
    type: "website",
    url: "https://askloyal.com/",
    title: "Loyal: Privacy Preserving Intelligence",
    description:
      "True private intelligence network: open-source privacy-preserving AI with confidential compute in TEE and attested runtimes.",
    images: [
      {
        url: "/card1.jpg",
        width: 1033,
        height: 542,
        alt: "Loyal network visual",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Loyal: Privacy Preserving Intelligence",
    description:
      "True private intelligence network: open-source privacy-preserving AI with confidential compute in TEE and attested runtimes.",
    images: [
      {
        url: "/card2.jpg",
        alt: "Loyal private intelligence preview",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PhantomWalletProvider>
          <UserChatsProvider>
            <ChatModeProvider>
              <Header />
              {children}
            </ChatModeProvider>
          </UserChatsProvider>
        </PhantomWalletProvider>

        {/* Umami Analytics */}
        <Script
          data-website-id="461c47cb-7363-4a5b-9d83-8175ef31299f"
          defer
          src="https://cloud.umami.is/script.js"
          strategy="afterInteractive"
        />

        {/* Productlane Widget */}
        <Script id="productlane-init" strategy="afterInteractive">
          {`
            (function(w){
              const P=(w.Productlane={queue:{}});
              ["set","open","close","toggle","on","off","init","enable","disable"].forEach(m=>{
                P[m]=(n=>function(){P.queue[n]={args:arguments}})(m)
              })
            })(window);

            Productlane.init({
              widgetKey: "a1926941-a6d8-47b8-baa8-794d3f75303d",
              position: "left"
            });
          `}
        </Script>
        <Script
          crossOrigin="anonymous"
          src="https://widget.productlane.com/latest.productlane-widget.min.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
