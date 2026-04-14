import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      
      <div className="bg-white p-8 rounded-xl shadow-md w-96 text-center">
        
        <h1 className="text-3xl font-bold mb-4">
          Machine Learning Hub
        </h1>

        <p className="text-gray-600 mb-6">
          A simple platform for ML resources
        </p>

        <Link href="/login">
          <button className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
            Get Started
          </button>
        </Link>

      </div>

    </div>
  )
}