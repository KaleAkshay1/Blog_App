import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNotifications } from '@/context/notifications'
import { Button } from '@/components/ui/button'

export function NotificationBell() {
  const { unreadCount, refresh } = useNotifications()
  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link
        to="/notifications"
        onClick={refresh}
        aria-label={unreadCount ? 'Notifications, ' + unreadCount + ' unread' : 'Notifications'}
      >
        <Bell className="!size-[19px]" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 text-primary-foreground"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  )
}
