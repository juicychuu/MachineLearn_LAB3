import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-emerald-500 via-green-700 to-green-900">
      
      <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-10 rounded-2xl w-96 text-center">
        
        <div className="absolute inset-0 rounded-2xl bg-white/5 pointer-events-none" />

        <h1 className="text-3xl font-extrabold mb-4 text-gray-900 tracking-tight">
          Machine Learning Hub
        </h1>

        <p className="text-gray-800/80 mb-8 leading-relaxed">
          A simple platform for ML resources
        </p>

        <Link href="/login">
          <button className="w-full bg-emerald-300 text-gray-900 font-semibold p-3 rounded-xl 
                             shadow-[0_0_25px_rgba(110,231,183,0.65)]
                             hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(110,231,183,0.8)]
                             active:scale-95
                             transition duration-300">
            Get Started
          </button>
        </Link>

      </div>

    </div>
  )
}