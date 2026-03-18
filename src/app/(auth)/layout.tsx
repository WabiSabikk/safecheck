import { ShieldCheck } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="h-8 w-8 text-emerald-600" />
        <span className="text-2xl font-bold">SafeCheck</span>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
