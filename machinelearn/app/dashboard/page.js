'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [topArticles, setTopArticles] = useState([])
  const [notifications, setNotifications] = useState([])
  const router = useRouter()

  useEffect(() => {
    getUser()
    fetchTopArticles()
    fetchNotifications()
  }, [])

  // 🔹 Get logged-in user
  const getUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      router.push('/login')
    } else {
      setUser(data.user)
    }
  }

  // 🔹 Top 5 most liked articles
  const fetchTopArticles = async () => {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .order('likes', { ascending: false })
      .limit(5)

    setTopArticles(data || [])
  }

  // 🔹 Notifications
  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    setNotifications(data || [])
  }

  // 🔹 Logout
  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="p-5">

      {/* HEADER */}
      <div className="flex justify-between mb-5">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-1 rounded"
        >
          Logout
        </button>
      </div>

      {/* USER INFO */}
      <p className="mb-5">Welcome: {user?.email}</p>

      {/* TOP ARTICLES */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          Top 5 Most Liked Articles
        </h2>

        {topArticles.map((a) => (
          <div key={a.id} className="border p-2 mb-2">
            <Link href={`/articles/${a.id}`}>
              <p className="font-bold">{a.title}</p>
            </Link>
            <p>👍 {a.likes}</p>
          </div>
        ))}
      </div>

      {/* ALL ARTICLES LINK */}
      <Link href="/articles">
        <button className="bg-blue-500 text-white px-4 py-2 rounded mb-8">
          View All Articles
        </button>
      </Link>

      {/* NOTIFICATIONS */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Notifications</h2>

        {notifications.length === 0 && <p>No notifications</p>}

        {notifications.map((n)=> (
          <div key={n.id} className="border p-2 mb-2">
            <p>{n.message}</p>
          </div>
        ))}
      </div>

    </div>
  )
}