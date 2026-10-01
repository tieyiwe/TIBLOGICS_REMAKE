import { cn } from "@/lib/utils";

export function Skeleton({ className, lines }: { className?: string; lines?: number }) {
  if (lines && lines > 1) {
    return (
      <div className="flex flex-col gap-2" aria-hidden>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={cn("a-skeleton h-3.5 rounded-md", i === lines - 1 && "w-2/3", className)} />
        ))}
      </div>
    );
  }
  return <div className={cn("a-skeleton h-4 rounded-md", className)} aria-hidden />;
}
