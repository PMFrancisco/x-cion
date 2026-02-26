export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/layout/sidebar";
import { RightPanel } from "@/components/layout/right-panel";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1280px]">
      <Sidebar />
      <main className="min-h-screen flex-1 border-r pb-16 md:pb-0">
        {children}
      </main>
      <RightPanel />
      <MobileNav />
    </div>
  );
}
