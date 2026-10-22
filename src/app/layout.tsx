import type { Metadata, Viewport } from "next";
import "@fontsource-variable/anek-latin/standard.css";
import "@fontsource-variable/anek-devanagari/standard.css";
import "@fontsource/kalam/400.css";
import "@fontsource/kalam/700.css";
import "@fontsource/martel/400.css";
import "@fontsource/martel/700.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Keepsake · Letters for the people you love, sent if you stop checking in",
    template: "%s · Keepsake",
  },
  description:
    "Write letters for the people you love. Keepsake asks you, on a rhythm you choose, whether you're still here. If you stop answering, your letters reach them by WhatsApp, SMS and email.",
  openGraph: { siteName: "Keepsake", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#c9dae7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <a href="#main" className="skip">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
