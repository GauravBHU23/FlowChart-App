import "./globals.css";

export const metadata = {
  title: "AI Diagram Studio — Text to Flowcharts, 3D & Charts",
  description:
    "Describe anything in plain English and instantly generate 2D flowcharts, interactive 3D diagrams, and data charts with AI.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070b14",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
