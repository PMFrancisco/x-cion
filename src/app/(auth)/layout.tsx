import Image from "next/image";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Image src="/icons/icon-192x192.png" alt="Xcion" width={64} height={64} priority />
          <span className="text-4xl font-bold text-xcion-primary">Xcion</span>
        </div>
        {children}
      </div>
    </div>
  );
}
