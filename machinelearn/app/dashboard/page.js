'use client'

import { useState, useEffect, Fragment } from 'react'
import { addArticles, likeArticle, dislikeArticle, addComment, getComments, addReply, getReplies, shareArticle, SharePlatform } from '../../services/articleService'
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
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <aside style={{ width: '260px', backgroundColor: '#fff', borderRight: '1px solid #e9ecef', padding: '32px 0' }}>
        <div style={{ padding: '0 24px', marginBottom: '40px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1a1a2e' }}>Machine Learning Hub</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#868e96' }}>Where data finds its voice and the future finds its code</p>
        </div>
        
        <nav>
          {sidebarItems.map((item, index) => (
            <div 
              key={index} 
              onClick={() => handleSidebarClick(item.id)}
              style={{ 
                padding: '14px 24px', 
                cursor: 'pointer',
                backgroundColor: activeView === item.id ? '#f1f3f5' : 'transparent',
                borderLeft: activeView === item.id ? '3px solid #1a1a2e' : '3px solid transparent',
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{ 
                fontSize: '15px', 
                fontWeight: activeView === item.id ? '600' : '400',
                color: activeView === item.id ? '#1a1a2e' : '#495057'
              }}>{item.label}</span>
              {item.hasBadge && unreadCount > 0 && (
                <span style={{
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginLeft: 'auto'
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '40px 48px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#1a1a2e' }}>
              {activeView === 'notifications' ? 'Notifications' : 'Dashboard'}
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#868e96' }}>
              {activeView === 'notifications' ? 'View who liked, disliked, commented and replied' : 'Manage your articles and content'}
            </p>
          </div>
          {activeView === 'dashboard' && (
            <button 
              onClick={() => setShowForm(!showForm)}
              style={{ 
                backgroundColor: '#1a1a2e', 
                color: '#fff', 
                border: 'none',
                padding: '14px 28px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(26, 26, 46, 0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>+</span> {showForm ? 'Close Form' : 'Add New Article'}
            </button>
          )}
        </header>

        {activeView === 'dashboard' && showForm && (
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: '12px', 
            padding: '32px', 
            marginBottom: '40px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
          }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '20px', fontWeight: '600', color: '#1a1a2e' }}>Create New Article</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <input
                  placeholder="Article Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid #e9ecef',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
                <input
                  placeholder="Author Name"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  style={{ 
                    padding: '14px 16px', 
                    borderRadius: '12px', 
                    border: '1px solid #e9ecef',
                    fontSize: '15px',
                    outline: 'none'
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
                  border: '1px solid #e9ecef',
                  fontSize: '15px',
                  outline: 'none'
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
                  border: '1px solid #e9ecef',
                  fontSize: '15px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <button 
                type="submit"
                style={{ 
                  backgroundColor: '#1a1a2e', 
                  color: '#fff', 
                  border: 'none',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  justifySelf: 'start',
                  minWidth: '180px'
                }}
              >
                Publish Article
              </button>
            </form>
          </div>
        )}

        {activeView === 'dashboard' && posts.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: '600', color: '#1a1a2e' }}>🏆 Top 5 Most Liked Articles</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {[...posts]
                .filter(post => (post.likes || 0) > 0)
                .sort((a, b) => (b.likes || 0) - (a.likes || 0))
                .slice(0, 5)
                .map((post, index) => (
                  <div 
                    key={post.id}
                    style={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '12px', 
                      padding: '20px 24px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      border: '1px solid #f1f3f5'
                    }}
                  >
                    <span style={{ 
                      fontSize: '24px', 
                      fontWeight: '700', 
                      color: index === 0 ? '#ffc107' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#868e96',
                      width: '40px',
                      textAlign: 'center'
                    }}>#{index + 1}</span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1a1a2e' }}>{post.title}</h3>
                      <span style={{ fontSize: '14px', color: '#868e96' }}>{post.author}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleLike(post.id)}
                        style={{ 
                          backgroundColor: 'transparent', 
                          border: '1px solid #e9ecef',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#28a745'
                        }}
                      >
                        👍 {post.likes || 0}
                      </button>
                      <button 
                        onClick={() => handleDislike(post.id)}
                        style={{ 
                          backgroundColor: 'transparent', 
                          border: '1px solid #e9ecef',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#dc3545'
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
          <h2 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: '600', color: '#1a1a2e' }}>All Articles</h2>
          <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
            {posts.map(post => (
              <article 
                key={post.id} 
                style={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '12px', 
                  padding: '28px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease',
                  border: '1px solid #f1f3f5'
                }}
              >
                <h3 style={{ 
                  margin: '0 0 16px', 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: '#1a1a2e',
                  lineHeight: '1.4'
                }}>{post.title}</h3>
                <p style={{ 
                  margin: '0 0 20px', 
                  color: '#495057', 
                  lineHeight: '1.7',
                  fontSize: '15px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>{post.content}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#868e96', fontWeight: '500' }}>{post.author}</span>
                  <span style={{ 
                    backgroundColor: '#f8f9fa', 
                    color: '#495057', 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>{post.category}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f3f5'
                }}>
                  <button 
                    onClick={() => setSelectedArticle(post)}
                    style={{ 
                      backgroundColor: '#1a1a2e', 
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    📖 Read More
                  </button>
                  <button 
                    onClick={() => handleLike(post.id)}
                    style={{ 
                      backgroundColor: 'transparent', 
                      border: '1px solid #e9ecef',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#28a745',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    👍 Like ({post.likes || 0})
                  </button>
                  <button 
                    onClick={() => handleDislike(post.id)}
                    style={{ 
                      backgroundColor: 'transparent', 
                      border: '1px solid #e9ecef',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#dc3545',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    👎 Dislike ({post.dislikes || 0})
                  </button>
                  <button 
                    onClick={() => handleShare(post)}
                    style={{ 
                      backgroundColor: 'transparent', 
                      border: '1px solid #e9ecef',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#007bff',
                      transition: 'all 0.2s ease'
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
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: '#1a1a2e' }}>🔔 All Notifications</h2>
              {unreadCount > 0 && (
                <button 
                  onClick={async () => {
                    await markAllNotificationsAsRead()
                    fetchNotifications()
                  }}
                  style={{ 
                    backgroundColor: '#fff', 
                    color: '#1a1a2e',
                    border: '1px solid #e9ecef',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div style={{ 
                backgroundColor: '#fff', 
                borderRadius: '12px', 
                padding: '48px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '48px' }}>🔔</span>
                <p style={{ margin: '16px 0 0', fontSize: '16px', color: '#868e96' }}>No notifications yet</p>
                <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#adb5bd' }}>When someone likes, dislikes, comments, or replies, you'll see it here</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    style={{ 
                      backgroundColor: notification.is_read ? '#fff' : '#f8f9ff',
                      borderRadius: '12px', 
                      padding: '20px 24px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      border: '1px solid',
                      borderColor: notification.is_read ? '#f1f3f5' : '#e9ecef',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
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
                          color: notification.type === 'like' ? '#28a745' : 
                                 notification.type === 'dislike' ? '#dc3545' : 
                                 notification.type === 'comment' ? '#007bff' : '#6f42c1',
                          backgroundColor: notification.type === 'like' ? '#d4edda' : 
                                          notification.type === 'dislike' ? '#f8d7da' : 
                                          notification.type === 'comment' ? '#cce5ff' : '#e2e3f5',
                          padding: '4px 10px',
                          borderRadius: '12px'
                        }}>
                          {notification.type.toUpperCase()}
                        </span>
                        {!notification.is_read && (
                          <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: '#007bff' 
                          }} />
                        )}
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#1a1a2e' }}>
                        <strong>{notification.user_name}</strong>{' '}
                        {notification.type === 'like' && 'liked'}
                        {notification.type === 'dislike' && 'disliked'}
                        {notification.type === 'comment' && 'commented on'}
                        {notification.type === 'reply' && 'replied to a comment on'}{' '}
                        "<span style={{ fontWeight: '600' }}>{notification.post_title}</span>"
                      </p>
                      <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#868e96' }}>
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
                          backgroundColor: 'transparent', 
                          color: '#868e96',
                          border: '1px solid #e9ecef',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedArticle(null)}
        >
          <div 
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#1a1a2e' }}>{selectedArticle.title}</h2>
              <button 
                onClick={() => setSelectedArticle(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#868e96',
                  padding: '0'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: '14px', color: '#868e96' }}>By {selectedArticle.author}</span>
              <span style={{ color: '#dee2e6' }}>|</span>
              <span style={{ 
                backgroundColor: '#f8f9fa', 
                color: '#495057', 
                padding: '4px 12px', 
                borderRadius: '16px', 
                fontSize: '13px'
              }}>{selectedArticle.category}</span>
            </div>
            <div style={{ 
              lineHeight: '1.8', 
              fontSize: '16px', 
              color: '#495057',
              marginBottom: '24px',
              whiteSpace: 'pre-wrap'
            }}>
              {selectedArticle.content}
            </div>
            <div style={{ display: 'flex', gap: '12px', paddingTop: '20px', borderTop: '1px solid #e9ecef' }}>
              <button 
                onClick={() => handleCopyContent(selectedArticle.content)}
                style={{ 
                  backgroundColor: copied ? '#28a745' : '#1a1a2e', 
                  color: '#fff',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                {copied ? '✓ Copied!' : '📋 Copy Content'}
              </button>
              <button 
                onClick={() => handleLike(selectedArticle.id)}
                style={{ 
                  backgroundColor: 'transparent', 
                  border: '1px solid #e9ecef',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#28a745',
                  transition: 'all 0.2s ease'
                }}
              >
                👍 Like ({selectedArticle.likes || 0})
              </button>
              <button 
                onClick={() => handleDislike(selectedArticle.id)}
                style={{ 
                  backgroundColor: 'transparent', 
                  border: '1px solid #e9ecef',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#dc3545',
                  transition: 'all 0.2s ease'
                }}
              >
                👎 Dislike ({selectedArticle.dislikes || 0})
              </button>
            </div>

            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e9ecef' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: '#1a1a2e' }}>💬 Comments</h3>
              
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
                    border: '1px solid #e9ecef',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button 
                  onClick={() => handleAddComment(selectedArticle.id)}
                  style={{ 
                    backgroundColor: '#1a1a2e', 
                    color: '#fff',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Post
                </button>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                {comments.map(comment => (
                  <div key={comment.id} style={{ 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px', 
                    padding: '16px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#1a1a2e' }}>{comment.author}</span>
                      <span style={{ fontSize: '12px', color: '#868e96' }}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 12px', color: '#495057', fontSize: '14px' }}>{comment.content}</p>
                  
                    <button 
                      onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); fetchReplies(comment.id); }}
                      style={{ 
                        backgroundColor: 'transparent', 
                        border: 'none',
                        color: '#1a1a2e',
                        fontSize: '13px',
                        cursor: 'pointer',
                        padding: 0
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
                            border: '1px solid #e9ecef',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                        <button 
                          onClick={() => handleAddReply(comment.id, selectedArticle.id)}
                          style={{ 
                            backgroundColor: '#1a1a2e', 
                            color: '#fff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          Reply
                        </button>
                      </div>
                    )}

                    {commentReplies[comment.id] && commentReplies[comment.id].length > 0 && (
                      <div style={{ marginTop: '12px', marginLeft: '20px', borderLeft: '2px solid #dee2e6', paddingLeft: '12px' }}>
                        {commentReplies[comment.id].map(reply => (
                          <div key={reply.id} style={{ marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '13px' }}>{reply.author}</span>
                            <p style={{ margin: '4px 0 0', color: '#495057', fontSize: '13px' }}>{reply.content}</p>
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

      {/* Share Modal */}
      {shareModal.isOpen && shareModal.post && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Share Article</h2>
              <button
                onClick={() => setShareModal({ isOpen: false, post: null })}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#868e96'
                }}
              >
                ×
              </button>
            </div>
            <p style={{ margin: '0 0 24px', color: '#495057', fontSize: '15px' }}>
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
                  gap: '8px'
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
                  gap: '8px'
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
                  gap: '8px'
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
                  gap: '8px'
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
                  gap: '8px'
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
                  gap: '8px'
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
