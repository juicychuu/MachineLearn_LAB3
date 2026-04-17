'use client'

import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function NewArticle() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const router = useRouter()

  const addArticle = async () => {
    const { error } = await supabase.from('articles').insert([{ title, content }])
    if (error) return alert(error.message)

    alert('Article added!')
    router.push('/articles')
  }

  return (
    <div className="p-6">
      <h1>Add Article</h1>

      <input className="border p-2 w-full mb-2" placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
      <textarea className="border p-2 w-full mb-2" placeholder="Content" onChange={(e) => setContent(e.target.value)} />

      <button onClick={addArticle} className="bg-blue-500 text-white p-2">
        Submit
      </button>
    </div>
  )
}