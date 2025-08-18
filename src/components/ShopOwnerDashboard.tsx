import { useState, useEffect } from 'react';
import { Plus, Edit, Clock, CheckCircle, XCircle, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface Shop {
  id: string;
  name: string;
  address: string;
  description: string;
  status: 'open' | 'mild' | 'busy' | 'closed';
  services: any[];
  photo_url?: string;
}

interface Booking {
  id: string;
  service_name: string;
  preferred_time: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  customer_id: string;
  users?: {
    name: string;
    phone: string;
  };
}

export default function ShopOwnerDashboard() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchShopData();
      
      // Set up real-time subscription for new bookings and status changes
      const bookingChannel = supabase
        .channel('booking-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings'
          },
          (payload) => {
            console.log('Booking updated:', payload);
            fetchBookings();
          }
        )
        .subscribe();

      const shopChannel = supabase
        .channel('shop-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'shops',
            filter: `owner_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Shop updated:', payload);
            if (payload.new) {
              setShop(payload.new as Shop);
              toast({
                title: "Status updated in real-time",
                description: `Shop status changed to ${payload.new.status}.`,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(bookingChannel);
        supabase.removeChannel(shopChannel);
      };
    }
  }, [user]);

  useEffect(() => {
    if (shop?.id) {
      fetchBookings();
    }
  }, [shop?.id]);

  const fetchShopData = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setShop(data as Shop);
    } catch (error: any) {
      console.error('Error fetching shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!shop?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users:customer_id (
            name,
            phone
          )
        `)
        .eq('shop_id', shop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings((data || []) as Booking[]);
    } catch (error: any) {
      toast({
        title: "Error fetching bookings",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateShopStatus = async (newStatus: 'open' | 'mild' | 'busy' | 'closed') => {
    if (!shop) return;

    try {
      const { error } = await supabase
        .from('shops')
        .update({ status: newStatus })
        .eq('id', shop.id);

      if (error) throw error;

      setShop({ ...shop, status: newStatus });
      toast({
        title: "Status updated",
        description: `Shop status changed to ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus }
          : booking
      ));

      toast({
        title: `Booking ${newStatus}`,
        description: `The booking has been ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating booking",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded animate-pulse"></div>
        <div className="h-48 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Your Shop</CardTitle>
            <CardDescription>
              You haven't created a shop yet. Create one to start receiving bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>
              <Plus className="mr-2" size={16} />
              Create Shop
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Shop Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Settings size={16} className="mr-2" />
            {isEditing ? 'Cancel Edit' : 'Edit Shop'}
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut size={16} className="mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Shop Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Shop Status Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    {shop.name}
                    <StatusBadge status={shop.status} />
                  </CardTitle>
                  <CardDescription>{shop.address}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Shop Status (Real-time updates)</label>
                  <Select value={shop.status} onValueChange={updateShopStatus}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {shop.description && (
                  <p className="text-sm text-muted-foreground">{shop.description}</p>
                )}

                {/* Services Display */}
                {shop.services && shop.services.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Services</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {shop.services.map((service: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                          <span className="text-sm">{service.name}</span>
                          <span className="text-sm font-medium">₹{service.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          {/* Booking Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={20} />
                Booking Requests
                {pendingBookings.length > 0 && (
                  <Badge variant="destructive">{pendingBookings.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Manage incoming booking requests from customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No booking requests yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{booking.users?.name || 'Customer'}</p>
                          <p className="text-sm text-muted-foreground">
                            Service: {booking.service_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Preferred: {new Date(booking.preferred_time).toLocaleString()}
                          </p>
                          {booking.users?.phone && (
                            <p className="text-sm text-muted-foreground">
                              Phone: {booking.users.phone}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            booking.status === 'pending' ? 'outline' :
                            booking.status === 'accepted' ? 'default' : 'destructive'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      
                      {booking.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => updateBookingStatus(booking.id, 'accepted')}
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateBookingStatus(booking.id, 'declined')}
                          >
                            <XCircle size={16} className="mr-2" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}