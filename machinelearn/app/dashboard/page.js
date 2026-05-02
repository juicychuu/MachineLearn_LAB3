'use client'

import { useState, useEffect, Fragment } from 'react'
import { addArticles, likeArticle, dislikeArticle, addComment, getComments, addReply, getReplies, shareArticle, SharePlatform, getUserVotesForPosts } from '../../services/articleService'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, formatNotificationMessage, NotificationType } from '../../services/notificationService'
import { supabase } from '../../lib/supabaseClient'
import Modal from '../components/Modal'

const sidebarItems = [
  { icon: '📊', label: 'Dashboard', id: 'dashboard' },
  { icon: '🔔', label: 'Notifications', id: 'notifications', hasBadge: true },
]

export default function Dashboard() {
  const [form, setForm] = useState({
    title: '',
    content: '',
    author: '',
    category: '',
  })

  const [activeView, setActiveView] = useState('dashboard')
  const [posts, setPosts] = useState([])
  const [userVotes, setUserVotes] = useState({})
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [commentReplies, setCommentReplies] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [copied, setCopied] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' })
  const [shareModal, setShareModal] = useState({ isOpen: false, post: null })

  const handleSidebarClick = (id) => {
    setActiveView(id)
    if (id === 'notifications') {
      fetchNotifications()
    }
  }

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      // Sort: top 5 most liked first, then by date
      const sorted = [...data].sort((a, b) => {
        const likesA = a.likes || 0
        const likesB = b.likes || 0
        return likesB - likesA
      })
      setPosts(sorted)
      
      // Fetch user votes for all posts
      const postIds = sorted.map(p => p.id)
      const votes = await getUserVotesForPosts(postIds)
      setUserVotes(votes)
    }
  }

  const fetchNotifications = async () => {
    const data = await getNotifications()
    setNotifications(data || [])
    setUnreadCount(data?.filter(n => !n.is_read).length || 0)
  }
  
  useEffect(() => {
    fetchPosts()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await addArticles(form)

    if (result) {
      setModal({ isOpen: true, title: 'Success!', message: 'Article added successfully!', type: 'success' })
      setForm({ title: '', content: '', author: '', category: '' })
      setShowForm(false)
      fetchPosts()
    } else {
      setModal({ isOpen: true, title: 'Error!', message: 'Failed to add article. Please try again.', type: 'error' })
    }
  }

  const handleLike = async (id) => {
    await likeArticle(id)
    fetchPosts()
    fetchNotifications()
  }

  const handleDislike = async (id) => {
    await dislikeArticle(id)
    fetchPosts()
    fetchNotifications()
  }

  const handleCopyContent = async (content) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const fetchComments = async (postId) => {
    const data = await getComments(postId)
    setComments(data || [])
  }

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return
    const result = await addComment(postId, { author: 'User', content: newComment })
    if (result) {
      setNewComment('')
      fetchComments(postId)
    }
  }

  const fetchReplies = async (commentId) => {
    const data = await getReplies(commentId)
    setCommentReplies(prev => ({ ...prev, [commentId]: data || [] }))
  }

  const handleAddReply = async (commentId, postId) => {
    if (!replyContent.trim()) return
    const result = await addReply(commentId, { author: 'User', content: replyContent })
    if (result) {
      setReplyContent('')
      setReplyingTo(null)
      fetchReplies(commentId)
    }
  }

  const handleShare = (post) => {
    setShareModal({ isOpen: true, post })
  }

  const handleSharePlatform = async (post, platform) => {
    const result = await shareArticle(post, platform)
    if (result.success) {
      setModal({ isOpen: true, title: 'Shared!', message: `Article shared to ${platform} successfully!`, type: 'success' })
    } else {
      setModal({ isOpen: true, title: 'Error', message: 'Failed to share article. Please try again.', type: 'error' })
    }
    setShareModal({ isOpen: false, post: null })
  }
  
  return (
    <Fragment>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f0f0f' }}>
      <aside style={{ width: '260px', backgroundColor: '#1a1a1a', borderRight: '1px solid #2a2a2a', padding: '32px 0', boxShadow: '2px 0 10px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '0 24px', marginBottom: '40px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#3ECF8E', textShadow: '0 0 10px rgba(62,207,142,0.3)' }}>Active Archive</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af' }}>Data preserved. Knowledge in motion.</p>
        </div>
        
        <nav>
          {sidebarItems.map((item, index) => (
            <div 
              key={index} 
              onClick={() => handleSidebarClick(item.id)}
              style={{ 
                padding: '14px 24px', 
                cursor: 'pointer',
                backgroundColor: activeView === item.id ? '#2a2a2a' : 'transparent',
                borderLeft: activeView === item.id ? '3px solid #3ECF8E' : '3px solid transparent',
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                transition: 'all 0.3s ease',
                borderRadius: '0 8px 8px 0'
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{ 
                fontSize: '15px', 
                fontWeight: activeView === item.id ? '600' : '400',
                color: activeView === item.id ? '#3ECF8E' : '#d1d5db'
              }}>{item.label}</span>
              {item.hasBadge && unreadCount > 0 && (
                <span style={{
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginLeft: 'auto',
                  boxShadow: '0 0 10px rgba(239,68,68,0.3)'
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '40px 48px', backgroundColor: '#0f0f0f' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#ffffff', textShadow: '0 0 20px rgba(62,207,142,0.2)' }}>
              {activeView === 'notifications' ? 'Notifications' : 'Dashboard'}
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#9ca3af' }}>
              {activeView === 'notifications' ? 'View who liked, disliked, commented and replied' : 'Manage your articles and content'}
            </p>
          </div>
          {activeView === 'dashboard' && (
            <button 
              onClick={() => setShowForm(!showForm)}
              style={{ 
                backgroundColor: '#3ECF8E', 
                color: '#ffffff', 
                border: 'none',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(62,207,142,0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              <span>+</span> {showForm ? 'Close Form' : 'Add New Article'}
            </button>
          )}
        </header>

        {activeView === 'dashboard' && showForm && (
          <div style={{ 
            backgroundColor: '#1a1a1a', 
            borderRadius: '16px', 
            padding: '32px', 
            marginBottom: '40px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            border: '1px solid #2a2a2a'
          }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '600', color: '#ffffff' }}>Create New Article</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <input
                  placeholder="Article Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid #374151',
                    backgroundColor: '#2a2a2a',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
                <input
                  placeholder="Author Name"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  style={{ 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid #374151',
                    backgroundColor: '#2a2a2a',
                    color: '#ffffff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
              <input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={{ 
                  padding: '14px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid #374151',
                  backgroundColor: '#2a2a2a',
                  color: '#ffffff',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
              />
              <textarea
                placeholder="Write your article content here..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={6}
                style={{ 
                  padding: '14px 16px', 
                  borderRadius: '12px', 
                  border: '1px solid #374151',
                  backgroundColor: '#2a2a2a',
                  color: '#ffffff',
                  fontSize: '15px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease'
                }}
              />
              <button 
                type="submit"
                style={{ 
                  backgroundColor: '#3ECF8E', 
                  color: '#ffffff',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  justifySelf: 'start',
                  minWidth: '180px',
                  boxShadow: '0 4px 15px rgba(62,207,142,0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                Publish Article
              </button>
            </form>
          </div>
        )}

        {activeView === 'dashboard' && posts.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: '600', color: '#ffffff' }}>🏆 Top 5 Most Liked Articles</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {[...posts]
                .filter(post => (post.likes || 0) > 0)
                .sort((a, b) => (b.likes || 0) - (a.likes || 0))
                .slice(0, 5)
                .map((post, index) => (
                  <div 
                    key={post.id}
                    style={{ 
                      backgroundColor: '#1a1a1a', 
                      borderRadius: '12px', 
                      padding: '20px 24px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      border: '1px solid #2a2a2a',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span style={{ 
                      fontSize: '24px', 
                      fontWeight: '700', 
                      color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#6B7280',
                      width: '40px',
                      textAlign: 'center',
                      textShadow: '0 0 10px rgba(255,215,0,0.3)'
                    }}>#{index + 1}</span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>{post.title}</h3>
                      <span style={{ fontSize: '14px', color: '#9ca3af' }}>{post.author}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleLike(post.id)}
                        style={{ 
                          backgroundColor: userVotes[post.id]?.vote_type === 'like' ? '#3ECF8E' : '#2a2a2a',
                          border: userVotes[post.id]?.vote_type === 'like' ? '1px solid #3ECF8E' : '1px solid #374151',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: userVotes[post.id]?.vote_type === 'like' ? '#ffffff' : '#9ca3af',
                          fontWeight: userVotes[post.id]?.vote_type === 'like' ? '600' : '400',
                          transition: 'all 0.3s ease',
                          boxShadow: userVotes[post.id]?.vote_type === 'like' ? '0 0 15px rgba(62,207,142,0.3)' : 'none'
                        }}
                      >
                        👍 {post.likes || 0}
                      </button>
                      <button 
                        onClick={() => handleDislike(post.id)}
                        style={{ 
                          backgroundColor: userVotes[post.id]?.vote_type === 'dislike' ? '#ef4444' : '#2a2a2a',
                          border: userVotes[post.id]?.vote_type === 'dislike' ? '1px solid #ef4444' : '1px solid #374151',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: userVotes[post.id]?.vote_type === 'dislike' ? '#ffffff' : '#9ca3af',
                          fontWeight: userVotes[post.id]?.vote_type === 'dislike' ? '600' : '400',
                          transition: 'all 0.3s ease',
                          boxShadow: userVotes[post.id]?.vote_type === 'dislike' ? '0 0 15px rgba(239,68,68,0.3)' : 'none'
                        }}
                      >
                        👎 {post.dislikes || 0}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {activeView === 'dashboard' && (
          <section>
          <h2 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: '600', color: '#ffffff' }}>All Articles</h2>
          <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
            {posts.map(post => (
              <article 
                key={post.id} 
                style={{ 
                  backgroundColor: '#1a1a1a', 
                  borderRadius: '16px', 
                  padding: '28px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease',
                  border: '1px solid #2a2a2a',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #3ECF8E, #10B981)',
                  boxShadow: '0 0 20px rgba(62,207,142,0.3)'
                }} />
                <h3 style={{ 
                  margin: '0 0 16px', 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: '#ffffff',
                  lineHeight: '1.4'
                }}>{post.title}</h3>
                <p style={{ 
                  margin: '0 0 20px', 
                  color: '#9ca3af', 
                  lineHeight: '1.7',
                  fontSize: '15px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>{post.content}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>{post.author}</span>
                  <span style={{ 
                    backgroundColor: '#2a2a2a', 
                    color: '#9ca3af', 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontSize: '13px',
                    fontWeight: '500',
                    border: '1px solid #374151'
                  }}>{post.category}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid #374151'
                }}>
                  <button 
                    onClick={() => setSelectedArticle(post)}
                    style={{ 
                      backgroundColor: '#3ECF8E', 
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(62,207,142,0.3)'
                    }}
                  >
                    📖 Read More
                  </button>
                  <button 
                    onClick={() => handleLike(post.id)}
                    style={{ 
                      backgroundColor: userVotes[post.id]?.vote_type === 'like' ? '#3ECF8E' : '#2a2a2a',
                      border: userVotes[post.id]?.vote_type === 'like' ? '1px solid #3ECF8E' : '1px solid #374151',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: userVotes[post.id]?.vote_type === 'like' ? '#ffffff' : '#9ca3af',
                      fontWeight: userVotes[post.id]?.vote_type === 'like' ? '600' : '400',
                      transition: 'all 0.3s ease',
                      boxShadow: userVotes[post.id]?.vote_type === 'like' ? '0 0 15px rgba(62,207,142,0.3)' : 'none'
                    }}
                  >
                    👍 Like ({post.likes || 0})
                  </button>
                  <button 
                    onClick={() => handleDislike(post.id)}
                    style={{ 
                      backgroundColor: userVotes[post.id]?.vote_type === 'dislike' ? '#ef4444' : '#2a2a2a',
                      border: userVotes[post.id]?.vote_type === 'dislike' ? '1px solid #ef4444' : '1px solid #374151',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: userVotes[post.id]?.vote_type === 'dislike' ? '#ffffff' : '#9ca3af',
                      fontWeight: userVotes[post.id]?.vote_type === 'dislike' ? '600' : '400',
                      transition: 'all 0.3s ease',
                      boxShadow: userVotes[post.id]?.vote_type === 'dislike' ? '0 0 15px rgba(239,68,68,0.3)' : 'none'
                    }}
                  >
                    👎 Dislike ({post.dislikes || 0})
                  </button>
                  <button 
                    onClick={() => handleShare(post)}
                    style={{ 
                      backgroundColor: '#2a2a2a',
                      border: '1px solid #374151',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#9ca3af',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    📤 Share
                  </button>
                </div>
              </article>
            ))}
          </div>
          </section>
        )}

        {activeView === 'notifications' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: '#ffffff' }}>🔔 All Notifications</h2>
              {unreadCount > 0 && (
                <button 
                  onClick={async () => {
                    await markAllNotificationsAsRead()
                    fetchNotifications()
                  }}
                  style={{
                    backgroundColor: '#3ECF8E',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(62,207,142,0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div style={{ 
                backgroundColor: '#1a1a1a', 
                borderRadius: '16px', 
                padding: '48px',
                textAlign: 'center',
                border: '1px solid #2a2a2a',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
                <span style={{ fontSize: '48px' }}>🔔</span>
                <p style={{ margin: '16px 0 0', fontSize: '16px', color: '#9ca3af' }}>No notifications yet</p>
                <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6b7280' }}>When someone likes, dislikes, comments, or replies, you'll see it here</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    style={{ 
                      backgroundColor: notification.is_read ? '#1a1a1a' : '#1e293b',
                      borderRadius: '12px', 
                      padding: '20px 24px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      border: '1px solid',
                      borderColor: notification.is_read ? '#2a2a2a' : '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.3s ease'
                    }}
                  >
  
                    <span style={{ fontSize: '24px' }}>
                      {notification.type === 'like' && '👍'}
                      {notification.type === 'dislike' && '👎'}
                      {notification.type === 'comment' && '💬'}
                      {notification.type === 'reply' && '↩️'}
                    </span>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: '600',
                          color: notification.type === 'like' ? '#3ECF8E' : 
                                 notification.type === 'dislike' ? '#ef4444' : 
                                 notification.type === 'comment' ? '#3b82f6' : '#8b5cf6',
                          backgroundColor: notification.type === 'like' ? '#1a1a1a' : 
                                          notification.type === 'dislike' ? '#1a1a1a' : 
                                          notification.type === 'comment' ? '#1a1a1a' : '#1a1a1a',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          border: `1px solid ${notification.type === 'like' ? '#3ECF8E' : 
                                             notification.type === 'dislike' ? '#ef4444' : 
                                             notification.type === 'comment' ? '#3b82f6' : '#8b5cf6'}`
                        }}>
                          {notification.type.toUpperCase()}
                        </span>
                        {!notification.is_read && (
                          <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: '#3ECF8E',
                            boxShadow: '0 0 10px rgba(62,207,142,0.5)'
                          }} />
                        )}
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#ffffff' }}>
                        <strong style={{ color: '#3ECF8E' }}>{notification.user_name}</strong>{' '}
                        {notification.type === 'like' && 'liked'}
                        {notification.type === 'dislike' && 'disliked'}
                        {notification.type === 'comment' && 'commented on'}
                        {notification.type === 'reply' && 'replied to a comment on'}{' '}
                        "<span style={{ fontWeight: '600', color: '#3ECF8E' }}>{notification.post_title}</span>"
                      </p>
                      <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#9ca3af' }}>
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <button 
                        onClick={async () => {
                          await markNotificationAsRead(notification.id)
                          fetchNotifications()
                        }}
                        style={{ 
                          backgroundColor: '#3ECF8E', 
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 10px rgba(62,207,142,0.3)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {selectedArticle && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            backdropFilter: 'blur(10px)'
          }}
          onClick={() => setSelectedArticle(null)}
        >
          <div 
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              border: '1px solid #2a2a2a'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#ffffff' }}>{selectedArticle.title}</h2>
              <button 
                onClick={() => setSelectedArticle(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '0',
                  transition: 'all 0.3s ease'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: '14px', color: '#9ca3af' }}>By {selectedArticle.author}</span>
              <span style={{ color: '#6b7280' }}>|</span>
              <span style={{ 
                backgroundColor: '#2a2a2a', 
                color: '#9ca3af', 
                padding: '4px 12px', 
                borderRadius: '16px', 
                fontSize: '13px',
                border: '1px solid #374151'
              }}>{selectedArticle.category}</span>
            </div>
            <div style={{ 
              lineHeight: '1.8', 
              fontSize: '16px', 
              color: '#d1d5db',
              marginBottom: '24px',
              whiteSpace: 'pre-wrap'
            }}>
              {selectedArticle.content}
            </div>
            <div style={{ display: 'flex', gap: '12px', paddingTop: '20px', borderTop: '1px solid #374151' }}>
              <button 
                onClick={() => handleCopyContent(selectedArticle.content)}
                style={{ 
                  backgroundColor: copied ? '#3ECF8E' : '#2a2a2a', 
                  color: copied ? '#ffffff' : '#9ca3af',
                  border: copied ? '1px solid #3ECF8E' : '1px solid #374151',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: copied ? '0 0 15px rgba(62,207,142,0.3)' : 'none'
                }}
              >
                {copied ? '✓ Copied!' : '📋 Copy Content'}
              </button>
              <button 
                onClick={() => handleLike(selectedArticle.id)}
                style={{ 
                  backgroundColor: 'transparent', 
                  border: '1px solid #374151',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#3ECF8E',
                  transition: 'all 0.3s ease'
                }}
              >
                👍 Like ({selectedArticle.likes || 0})
              </button>
              <button 
                onClick={() => handleDislike(selectedArticle.id)}
                style={{ 
                  backgroundColor: 'transparent', 
                  border: '1px solid #374151',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#ef4444',
                  transition: 'all 0.3s ease'
                }}
              >
                👎 Dislike ({selectedArticle.dislikes || 0})
              </button>
            </div>

            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #374151' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>💬 Comments</h3>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onFocus={() => { fetchComments(selectedArticle.id); }}
                  style={{ 
                    flex: 1,
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    border: '1px solid #374151',
                    backgroundColor: '#2a2a2a',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
                <button 
                  onClick={() => handleAddComment(selectedArticle.id)}
                  style={{ 
                    backgroundColor: '#3ECF8E', 
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(62,207,142,0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Post
                </button>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                {comments.map(comment => (
                  <div key={comment.id} style={{ 
                    backgroundColor: '#2a2a2a', 
                    borderRadius: '8px', 
                    padding: '16px',
                    border: '1px solid #374151'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#3ECF8E' }}>{comment.author}</span>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 12px', color: '#d1d5db', fontSize: '14px' }}>{comment.content}</p>
                  
                    <button 
                      onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); fetchReplies(comment.id); }}
                      style={{ 
                        backgroundColor: 'transparent', 
                        border: 'none',
                        color: '#9ca3af',
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      ↩️ Reply
                    </button>

                    {replyingTo === comment.id && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <input
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          style={{ 
                            flex: 1,
                            padding: '8px 12px', 
                            borderRadius: '6px', 
                            border: '1px solid #374151',
                            backgroundColor: '#1a1a1a',
                            color: '#ffffff',
                            fontSize: '13px',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                          }}
                        />
                        <button 
                          onClick={() => handleAddReply(comment.id, selectedArticle.id)}
                          style={{ 
                            backgroundColor: '#3ECF8E', 
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 10px rgba(62,207,142,0.3)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Reply
                        </button>
                      </div>
                    )}

                    {commentReplies[comment.id] && commentReplies[comment.id].length > 0 && (
                      <div style={{ marginTop: '12px', marginLeft: '20px', borderLeft: '2px solid #374151', paddingLeft: '12px' }}>
                        {commentReplies[comment.id].map(reply => (
                          <div key={reply.id} style={{ marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600', color: '#3ECF8E', fontSize: '13px' }}>{reply.author}</span>
                            <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '13px' }}>{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      {shareModal.isOpen && shareModal.post && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            border: '1px solid #2a2a2a'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#ffffff' }}>Share Article</h2>
              <button
                onClick={() => setShareModal({ isOpen: false, post: null })}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  transition: 'all 0.3s ease'
                }}
              >
                ×
              </button>
            </div>
            <p style={{ margin: '0 0 24px', color: '#d1d5db', fontSize: '15px' }}>
              Share "{shareModal.post.title}" to:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <button
                onClick={() => handleSharePlatform(shareModal.post, SharePlatform.WHATSAPP)}
                style={{
                  backgroundColor: '#25D366',
                  color: '#fff',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(37,211,102,0.3)'
                }}
              >
                <span style={{ fontSize: '24px' }}>💬</span>
                WhatsApp
              </button>
              <button
                onClick={() => handleSharePlatform(shareModal.post, SharePlatform.FACEBOOK)}
                style={{
                  backgroundColor: '#1877F2',
                  color: '#fff',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(24,119,242,0.3)'
                }}
              >
                <span style={{ fontSize: '24px' }}>📘</span>
                Facebook
              </button>
              <button
                onClick={() => handleSharePlatform(shareModal.post, SharePlatform.TWITTER)}
                style={{
                  backgroundColor: '#1DA1F2',
                  color: '#fff',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(29,161,242,0.3)'
                }}
              >
                <span style={{ fontSize: '24px' }}>🐦</span>
                Twitter
              </button>
              <button
                onClick={() => handleSharePlatform(shareModal.post, SharePlatform.LINKEDIN)}
                style={{
                  backgroundColor: '#0A66C2',
                  color: '#fff',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(10,102,194,0.3)'
                }}
              >
                <span style={{ fontSize: '24px' }}>💼</span>
                LinkedIn
              </button>
              <button
                onClick={() => handleSharePlatform(shareModal.post, SharePlatform.EMAIL)}
                style={{
                  backgroundColor: '#EA4335',
                  color: '#fff',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(234,67,53,0.3)'
                }}
              >
                <span style={{ fontSize: '24px' }}>📧</span>
                Email
              </button>
              <button
                onClick={() => handleSharePlatform(shareModal.post, SharePlatform.TELEGRAM)}
                style={{
                  backgroundColor: '#0088cc',
                  color: '#fff',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0,136,204,0.3)'
                }}
              >
                <span style={{ fontSize: '24px' }}>✈️</span>
                Telegram
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </Fragment>
  )
} 
