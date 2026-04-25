'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const signup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Check your email for confirmation!')
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-80">
        <h2 className="text-xl mb-4 text-center">Sign Up</h2>

        <input
          className="w-full p-2 border mb-2"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2 border mb-4"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={signup}
          className="w-full bg-green-500 text-white p-2"
        >
          Sign Up
        </button>

        <p className="text-sm mt-3 text-center">
            Already have an account? <a href="/login" className="text-blue-500">Login</a>
        </p>
      </div>
    </div>
  )
}