import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order | PrintHub",
  description: "Track your PrintHub order status.",
  robots: "noindex",
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
