import { Skeleton } from '@/components/ui/skeleton';

export default function ClientCardSkeleton() {
  return (
    <div className="p-3 sm:p-4 bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-xl flex items-center gap-3 sm:gap-4">
      <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/[0.04]" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40 bg-white/[0.04]" />
        <Skeleton className="h-3 w-56 bg-white/[0.04]" />
      </div>
      <div className="hidden sm:flex items-center gap-1.5">
        <Skeleton className="h-9 w-9 rounded-md bg-white/[0.04]" />
        <Skeleton className="h-9 w-9 rounded-md bg-white/[0.04]" />
      </div>
    </div>
  );
}
