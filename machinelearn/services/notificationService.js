import { supabase } from '../lib/supabaseClient'

// Notification types
export const NotificationType = {
    LIKE: 'like',
    DISLIKE: 'dislike',
    COMMENT: 'comment',
    REPLY: 'reply',
    NEW_POST: 'new_post'
}

// Create a notification when someone interacts with an article
export async function createNotification({ 
    postId, 
    postTitle, 
    type, 
    userName, 
    userId 
}) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                post_id: postId,
                post_title: postTitle,
                type,
                user_name: userName,
                user_id: userId,
                is_read: false
            }])
            .select()

        if (error) throw error

        return data
    } catch (error) {
        console.error('Error creating notification:', error.message)
        return null
    }
}

// Get all notifications for the dashboard
export async function getNotifications() {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return data || []
    } catch (error) {
        console.error('Error fetching notifications:', error.message)
        return []
    }
}

// Mark notification as read
export async function markNotificationAsRead(id) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)

        if (error) throw error

        return true
    } catch (error) {
        console.error('Error marking notification as read:', error.message)
        return false
    }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('is_read', false)

        if (error) throw error

        return true
    } catch (error) {
        console.error('Error marking all notifications as read:', error.message)
        return false
    }
}

// Get unread notification count
export async function getUnreadNotificationCount() {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('id', { count: 'exact' })
            .eq('is_read', false)

        if (error) throw error

        return data?.length || 0
    } catch (error) {
        console.error('Error getting unread count:', error.message)
        return 0
    }
}

// Format notification message based on type
export function formatNotificationMessage(notification) {
    const { type, user_name, post_title } = notification
    
    switch (type) {
        case NotificationType.LIKE:
            return `${user_name} liked your article "${post_title}"`
        case NotificationType.DISLIKE:
            return `${user_name} disliked your article "${post_title}"`
        case NotificationType.COMMENT:
            return `${user_name} commented on your article "${post_title}"`
        case NotificationType.REPLY:
            return `${user_name} replied to a comment on "${post_title}"`
        case NotificationType.NEW_POST:
            return `New article posted: "${post_title}" by ${user_name}`
        default:
            return `${user_name} interacted with "${post_title}"`
    }
}