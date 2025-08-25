import { useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface LocationPickerProps {
  address: string;
  latitude?: number;
  longitude?: number;
  onLocationChange: (data: { address: string; latitude?: number; longitude?: number }) => void;
  disabled?: boolean;
}

export default function LocationPicker({ 
  address, 
  latitude, 
  longitude, 
  onLocationChange, 
  disabled = false 
}: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        onLocationChange({
          address,
          latitude: lat,
          longitude: lng
        });
        
        toast({
          title: "Location fetched",
          description: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
        
        setLoading(false);
      },
      (error) => {
        let message = "Failed to get location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timeout.";
            break;
        }
        
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive"
        });
        
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin size={20} />
          Location Details
        </CardTitle>
        <CardDescription>
          Set your shop's precise location for customer discovery
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* GPS Coordinates Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">GPS Coordinates</Label>
            <Button
              onClick={fetchCurrentLocation}
              disabled={loading || disabled}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Navigation size={16} />
              )}
              {loading ? 'Fetching...' : 'Get Location'}
            </Button>
          </div>
          
          {latitude && longitude ? (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <MapPin size={16} />
                <span className="text-sm font-medium">Location Set</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
              </p>
            </div>
          ) : (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Click "Get Location" to fetch your precise coordinates for better customer discovery.
              </p>
            </div>
          )}
        </div>

        {/* Manual Address Section */}
        <div className="space-y-2">
          <Label htmlFor="address">Full Address</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => onLocationChange({ 
              address: e.target.value, 
              latitude, 
              longitude 
            })}
            placeholder="Enter your complete shop address..."
            disabled={disabled}
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            Provide detailed address including street, area, city, and postal code
          </p>
        </div>
      </CardContent>
    </Card>
  );
}