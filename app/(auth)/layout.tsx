export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* No max-width here — auth page controls its own max-w-[1120px] for the split-panel card */}
      <div className="w-full">{children}</div>
    </div>
  );
}
