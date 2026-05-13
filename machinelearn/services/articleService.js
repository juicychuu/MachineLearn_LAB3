import { supabase } from '../lib/supabaseClient'
import { createNotification, NotificationType } from './notificationService'

export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return user
}

function isEmail(value) {
    return typeof value === 'string' && value.includes('@')
}

function maskEmail(email) {
    const [localPart, domain] = email.split('@')
    if (!localPart || !domain) return email

    const maskedLocal = localPart.length <= 2
        ? `${localPart[0]}*`
        : `${localPart[0]}${'*'.repeat(Math.max(1, localPart.length - 2))}${localPart.slice(-1)}`

    const [host, ...rest] = domain.split('.')
    const maskedHost = host.length <= 2
        ? `${host[0]}*`
        : `${host[0]}${'*'.repeat(Math.max(1, host.length - 2))}${host.slice(-1)}`

    return `${maskedLocal}@${maskedHost}${rest.length ? `.${rest.join('.')}` : ''}`
}

export function formatDisplayName(name) {
    if (!name) return 'User'
    return isEmail(name) ? maskEmail(name) : name
}

export async function getCurrentUserDisplayName() {
    const user = await getCurrentUser()
    if (!user) return 'User'
    return user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User'
}

export async function getCurrentUserLastSignIn() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
        console.error('Error fetching current user last sign-in:', error.message)
        return null
    }
    return user?.last_sign_in_at ? new Date(user.last_sign_in_at).toISOString() : null
}

export async function isCurrentUserNew() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
        console.error('Error checking current user age:', error.message)
        return false
    }

    if (!user?.created_at || !user?.last_sign_in_at) {
        return false
    }

    const createdAt = new Date(user.created_at).getTime()
    const lastSignInAt = new Date(user.last_sign_in_at).getTime()
    const timeDiff = Math.abs(lastSignInAt - createdAt)

    // Treat user as new if their first sign-in occurred within one minute of account creation.
    return timeDiff <= 60 * 1000
}

export async function setCurrentUserDisplayName(displayName) {
    const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName }
    })
    if (error) throw error
    return true
}

export async function isCurrentUserAuthor(author) {
    const user = await getCurrentUser()
    if (!user) return false
    const currentName = user.user_metadata?.full_name || user.user_metadata?.name || user.email
    return currentName === author
}

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

        const response = await fetch('/api/articles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, content, author, category }),
        })

        const data = await response.json().catch(() => null)

        if (!response.ok) {
            const errorMessage = data?.error || data?.message || 'Failed to create article'
            throw new Error(errorMessage)
        }

        return data?.article || null
    } catch (error) {
        console.error('Error adding article:', error.message)
        return null
    }
}

export async function likeArticle(id) {
    try {
        const user = await getCurrentUser()
        if (!user) throw new Error('User not authenticated')

        const userDisplayName = await getCurrentUserDisplayName()

        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .maybeSingle()

        if (fetchError) throw fetchError
        if (!post) throw new Error('Post not found')

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

                await createNotification({
                    postId: id,
                    postTitle: post.title,
                    type: NotificationType.LIKE,
                    userName: userDisplayName,
                    userId: user.id
                })

                return true
            }
        } else {
     
            const { error: insertError } = await supabase
                .from('user_votes')
                .insert([{ user_id: user.id, post_id: id, vote_type: 'like' }])

            if (insertError) throw insertError

            await supabase
                .from('posts')
                .update({ likes: (post.likes || 0) + 1 })
                .eq('id', id)

            await createNotification({
                postId: id,
                postTitle: post.title,
                type: NotificationType.LIKE,
                userName: userDisplayName,
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

        const userDisplayName = await getCurrentUserDisplayName()

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

                await createNotification({
                    postId: id,
                    postTitle: post.title,
                    type: NotificationType.DISLIKE,
                    userName: userDisplayName,
                    userId: user.id
                })

                return true
            }
        } else {
          
            const { error: insertError } = await supabase
                .from('user_votes')
                .insert([{ user_id: user.id, post_id: id, vote_type: 'dislike' }])

            if (insertError) throw insertError

            await supabase
                .from('posts')
                .update({ dislikes: (post.dislikes || 0) + 1 })
                .eq('id', id)

            await createNotification({
                postId: id,
                postTitle: post.title,
                type: NotificationType.DISLIKE,
                userName: userDisplayName,
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

        const user = await getCurrentUser()
        if (!user) throw new Error('User not authenticated')

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

        if (post) {
            await createNotification({
                postId: postId,
                postTitle: post.title,
                type: NotificationType.COMMENT,
                userName: author,
                userId: user.id
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

export async function deleteComment(commentId, author) {
    try {
        if (!commentId || !author) {
            throw new Error('Comment id and author are required')
        }

        const user = await getCurrentUser()
        if (!user) throw new Error('User not authenticated')

        const currentName = user.user_metadata?.full_name || user.user_metadata?.name || user.email
        if (currentName !== author) {
            throw new Error('You can only delete your own comment')
        }

        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error deleting comment:', error.message)
        return false
    }
}

export async function addReply(commentId, { author, content }) {
    try {
        if (!author || !content) {
            throw new Error('Author and content are required')
        }

        const user = await getCurrentUser()
        if (!user) throw new Error('User not authenticated')

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

        await createNotification({
            postId: comment?.post_id || null,
            postTitle: postTitle,
            type: NotificationType.REPLY,
            userName: author,
            userId: user.id
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

export const SharePlatform = {
    WHATSAPP: 'whatsapp',
    FACEBOOK: 'facebook',
    TWITTER: 'twitter',
    LINKEDIN: 'linkedin',
    EMAIL: 'email',
    TELEGRAM: 'telegram'
}

export function getShareUrl(postId, postTitle) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/dashboard?post=${postId}`
}

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

        if (typeof window !== 'undefined' && shareUrlGenerated) {
            window.open(shareUrlGenerated, '_blank', 'width=600,height=400')
        }

        return { success: true, platform, url: shareUrlGenerated }
    } catch (error) {
        console.error('Error sharing article:', error.message)
        return { success: false, error: error.message }
    }
}