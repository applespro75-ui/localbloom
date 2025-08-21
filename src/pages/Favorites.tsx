import { useState, useEffect } from 'react';
import { Heart, MapPin, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import BookingModal from '@/components/BookingModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Navigation } from '@/components/Navigation';

interface Shop {
  id: string;
  name: string;
  address: string;
  description: string;
  status: string;
  services: any[];
  photo_url?: string;
}

interface Favorite {
  customer_id: string;
  shop_id: string;
  shops: Shop;
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          customer_id,
          shop_id,
          shops (
            id,
            name,
            address,
            description,
            status,
            services,
            photo_url
          )
        `)
        .eq('customer_id', user?.id);

      if (error) throw error;
      setFavorites((data || []) as Favorite[]);
    } catch (error: any) {
      toast({
        title: "Error fetching favorites",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (shopId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('customer_id', user?.id)
        .eq('shop_id', shopId);

      if (error) throw error;

      toast({
        title: "Removed from favorites",
        description: "Shop has been removed from your favorites.",
      });
      
      fetchFavorites();
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
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Heart className="text-red-500" size={24} />
            My Favorites
          </h1>
          <p className="text-muted-foreground">Your saved shops</p>
        </div>

        <div className="space-y-4">
          {favorites.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Heart className="mx-auto text-muted-foreground mb-4" size={48} />
                <p className="text-muted-foreground">No favorite shops yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Browse shops and tap the heart icon to add them here!
                </p>
              </CardContent>
            </Card>
          ) : (
            favorites.map((favorite) => (
              <Card 
                key={`${favorite.customer_id}-${favorite.shop_id}`} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedShop(favorite.shops);
                  setBookingModalOpen(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{favorite.shops.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin size={14} className="mr-1" />
                        {favorite.shops.address || 'Address not provided'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={favorite.shops.status as any} />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromFavorites(favorite.shop_id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {favorite.shops.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {favorite.shops.description}
                    </p>
                  )}
                  {favorite.shops.services && favorite.shops.services.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {favorite.shops.services.slice(0, 3).map((service, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                        >
                          {service.name} - ₹{service.price}
                        </span>
                      ))}
                      {favorite.shops.services.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{favorite.shops.services.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  <Button className="w-full mt-2" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedShop(favorite.shops);
                    setBookingModalOpen(true);
                  }}>
                    Book Service
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      <BookingModal 
        shop={selectedShop}
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />
      <Navigation />
    </div>
  );
}