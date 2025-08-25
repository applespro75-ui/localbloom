import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Shop {
  id: string;
  name: string;
  services: any[];
  phone?: string;
}

interface BookingModalProps {
  shop: Shop | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ shop, isOpen, onClose }: BookingModalProps) {
  const [selectedService, setSelectedService] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !selectedService || !preferredDate || !preferredTime) return;
    
    setLoading(true);

    try {
      const preferredDateTime = new Date(`${preferredDate}T${preferredTime}`);
      
      const { error } = await supabase
        .from('bookings')
        .insert({
          customer_id: user?.id!,
          shop_id: shop.id,
          service_name: selectedService,
          preferred_time: preferredDateTime.toISOString(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Booking request sent!",
        description: "The shop owner will review your request and get back to you.",
      });

      onClose();
      setSelectedService('');
      setPreferredDate('');
      setPreferredTime('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectContact = () => {
    if (shop?.phone) {
      window.open(`https://wa.me/${shop.phone.replace(/\D/g, '')}`, '_blank');
    }
  };

  if (!shop) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Service at {shop.name}</DialogTitle>
          <DialogDescription>
            Choose a service and your preferred time. The shop owner will confirm your booking.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service">Select Service</Label>
            <Select value={selectedService} onValueChange={setSelectedService} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent>
                {shop.services?.map((service, index) => (
                  <SelectItem key={index} value={service.name}>
                    {service.name} - ₹{service.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Preferred Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="date"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="pl-10"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Preferred Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <select
                  id="time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                  required
                >
                  <option value="">Select time</option>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i;
                    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                    const ampm = hour < 12 ? 'AM' : 'PM';
                    const timeValue = `${hour.toString().padStart(2, '0')}:00`;
                    return (
                      <option key={i} value={timeValue}>
                        {hour12}:00 {ampm}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Sending...' : 'Send Booking Request'}
            </Button>
            
            {shop.phone && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDirectContact}
                className="flex items-center gap-2"
              >
                <Phone size={16} />
                WhatsApp
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}