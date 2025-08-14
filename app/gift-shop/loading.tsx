export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header skeleton */}
        <div className="text-center mb-8">
          <div className="h-10 bg-white/20 rounded-lg mb-4 animate-pulse"></div>
          <div className="h-6 bg-white/20 rounded-lg animate-pulse"></div>
        </div>

        {/* Filter skeleton */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-24 bg-white/20 rounded-lg animate-pulse flex-shrink-0"></div>
          ))}
        </div>

        {/* Items grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-white/20 rounded mb-2"></div>
              <div className="h-4 bg-white/20 rounded mb-4"></div>
              <div className="h-10 bg-white/20 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
