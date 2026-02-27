export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <span className="text-4xl font-bold text-[#1d9bf0]">Xcion</span>
        </div>
        {children}
      </div>
    </div>
  );
}
