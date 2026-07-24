import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIVOA | AI-Powered Complaint Management",
  description: "Pharmaceutical customer complaint intake, triage, investigation, and AI decision support.",
  openGraph: {
    title: "AIVOA | AI-Powered Complaint Intelligence",
    description: "From complaint intake to CAPA, with evidence-first AI.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIVOA | AI-Powered Complaint Intelligence",
    description: "From complaint intake to CAPA, with evidence-first AI.",
    images: ["/og.png"],
  },
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>;
}
