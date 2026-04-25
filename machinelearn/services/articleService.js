import { supabase } from '../lib/supabaseClient'
import { createNotification, NotificationType } from './notificationService'

export async function addArticles({ title, content, author, category }) {
    try {
        if (!title || !content || !author || !category) {
            throw new Error('All fields are required')
        }

        const { data, error } = await supabase
            .from('posts')
            .insert([{ title, content, author, category, likes: 0, dislikes: 0 }])
            .select()

        if (error) throw error

        return data
    } catch (error) {
        console.error('Error adding article:', error.message)
        return null
    }
}

export async function likeArticle(id) {
    try {
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .maybeSingle()

        if (fetchError) throw fetchError
        if (!post) throw new Error('Post not found')

        const { error } = await supabase
            .from('posts')
            .update({ likes: (post.likes || 0) + 1 })
            .eq('id', id)

        if (error) throw error

        // Create notification for like
        await createNotification({
            postId: id,
            postTitle: post.title,
            type: NotificationType.LIKE,
            userName: 'User',
            userId: 'user-1'
        })

        return true
    } catch (error) {
        console.error('Error liking article:', error.message)
        return false
    }
}

export async function dislikeArticle(id) {
    try {
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .maybeSingle()

        if (fetchError) throw fetchError
        if (!post) throw new Error('Post not found')

        const { error } = await supabase
            .from('posts')
            .update({ dislikes: (post.dislikes || 0) + 1 })
            .eq('id', id)

        if (error) throw error

        // Create notification for dislike
        await createNotification({
            postId: id,
            postTitle: post.title,
            type: NotificationType.DISLIKE,
            userName: 'User',
            userId: 'user-1'
        })

        return true
    } catch (error) {
        console.error('Error disliking article:', error.message)
        return false
    }
}

export async function addComment(postId, { author, content }) {
    try {
        if (!author || !content) {
            throw new Error('Author and content are required')
        }

        // Get post title for notification
        const { data: post } = await supabase
            .from('posts')
            .select('title')
            .eq('id', postId)
            .maybeSingle()

        const { data, error } = await supabase
            .from('comments')
            .insert([{ post_id: postId, author, content }])
            .select()

        if (error) throw error

        // Create notification for comment
        if (post) {
            await createNotification({
                postId: postId,
                postTitle: post.title,
                type: NotificationType.COMMENT,
                userName: author,
                userId: 'user-1'
            })
        }

        return data
    } catch (error) {
        console.error('Error adding comment:', error.message)
        return null
    }
}

export async function getComments(postId) {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

        if (error) throw error

        return data
    } catch (error) {
        console.error('Error fetching comments:', error.message)
        return []
    }
}

export async function addReply(commentId, { author, content }) {
    try {
        if (!author || !content) {
            throw new Error('Author and content are required')
        }

        // Get post title through comment
        const { data: comment } = await supabase
            .from('comments')
            .select('post_id')
            .eq('id', commentId)
            .maybeSingle()

        let postTitle = 'Article'
        if (comment) {
            const { data: post } = await supabase
                .from('posts')
                .select('title')
                .eq('id', comment.post_id)
                .maybeSingle()
            if (post) postTitle = post.title
        }

        const { data, error } = await supabase
            .from('replies')
            .insert([{ comment_id: commentId, author, content }])
            .select()

        if (error) throw error

        // Create notification for reply
        await createNotification({
            postId: comment?.post_id || null,
            postTitle: postTitle,
            type: NotificationType.REPLY,
            userName: author,
            userId: 'user-1'
        })

        return data
    } catch (error) {
        console.error('Error adding reply:', error.message)
        return null
    }
}

export async function getReplies(commentId) {
    try {
        const { data, error } = await supabase
            .from('replies')
            .select('*')
            .eq('comment_id', commentId)
            .order('created_at', { ascending: true })

        if (error) throw error

        return data
    } catch (error) {
        console.error('Error fetching replies:', error.message)
        return []
    }
}