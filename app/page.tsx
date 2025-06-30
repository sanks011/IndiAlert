import { Suspense } from "react"
import UltraModernAutoPartsSearch from "../components/ultra-modern-auto-parts-search"

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Loading IndiAlert</h2>
            <p className="text-white/60">Preparing your satellite change monitoring interface...</p>
          </div>
        </div>
      }
    >
      <UltraModernAutoPartsSearch />
    </Suspense>
  )
}
