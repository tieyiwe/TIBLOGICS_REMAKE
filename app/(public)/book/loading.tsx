export default function BookLoading() {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-[#F4F7FB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
        <div className="text-center mb-10">
          <div className="h-3 bg-[#E8EFF8] rounded-full w-20 mx-auto mb-4" />
          <div className="h-10 bg-[#E8EFF8] rounded-2xl w-48 mx-auto mb-3" />
          <div className="h-4 bg-[#F0F4FA] rounded-xl w-72 mx-auto" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-20 border border-[#D2DCE8]" />
            ))}
          </div>
          <div className="lg:col-span-3 bg-white rounded-2xl h-96 border border-[#D2DCE8]" />
        </div>
      </div>
    </div>
  );
}
