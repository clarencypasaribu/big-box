import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bigbox",
  description: "Project management login",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={poppins.className}
        style={{ margin: 0, background: "#f3f4f6", color: "#111827" }}
      >
        {children}
      </body>
    </html>
  );
}
