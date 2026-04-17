'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useParams } from 'next/navigation'

export default function ArticleDetail() {
  const { id } = useParams()

  const [article, setArticle] = useState(null)
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')

  useEffect(() => {
    fetchArticle()
    fetchComments()
  }, [])

  const fetchArticle = async () => {
    const { data } = await supabase.from('articles').select('*').eq('id', id).single()
    setArticle(data)
  }

  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*').eq('article_id', id)
    setComments(data)
  }

  const addComment = async () => {
    await supabase.from('comments').insert([{ article_id: id, content: text }])
    setText('')
    fetchComments()
  }

  if (!article) return <p>Loading...</p>

  return (
    <div className="p-6">
      <h1 className="text-xl">{article.title}</h1>
      <p>{article.content}</p>

      <h2 className="mt-4">Comments</h2>

      <textarea className="border w-full p-2" value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={addComment} className="bg-blue-500 text-white p-2 mt-2">
        Comment
      </button>

      {comments.map((c) => (
        <div key={c.id} className="border p-2 mt-2">
          {c.content}
        </div>
      ))}
    </div>
  )
}