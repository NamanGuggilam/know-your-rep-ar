import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import { A11yProvider, BOOT_SCRIPT } from "@/components/a11y/settings";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-reading",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Know Your Rep AR — Find and contact your Arkansas representatives",
    template: "%s · Know Your Rep AR",
  },
  description:
    "Type your address to see everyone who represents you in Arkansas and in Congress, learn what they do in plain English, and contact them in one tap. An independent, nonpartisan student project.",
  applicationName: "Know Your Rep AR",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#11171a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={atkinson.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only-focusable fixed top-2 left-2 z-50 rounded-lg bg-accent px-4 py-3 font-bold text-accent-ink"
        >
          Skip to main content
        </a>
        <A11yProvider>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8 outline-none">
            {children}
          </main>
          <SiteFooter />
        </A11yProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
