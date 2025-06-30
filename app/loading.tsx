export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          {/* Animated loading spinner */}
          <div className="w-16 h-16 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>

          {/* Pulsing dots */}
          <div className="flex justify-center gap-1 mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-2">Loading AUTOPARTS</h2>
        <p className="text-white/60">Preparing your auto parts search experience...</p>
      </div>
    </div>
  )
}
