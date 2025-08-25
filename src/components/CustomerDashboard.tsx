import { useState, useEffect } from 'react';
import { Search, MapPin, Filter, Heart, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import BookingModal from '@/components/BookingModal';
import ServicesModal from '@/components/ServicesModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Shop {
  id: string;
  name: string;
  address: string;
  description: string;
  status: 'open' | 'mild' | 'busy' | 'closed';
  services: any[];
  photo_url?: string;
  latitude?: number;
  longitude?: number;
}

export default function CustomerDashboard() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showNearby, setShowNearby] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchShops();
    
    // Set up real-time subscription for shop status updates
    const channel = supabase
      .channel('shop-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shops'
        },
        (payload) => {
          console.log('Shop updated:', payload);
          fetchShops(); // Refresh shops when any shop changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShops((data || []) as any);
    } catch (error: any) {
      toast({
        title: "Error fetching shops",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = shops.filter(shop => 
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(shop => shop.status === statusFilter);
    }

    // Apply nearby filter
    if (showNearby && userLocation) {
      filtered = filtered.filter(shop => {
        if (!shop.latitude || !shop.longitude) return false;
        const distance = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          shop.latitude, 
          shop.longitude
        );
        return distance <= 1; // Within 1km
      });
    }

    setFilteredShops(filtered);
  }, [shops, searchTerm, statusFilter, showNearby, userLocation]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleNearbyClick = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setShowNearby(true);
        toast({
          title: "Location updated",
          description: "Showing nearby shops within 1km.",
        });
      },
      (error) => {
        toast({
          title: "Location Error",
          description: "Failed to get your location. Please enable location permissions.",
          variant: "destructive"
        });
      }
    );
  };

  const handleStatusFilter = (status: string) => {
    if (statusFilter === status) {
      setStatusFilter(null);
    } else {
      setStatusFilter(status);
    }
    setShowNearby(false);
  };

  const addToFavorites = async (shopId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .insert({ customer_id: user?.id!, shop_id: shopId });

      if (error) throw error;
      
      toast({
        title: "Added to favorites",
        description: "Shop has been added to your favorites.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse"></div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
        <Input
          type="text"
          placeholder="Search shops by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button 
          variant={!statusFilter && !showNearby ? "default" : "outline"} 
          size="sm"
          onClick={() => {
            setStatusFilter(null);
            setShowNearby(false);
          }}
        >
          <Filter size={16} className="mr-2" />
          All Shops
        </Button>
        <Button 
          variant={showNearby ? "default" : "outline"} 
          size="sm"
          onClick={handleNearbyClick}
        >
          <MapPin size={16} className="mr-2" />
          Nearby
        </Button>
        <div 
          className={`cursor-pointer transition-all ${statusFilter === 'open' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleStatusFilter('open')}
        >
          <StatusBadge status="open" />
        </div>
        <div 
          className={`cursor-pointer transition-all ${statusFilter === 'mild' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleStatusFilter('mild')}
        >
          <StatusBadge status="mild" />
        </div>
        <div 
          className={`cursor-pointer transition-all ${statusFilter === 'busy' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleStatusFilter('busy')}
        >
          <StatusBadge status="busy" />
        </div>
      </div>

      {/* Shops List */}
      <div className="space-y-4">
        {filteredShops.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? 'No shops found matching your search.' : 'No shops available yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredShops.map((shop) => (
             <Card 
              key={shop.id} 
              className="premium-card cursor-pointer"
              onClick={() => {
                setSelectedShop(shop);
                setBookingModalOpen(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{shop.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin size={14} className="mr-1" />
                      {shop.address || 'Address not provided'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={shop.status} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToFavorites(shop.id);
                      }}
                    >
                      <Heart size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {shop.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {shop.description}
                  </p>
                )}
                 {shop.services && shop.services.length > 0 && (
                   <div className="flex flex-wrap gap-2 mb-3">
                     {shop.services.slice(0, 3).map((service, index) => (
                       <span
                         key={index}
                         className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium"
                       >
                         {service.name} - ₹{service.price}
                       </span>
                     ))}
                     {shop.services.length > 3 && (
                       <span className="text-xs text-muted-foreground font-medium">
                         +{shop.services.length - 3} more services
                       </span>
                     )}
                   </div>
                 )}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShop(shop);
                      setServicesModalOpen(true);
                    }}
                  >
                    <List size={16} className="mr-1" />
                    Services Offered
                  </Button>
                  <Button className="flex-1" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedShop(shop);
                    setBookingModalOpen(true);
                  }}>
                    Book Service
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      <BookingModal 
        shop={selectedShop}
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />
      
      <ServicesModal 
        isOpen={servicesModalOpen}
        onClose={() => setServicesModalOpen(false)}
        shopName={selectedShop?.name || ''}
        services={selectedShop?.services || []}
      />
    </div>
  );
}