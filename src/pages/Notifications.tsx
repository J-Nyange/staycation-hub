import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEO from "@/components/SEO";

export default function Notifications() {
  const { user } = useAuth();
  const { notifications, markAllAsRead, isLoading } = useNotifications();

  if (!user) {
    return <Navigate to="/" />;
  }

  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const readNotifications = notifications.filter((n) => n.is_read);

  return (
    <>
      <SEO 
        title="Notifications"
        description="View your notifications and updates"
      />
      <Navbar />
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadNotifications.length > 0 && (
              <Button onClick={() => markAllAsRead()} variant="outline">
                Mark all as read
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No notifications yet</p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Unread ({unreadNotifications.length})
                </TabsTrigger>
                <TabsTrigger value="read">
                  Read ({readNotifications.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6 space-y-2">
                <div className="bg-card rounded-lg border">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="unread" className="mt-6 space-y-2">
                {unreadNotifications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No unread notifications
                  </div>
                ) : (
                  <div className="bg-card rounded-lg border">
                    {unreadNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="read" className="mt-6 space-y-2">
                {readNotifications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No read notifications
                  </div>
                ) : (
                  <div className="bg-card rounded-lg border">
                    {readNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
