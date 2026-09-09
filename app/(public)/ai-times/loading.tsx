export default function BlogLoading() {
  return (
    <div className="pt-32 sm:pt-44 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Real header — visible immediately so nav feels instant */}
        <div className="text-center py-12">
          <span className="section-tag">TIBLOGICS</span>
          <h1
            className="text-5xl md:text-7xl text-[#0D1B2A] mt-3 tracking-widest font-bold"
            style={{ fontFamily: "var(--font-masthead)" }}
          >
            AI TIMES
          </h1>
          <p className="font-syne font-bold text-[#F47C20] text-xl md:text-2xl mt-2 tracking-wide">
            The #1 AI Digestable Knowledge
          </p>
          <p className="font-dm text-[#3A4A5C] text-base mt-2 max-w-xl mx-auto">
            Practical AI knowledge for businesses, builders, and curious minds.
          </p>
        </div>

        {/* Search bar placeholder */}
        <div className="h-12 bg-white border border-[#D2DCE8] rounded-2xl max-w-md mx-auto mb-8 animate-pulse" />

        {/* Category pills placeholder */}
        <div className="flex gap-2 mb-8 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 h-9 w-24 bg-[#EBF0FA] rounded-full animate-pulse" />
          ))}
        </div>

        {/* Featured cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10 animate-pulse">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl overflow-hidden border border-[#D2DCE8]">
              <div className="h-52 bg-[#E8EFF8]" />
              <div className="p-6 space-y-3">
                <div className="h-3 bg-[#E8EFF8] rounded w-1/4" />
                <div className="h-6 bg-[#E8EFF8] rounded w-4/5" />
                <div className="h-3 bg-[#F0F4FA] rounded w-full" />
                <div className="h-3 bg-[#F0F4FA] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>

        {/* Post grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-[#D2DCE8]">
              <div className="h-44 bg-[#E8EFF8]" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-[#E8EFF8] rounded w-1/3" />
                <div className="h-5 bg-[#E8EFF8] rounded w-4/5" />
                <div className="h-3 bg-[#F4F7FB] rounded w-full" />
                <div className="h-3 bg-[#F4F7FB] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
