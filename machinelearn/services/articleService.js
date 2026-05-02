import { supabase } from '../lib/supabaseClient'
import { createNotification, NotificationType } from './notificationService'

// Get current user from Supabase auth
async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return user
}

// Get user's vote on a specific post
export async function getUserVote(postId) {
    try {
        const user = await getCurrentUser()
        if (!user) return null

        const { data, error } = await supabase
            .from('user_votes')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .maybeSingle()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error fetching user vote:', error.message)
        return null
    }
}

// Get all user votes for multiple posts
export async function getUserVotesForPosts(postIds) {
    try {
        const user = await getCurrentUser()
        if (!user) return {}

        const { data, error } = await supabase
            .from('user_votes')
            .select('*')
            .eq('user_id', user.id)
            .in('post_id', postIds)

        if (error) throw error

        // Convert to object with postId as key
        const votesMap = {}
        data.forEach(vote => {
            votesMap[vote.post_id] = vote
        })
        return votesMap
    } catch (error) {
        console.error('Error fetching user votes:', error.message)
        return {}
    }
}

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
        const user = await getCurrentUser()
        if (!user) throw new Error('User not authenticated')

        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .maybeSingle()

        if (fetchError) throw fetchError
        if (!post) throw new Error('Post not found')

        // Check if user has already voted
        const existingVote = await getUserVote(id)

        if (existingVote) {
            if (existingVote.vote_type === 'like') {
                // User already liked - remove the like
                await supabase
                    .from('user_votes')
                    .delete()
                    .eq('id', existingVote.id)

                await supabase
                    .from('posts')
                    .update({ likes: Math.max(0, (post.likes || 0) - 1) })
                    .eq('id', id)

                return true
            } else if (existingVote.vote_type === 'dislike') {
                // User previously disliked - change to like
                await supabase
                    .from('user_votes')
                    .update({ vote_type: 'like' })
                    .eq('id', existingVote.id)

                await supabase
                    .from('posts')
                    .update({
                        likes: (post.likes || 0) + 1,
                        dislikes: Math.max(0, (post.dislikes || 0) - 1)
                    })
                    .eq('id', id)

                // Create notification for like
                await createNotification({
                    postId: id,
                    postTitle: post.title,
                    type: NotificationType.LIKE,
                    userName: 'User',
                    userId: user.id
                })

                return true
            }
        } else {
            // No existing vote - add like
            const { error: insertError } = await supabase
                .from('user_votes')
                .insert([{ user_id: user.id, post_id: id, vote_type: 'like' }])

            if (insertError) throw insertError

            await supabase
                .from('posts')
                .update({ likes: (post.likes || 0) + 1 })
                .eq('id', id)

            // Create notification for like
            await createNotification({
                postId: id,
                postTitle: post.title,
                type: NotificationType.LIKE,
                userName: 'User',
                userId: user.id
            })

            return true
        }
    } catch (error) {
        console.error('Error liking article:', error.message)
        return false
    }
}

export async function dislikeArticle(id) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('User not authenticated')

        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .maybeSingle()

        if (fetchError) throw fetchError
        if (!post) throw new Error('Post not found')

        // Check if user has already voted
        const existingVote = await getUserVote(id)

        if (existingVote) {
            if (existingVote.vote_type === 'dislike') {
                // User already disliked - remove the dislike
                await supabase
                    .from('user_votes')
                    .delete()
                    .eq('id', existingVote.id)

                await supabase
                    .from('posts')
                    .update({ dislikes: Math.max(0, (post.dislikes || 0) - 1) })
                    .eq('id', id)

                return true
            } else if (existingVote.vote_type === 'like') {
                // User previously liked - change to dislike
                await supabase
                    .from('user_votes')
                    .update({ vote_type: 'dislike' })
                    .eq('id', existingVote.id)

                await supabase
                    .from('posts')
                    .update({
                        likes: Math.max(0, (post.likes || 0) - 1),
                        dislikes: (post.dislikes || 0) + 1
                    })
                    .eq('id', id)

                // Create notification for dislike
                await createNotification({
                    postId: id,
                    postTitle: post.title,
                    type: NotificationType.DISLIKE,
                    userName: 'User',
                    userId: user.id
                })

                return true
            }
        } else {
            // No existing vote - add dislike
            const { error: insertError } = await supabase
                .from('user_votes')
                .insert([{ user_id: user.id, post_id: id, vote_type: 'dislike' }])

            if (insertError) throw insertError

            await supabase
                .from('posts')
                .update({ dislikes: (post.dislikes || 0) + 1 })
                .eq('id', id)

            // Create notification for dislike
            await createNotification({
                postId: id,
                postTitle: post.title,
                type: NotificationType.DISLIKE,
                userName: 'User',
                userId: user.id
            })

            return true
        }
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

// Share platforms enum
export const SharePlatform = {
    WHATSAPP: 'whatsapp',
    FACEBOOK: 'facebook',
    TWITTER: 'twitter',
    LINKEDIN: 'linkedin',
    EMAIL: 'email',
    TELEGRAM: 'telegram'
}

// Generate share URL for a post
export function getShareUrl(postId, postTitle) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/dashboard?post=${postId}`
}

// Share article to different platforms
export async function shareArticle(post, platform) {
    try {
        if (!post || !platform) {
            throw new Error('Post and platform are required')
        }

        const shareUrl = getShareUrl(post.id, post.title)
        const shareText = `Check out this article: ${post.title}`
        
        let shareUrlGenerated = ''
        
        switch (platform) {
            case SharePlatform.WHATSAPP:
                shareUrlGenerated = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
                break
            case SharePlatform.FACEBOOK:
                shareUrlGenerated = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
                break
            case SharePlatform.TWITTER:
                shareUrlGenerated = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
                break
            case SharePlatform.LINKEDIN:
                shareUrlGenerated = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(post.title)}`
                break
            case SharePlatform.EMAIL:
                shareUrlGenerated = `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
                break
            case SharePlatform.TELEGRAM:
                shareUrlGenerated = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
                break
            default:
                throw new Error('Invalid platform')
        }

        // Open share window
        if (typeof window !== 'undefined' && shareUrlGenerated) {
            window.open(shareUrlGenerated, '_blank', 'width=600,height=400')
        }

        return { success: true, platform, url: shareUrlGenerated }
    } catch (error) {
        console.error('Error sharing article:', error.message)
        return { success: false, error: error.message }
    }
}