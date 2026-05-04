import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Use service key if available, otherwise fall back to anon key (may not work for all operations)
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

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

    // Try to create notifications for all users (requires service role key)
    if (supabaseServiceKey) {
      try {
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

        if (usersError) {
          console.error('Error fetching users:', usersError)
          // Continue without notifications if we can't fetch users
        } else if (users.users && users.users.length > 0) {
          const notifications = users.users.map(user => ({
            post_id: article.id,
            post_title: article.title,
            type: 'new_post',
            user_name: author,
            user_id: user.id,
            is_read: false
          }))

          const { error: notificationError } = await supabase
            .from('notifications')
            .insert(notifications)

          if (notificationError) {
            console.error('Error creating notifications:', notificationError)
            // Continue even if notifications fail
          }
        }
      } catch (notificationErr) {
        console.error('Notification creation failed:', notificationErr)
        // Continue with article creation even if notifications fail
      }
    } else {
      console.log('SUPABASE_SERVICE_ROLE_KEY not set - skipping user notifications')
    }

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