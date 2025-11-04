import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Home, Calendar, Star, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['owner-properties', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ['owner-earnings', user?.id],
    queryFn: async () => {
      if (!user || !properties) return null;
      const propertyIds = properties.map(p => p.id);
      
      const { data, error } = await supabase
        .from('property_earnings')
        .select('*')
        .in('property_id', propertyIds);
      
      if (error) throw error;

      const totalEarnings = data.reduce((sum, e) => sum + Number(e.net_amount), 0);
      const pendingPayout = data
        .filter(e => e.payout_status === 'pending')
        .reduce((sum, e) => sum + Number(e.net_amount), 0);
      
      return { totalEarnings, pendingPayout, earnings: data };
    },
    enabled: !!user && !!properties,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['owner-bookings', user?.id],
    queryFn: async () => {
      if (!user || !properties) return [];
      const propertyIds = properties.map(p => p.id);
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*, properties(title)')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!properties,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
          <p className="text-lg">Please sign in to access your owner dashboard.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const isLoading = propertiesLoading || earningsLoading || bookingsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
          <p className="text-muted-foreground">Manage your properties and track earnings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">${earnings?.totalEarnings.toFixed(2) || '0.00'}</div>
              )}
              <p className="text-xs text-muted-foreground">All-time revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">${earnings?.pendingPayout.toFixed(2) || '0.00'}</div>
              )}
              <p className="text-xs text-muted-foreground">Ready to withdraw</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{properties?.length || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Active listings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{bookings?.length || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : bookings && bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{booking.properties?.title || 'Property'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${booking.total_price}</p>
                      <p className={`text-sm ${
                        booking.status === 'confirmed' ? 'text-green-600' :
                        booking.status === 'pending' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {booking.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No bookings yet</p>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
