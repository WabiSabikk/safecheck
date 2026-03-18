import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Header } from '@/components/layout/header';
import { OfflineBanner } from '@/components/offline-banner';
import { ServiceWorkerInit } from '@/components/sw-init';
import { AuthProvider } from '@/lib/auth/context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-dvh">
        <ServiceWorkerInit />
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <OfflineBanner />
          <Header />
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            {children}
          </main>
          <MobileNav />
        </div>
      </div>
    </AuthProvider>
  );
}
