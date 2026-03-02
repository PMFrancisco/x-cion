"use client";

import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { RightPanel } from "@/components/layout/right-panel";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  return (
    <div className="mx-auto flex min-h-screen max-w-[1280px]">
      <Sidebar />
      <main className="min-h-screen min-w-0 flex-1 border-r pb-16 md:pb-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-xcion-blue" />
          </div>
        ) : (
          children
        )}
      </main>
      <RightPanel />
      <MobileNav />
    </div>
  );
}
