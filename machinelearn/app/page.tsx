import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      
      <div className="relative backdrop-blur-xl bg-gray-800/50 border border-gray-700/50 shadow-2xl p-10 rounded-2xl w-96 text-center">
        
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 pointer-events-none" />

        <h1 className="text-4xl font-extrabold mb-4 text-white tracking-tight relative z-10">
          Active Archive
        </h1>

        <p className="text-gray-300 mb-8 leading-relaxed relative z-10">
          Data preserved. Knowledge in motion.
        </p>

        <Link href="/login">
          <button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold p-3 rounded-xl 
                             shadow-[0_0_25px_rgba(62,207,142,0.3)]
                             hover:shadow-[0_0_35px_rgba(62,207,142,0.5)]
                             hover:from-emerald-400 hover:to-emerald-500
                             active:scale-95
                             transition duration-300 relative z-10">
            Get Started
          </button>
        </Link>

      </div>

    </div>
  )
}