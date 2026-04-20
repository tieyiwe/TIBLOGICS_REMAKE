export default function BlogLoading() {
  return (
    <div className="pt-20 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12 animate-pulse">
          <div className="h-3 bg-[#E8EFF8] rounded-full w-20 mx-auto mb-4" />
          <div className="h-10 bg-[#E8EFF8] rounded-2xl w-64 mx-auto mb-3" />
          <div className="h-5 bg-[#F0F4FA] rounded-xl w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
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
