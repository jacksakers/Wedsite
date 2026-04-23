/** Animated skeleton placeholder for a loading post card. */
export default function PostCardSkeleton() {
  return (
    <div className="bg-paper border border-sage/15 rounded-xl paper-lift overflow-hidden animate-pulse">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-sage/20 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-sage/20 rounded w-24" />
          <div className="h-2.5 bg-sage/10 rounded w-16" />
        </div>
      </div>
      <div className="px-4 pb-4 space-y-2">
        <div className="h-3 bg-sage/15 rounded w-full" />
        <div className="h-3 bg-sage/15 rounded w-4/5" />
        <div className="h-3 bg-sage/10 rounded w-3/5" />
      </div>
      <div className="px-4 pb-4 flex gap-4">
        <div className="h-3 bg-sage/10 rounded w-10" />
        <div className="h-3 bg-sage/10 rounded w-10" />
      </div>
    </div>
  )
}
