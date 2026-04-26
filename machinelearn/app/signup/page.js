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
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-emerald-500 to-green-900">
      
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl p-8 rounded-2xl w-80">
        
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Sign Up
        </h2>

        <input
          className="w-full p-2 mb-3 rounded-lg bg-white/20 border border-white/30 text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2 mb-5 rounded-lg bg-white/20 border border-white/30 text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={signup}
          className="w-full bg-emerald-300 text-gray-900 font-semibold p-2 rounded-xl 
                     shadow-[0_0_15px_rgba(110,231,183,0.6)]
                     hover:bg-emerald-400 transition duration-300"
        >
          Sign Up
        </button>

        <p className="text-sm mt-4 text-center text-gray-800">
          Already have an account?{' '}
          <a href="/login" className="text-emerald-200 hover:underline">
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