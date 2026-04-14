'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) alert(error.message)
    else alert('Check your email!')
  }

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) alert(error.message)
    else alert('Login successful!')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-green-100 border border-green-300 rounded-2xl shadow-xl p-8 w-[350px]">
        <h2 className="text-2xl font-bold text-green-800 text-center mb-6">
          Login / Sign Up
        </h2>

        <div className="bg-green-200 p-4 rounded-xl mb-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 rounded-md border border-green-400 outline-none"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="bg-green-200 p-4 rounded-xl mb-4">
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 rounded-md border border-green-400 outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSignUp}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
          >
            Sign Up
          </button>

          <button
            onClick={handleLogin}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  )
}