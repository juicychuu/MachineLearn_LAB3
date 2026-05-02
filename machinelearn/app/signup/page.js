'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Modal from '../components/Modal'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' })

  const signup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setModal({ isOpen: true, title: 'Sign Up Failed', message: error.message, type: 'error' })
    } else {
      setModal({ isOpen: true, title: 'Account Created!', message: 'Check your email for confirmation link.', type: 'success' })
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      
      <div className="backdrop-blur-xl bg-gray-800/50 border border-gray-700/50 shadow-2xl p-8 rounded-2xl w-80">
        
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 pointer-events-none" />

        <h2 className="text-2xl font-bold mb-6 text-center text-white relative z-10">
          Sign Up
        </h2>

        <input
          className="w-full p-3 mb-4 rounded-xl bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-300 relative z-10"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-3 mb-6 rounded-xl bg-gray-700/50 border border-gray-600/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-300 relative z-10"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={signup}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold p-3 rounded-xl 
                     shadow-[0_0_20px_rgba(62,207,142,0.3)]
                     hover:shadow-[0_0_30px_rgba(62,207,142,0.5)]
                     hover:from-emerald-400 hover:to-emerald-500
                     active:scale-95
                     transition duration-300 relative z-10"
        >
          Sign Up
        </button>

        <p className="text-sm mt-6 text-center text-gray-400 relative z-10">
          Already have an account?{' '}
          <a href="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline transition duration-300">
            Login
          </a>
        </p>

      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

    </div>
  )
}