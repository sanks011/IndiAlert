import dynamic from 'next/dynamic'
import { Satellite } from 'lucide-react'

// Dynamically import the IndiaMap component to avoid SSR issues
const IndiaMapComponent = dynamic(() => import('./india-map'), {
  ssr: false,
  loading: () => (
    <div className="relative">
      <div 
        style={{ height: '600px' }} 
        className="rounded-lg border border-[#0B60B0]/30 z-0 flex flex-col items-center justify-center bg-black/50"
      >
        <div className="text-[#F0EDCF] text-center p-6 bg-black/70 rounded-lg border border-[#0B60B0]/30">
          <Satellite className="h-12 w-12 text-[#40A2D8] mx-auto mb-3 animate-pulse" />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B60B0] mx-auto mb-3"></div>
          <p className="text-xl mb-2">Loading Map Interface</p>
          <p className="text-sm text-[#F0EDCF]/70">
            Loading India map with official boundaries...
          </p>
        </div>
      </div>
    </div>
  )
})

// Define the prop types to be more explicit
interface IndiaMapWrapperProps {
  onGeometryChange: (geometry: any) => void
  height?: string
  className?: string
  debug?: boolean
}

// Forward props to the dynamic component
const IndiaMapWrapper = (props: IndiaMapWrapperProps) => <IndiaMapComponent {...props} />

export default IndiaMapWrapper
