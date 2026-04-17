'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Articles() {
  const [articles, setArticles] = useState([])

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log('ERROR:', error.message)
      setArticles([]) // fallback
      return
    }

    setArticles(data || []) 
  }

  const handleLike = async (id, likes) => {
    await supabase
      .from('articles')
      .update({ likes: (likes || 0) + 1 }) // safe increment

    await fetchArticles()
  }

  const handleDislike = async (id, dislikes) => {
    await supabase
      .from('articles')
      .update({ dislikes: (dislikes || 0) + 1 })

    await fetchArticles()
  }

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">Articles</h1>

      <a href="/articles/new" className="text-blue-500">
        + Add Article
      </a>

      {articles.length === 0 ? (
        <p className="mt-4">No articles yet.</p>
      ) : (
        articles.map((a) => (
          <div key={a.id} className="border p-3 mt-3">
            <h2 className="font-bold">{a.title}</h2>
            <p>{a.content}</p>

            <button onClick={() => handleLike(a.id, a.likes)}>
              👍 {a.likes || 0}
            </button>

            <button
              onClick={() => handleDislike(a.id, a.dislikes)}
              className="ml-2"
            >
              👎 {a.dislikes || 0}
            </button>

            <br />
            <a href={`/articles/${a.id}`} className="text-blue-500">
              View
            </a>
          </div>
        ))
      )}
    </div>
  )
}