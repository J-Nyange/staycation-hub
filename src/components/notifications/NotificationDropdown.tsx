import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export const NotificationDropdown = () => {
  const { notifications, markAllAsRead, isLoading } = useNotifications();

  const recentNotifications = notifications.slice(0, 5);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading notifications...
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4">
        <h3 className="font-semibold">Notifications</h3>
        {notifications.some((n) => !n.is_read) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            className="text-xs"
          >
            Mark all as read
          </Button>
        )}
      </div>
      <Separator />
      <ScrollArea className="h-[400px]">
        {recentNotifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </ScrollArea>
      <Separator />
      <div className="p-2">
        <Link to="/bookings">
          <Button variant="ghost" className="w-full" size="sm">
            View all notifications
          </Button>
        </Link>
      </div>
    </div>
  );
};
