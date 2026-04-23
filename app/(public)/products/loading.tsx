export default function ProductsLoading() {
  return (
    <div className="pt-44 min-h-screen">
      <div className="bg-[#1B3A6B] py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
          <div className="h-3 bg-white/20 rounded-full w-28 mb-4" />
          <div className="h-10 bg-white/20 rounded-2xl w-80 mb-3" />
          <div className="h-5 bg-white/10 rounded-xl w-2/3" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-52 border border-[#D2DCE8]" />
          ))}
        </div>
      </div>
    </div>
  );
}
