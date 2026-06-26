import { Loader2, Monitor } from "lucide-react";

export function FullPageLoader() {
  return (
    <div className="relative flex items-center justify-center w-full min-h-screen overflow-hidden bg-gray-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-purple-600/[0.07] blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-purple-500/[0.05] blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-violet-600/[0.04] blur-[80px]" />
      </div>

      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />

      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl scale-150" />
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Monitor className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
      </div>
    </div>
  );
}
