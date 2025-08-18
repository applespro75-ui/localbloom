import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface Booking {
  id: string;
  shop_id: string;
  customer_id: string;
  status: string;
  service_name?: string;
  preferred_time?: string;
  created_at: string;
  shops?: {
    name: string;
    phone?: string;
  };
  users?: {
    name: string;
    phone?: string;
  };
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchBookings();
      
      // Set up real-time subscription for booking updates
      const channel = supabase
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

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          shops!inner(name, phone),
          users!inner(name, phone)
        `)
        .order('created_at', { ascending: false });

      // Filter based on user role
      if (userProfile?.role === 'shop_owner') {
        // Shop owners see bookings for their shops
        const { data: userShops } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_id', user?.id);
        
        const shopIds = userShops?.map(shop => shop.id) || [];
        query = query.in('shop_id', shopIds);
      } else {
        // Customers see their own bookings
        query = query.eq('customer_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings((data || []) as Booking[]);
    } catch (error: any) {
      toast({
        title: "Error fetching bookings",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Booking updated",
        description: `Booking has been ${newStatus}.`,
      });
      
      fetchBookings();
    } catch (error: any) {
      toast({
        title: "Error updating booking",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const openWhatsApp = (phone?: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterBookingsByStatus = (status: string) => {
    return bookings.filter(booking => booking.status === status);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card key={booking.id}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {userProfile?.role === 'shop_owner' ? booking.users?.name : booking.shops?.name}
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Calendar size={14} className="mr-1" />
              {new Date(booking.created_at).toLocaleDateString()}
              <Clock size={14} className="ml-3 mr-1" />
              {new Date(booking.created_at).toLocaleTimeString()}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap">
          {userProfile?.role === 'shop_owner' && booking.status === 'pending' && (
            <>
              <Button 
                size="sm" 
                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
              >
                Confirm
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
              >
                Cancel
              </Button>
            </>
          )}
          
          {userProfile?.role === 'shop_owner' && booking.status === 'confirmed' && (
            <Button 
              size="sm" 
              onClick={() => updateBookingStatus(booking.id, 'completed')}
            >
              Mark Complete
            </Button>
          )}

          {/* Contact buttons */}
          {(userProfile?.role === 'shop_owner' ? booking.users?.phone : booking.shops?.phone) && (
            <>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  const phone = userProfile?.role === 'shop_owner' ? booking.users?.phone : booking.shops?.phone;
                  if (phone) window.open(`tel:${phone}`, '_self');
                }}
              >
                <Phone size={16} className="mr-1" />
                Call
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  const phone = userProfile?.role === 'shop_owner' ? booking.users?.phone : booking.shops?.phone;
                  openWhatsApp(phone);
                }}
              >
                <MessageCircle size={16} className="mr-1" />
                WhatsApp
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          {userProfile?.role === 'shop_owner' ? 'Shop Bookings' : 'My Bookings'}
        </h1>
        <p className="text-muted-foreground">
          {userProfile?.role === 'shop_owner' 
            ? 'Manage customer booking requests' 
            : 'Track your service bookings'
          }
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({filterBookingsByStatus('pending').length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({filterBookingsByStatus('confirmed').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filterBookingsByStatus('completed').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {bookings.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No bookings found.</p>
              </CardContent>
            </Card>
          ) : (
            bookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {filterBookingsByStatus('pending').map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4 mt-6">
          {filterBookingsByStatus('confirmed').map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {filterBookingsByStatus('completed').map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}