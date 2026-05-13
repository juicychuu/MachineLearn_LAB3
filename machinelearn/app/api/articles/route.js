import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function normalizeSupabaseUrl(url) {
  try {
    return new URL(url).origin
  } catch (error) {
    console.warn('Invalid NEXT_PUBLIC_SUPABASE_URL, falling back to default Supabase URL.', url)
    return 'https://fepshpsflpzaejqbizit.supabase.co'
  }
}

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fepshpsflpzaejqbizit.supabase.co')
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHNocHNmbHB6YWVqcWJpeml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTQ2MjAsImV4cCI6MjA5MTczMDYyMH0.DUgB5ERwQNfxvlMS_4ji7FcmXMkwTEUA6nCgx7PY0uk'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL is not set. Falling back to embedded Supabase URL.')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

function isSameUserAsAuthor(user, author) {
  if (!author) return false

  const normalizedAuthor = String(author).trim().toLowerCase()
  const userEmail = String(user.email || '').trim().toLowerCase()
  const userFullName = String(user.user_metadata?.full_name || '').trim().toLowerCase()
  const userName = String(user.user_metadata?.name || '').trim().toLowerCase()

  return [userEmail, userFullName, userName].some((value) => value && value === normalizedAuthor)
}

async function notifyNewPublishedArticle(article, author) {
  if (!supabaseServiceKey) {
    console.log('SUPABASE_SERVICE_ROLE_KEY not set - skipping new post notifications')
    return
  }

  try {
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('Error fetching users for new post notification:', usersError)
      return
    }

    const recipients = users?.users || []
    if (!recipients.length) {
      return
    }

    const userIds = recipients.map((user) => user.id)

    const { data: existingNotifications, error: existingError } = await supabase
      .from('notifications')
      .select('user_id')
      .in('user_id', userIds)
      .eq('post_id', article.id)
      .eq('type', 'new_post')

    if (existingError) {
      console.error('Error checking existing new post notifications:', existingError)
      return
    }

    const existingUserIds = new Set((existingNotifications || []).map((n) => n.user_id))
    const notifications = recipients
      .filter((user) => !existingUserIds.has(user.id))
      .map((user) => ({
        post_id: article.id,
        post_title: article.title,
        type: 'new_post',
        user_name: author,
        user_id: user.id,
        is_read: false
      }))

    if (!notifications.length) {
      return
    }

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (notificationError) {
      console.error('Error creating new post notifications:', notificationError)
    }
  } catch (notificationErr) {
    console.error('New post notification creation failed:', notificationErr)
  }
}

export async function POST(request) {
  try {
    const { title, content, author, category } = await request.json()

    if (!title || !content || !author || !category) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Insert the article
    const { data: article, error: articleError } = await supabase
      .from('posts')
      .insert([{ title, content, author, category, likes: 0, dislikes: 0 }])
      .select()
      .single()

    if (articleError) {
      console.error('Database error inserting article:', articleError)
      throw new Error(`Failed to insert article: ${articleError.message}`)
    }

    await notifyNewPublishedArticle(article, author)

    // TODO: Send email notifications to all users
    // You can use Supabase's email service or a third-party service like Resend
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'noreply@yourapp.com',
    //   to: users.users.map(u => u.email),
    //   subject: `New article posted: ${article.title}`,
    //   html: `<p>A new article "${article.title}" has been posted by ${author}.</p>`
    // })

    return NextResponse.json({ success: true, article })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json({ error: error.message || 'Failed to create article' }, { status: 500 })
  }
}