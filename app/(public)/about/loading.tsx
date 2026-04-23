export default function AboutLoading() {
  return (
    <div className="pt-44 min-h-screen">
      <div className="bg-[#1B3A6B] py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="h-3 bg-white/20 rounded-full w-28 mb-5" />
          <div className="h-12 bg-white/20 rounded-2xl w-96 mb-4" />
          <div className="h-5 bg-white/10 rounded-xl w-2/3" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse space-y-6">
        <div className="h-5 bg-[#E8EFF8] rounded w-full" />
        <div className="h-5 bg-[#E8EFF8] rounded w-5/6" />
        <div className="h-5 bg-[#F4F7FB] rounded w-4/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#F4F7FB] rounded-2xl h-36 border border-[#E8EFF8]" />
          ))}
        </div>
      </div>
    </div>
  );
}
