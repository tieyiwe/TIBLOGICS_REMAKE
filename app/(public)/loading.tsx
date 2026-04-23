export default function Loading() {
  return (
    <div className="pt-44 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-6 max-w-2xl">
          <div className="h-3 bg-[#E8EFF8] rounded-full w-20" />
          <div className="h-12 bg-[#E8EFF8] rounded-2xl w-3/4" />
          <div className="h-5 bg-[#F4F7FB] rounded-xl w-full" />
          <div className="h-5 bg-[#F4F7FB] rounded-xl w-5/6" />
          <div className="flex gap-3 pt-2">
            <div className="h-10 bg-[#E8EFF8] rounded-xl w-36" />
            <div className="h-10 bg-[#F4F7FB] rounded-xl w-36" />
          </div>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#F4F7FB] rounded-2xl h-48" />
          ))}
        </div>
      </div>
    </div>
  );
}
