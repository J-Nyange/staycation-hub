import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Bell, Smartphone, Mail, MessageSquare, Loader2, Check } from 'lucide-react';

export default function NotificationSettings() {
  const { user } = useUser();
  const { toast } = useToast();
  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } = usePushNotifications();
  
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    push_notifications_enabled: true,
    sms_notifications_enabled: false,
    phone: '',
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('push_notifications_enabled, sms_notifications_enabled, phone')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setSettings({
        push_notifications_enabled: data.push_notifications_enabled ?? true,
        sms_notifications_enabled: data.sms_notifications_enabled ?? false,
        phone: data.phone || '',
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          push_notifications_enabled: settings.push_notifications_enabled,
          sms_notifications_enabled: settings.sms_notifications_enabled,
          phone: settings.phone || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      await subscribe();
    } else {
      await unsubscribe();
    }
    setSettings(prev => ({ ...prev, push_notifications_enabled: enabled }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to receive notifications about your bookings and updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push Notifications */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label className="text-base font-semibold">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get instant alerts in your browser
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {pushLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubscribed && <Check className="h-4 w-4 text-green-500" />}
            <Switch
              checked={isSubscribed}
              onCheckedChange={handlePushToggle}
              disabled={!isSupported || pushLoading}
            />
          </div>
        </div>

        {!isSupported && (
          <Alert>
            <AlertDescription>
              Push notifications are not supported in your browser.
            </AlertDescription>
          </Alert>
        )}

        {/* SMS Notifications */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-base font-semibold">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive critical alerts via text message
                </p>
              </div>
            </div>
            <Switch
              checked={settings.sms_notifications_enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, sms_notifications_enabled: checked }))
              }
            />
          </div>

          {settings.sms_notifications_enabled && (
            <div className="ml-14 space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+254 700 000 000"
                value={settings.phone}
                onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Enter your phone number with country code for SMS alerts.
              </p>
            </div>
          )}
        </div>

        {/* Email Notifications - Always on */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg opacity-75">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label className="text-base font-semibold">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Always receive booking confirmations and updates
              </p>
            </div>
          </div>
          <Switch checked disabled />
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
