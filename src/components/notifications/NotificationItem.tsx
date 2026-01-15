import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import {
  Calendar,
  MessageSquare,
  Star,
  CreditCard,
  Info,
  Home,
} from "lucide-react";

interface NotificationItemProps {
  notification: Notification;
}

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "booking":
      return <Calendar className="h-5 w-5 text-primary" />;
    case "message":
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case "review":
      return <Star className="h-5 w-5 text-yellow-500" />;
    case "payment":
      return <CreditCard className="h-5 w-5 text-green-500" />;
    case "property_update":
      return <Home className="h-5 w-5 text-purple-500" />;
    default:
      return <Info className="h-5 w-5 text-muted-foreground" />;
  }
};

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { markAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // For booking notifications, navigate to booking history page
    if (notification.type === 'booking') {
      e.preventDefault();
      navigate('/bookings');
    }
  };

  const content = (
    <div
      className={cn(
        "flex gap-3 p-4 hover:bg-accent transition-colors cursor-pointer",
        !notification.is_read && "bg-accent/50"
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 space-y-1">
        <p className="font-medium text-sm leading-tight">
          {notification.title}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>
      {!notification.is_read && (
        <div className="flex-shrink-0">
          <div className="h-2 w-2 bg-primary rounded-full" />
        </div>
      )}
    </div>
  );

  // If it's NOT a booking, we might still want to use the link if present
  if (notification.action_url && notification.type !== 'booking') {
    return <Link to={notification.action_url} onClick={handleClick}>{content}</Link>;
  }

  // For bookings (or no URL), just return the content which has the onClick
  return content;
};
