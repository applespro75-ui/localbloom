import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { StatusBadge } from '@/components/StatusBadge';
import { Upload, MapPin, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Service {
  name: string;
  price: number;
}

interface ProfileSetupProps {
  userProfile: any;
  onComplete: () => void;
}

export default function ProfileSetup({ userProfile, onComplete }: ProfileSetupProps) {
  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [loading, setLoading] = useState(false);
  
  // Shop owner specific fields
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'open' | 'mild' | 'busy' | 'closed'>('open');
  const [services, setServices] = useState<Service[]>([{ name: '', price: 0 }]);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  const addService = () => {
    setServices([...services, { name: '', price: 0 }]);
  };
  
  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };
  
  const updateService = (index: number, field: keyof Service, value: string | number) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update user profile
      const { error: userError } = await supabase
        .from('users')
        .update({ name, phone })
        .eq('id', user?.id!);

      if (userError) throw userError;

      // If shop owner, create shop
      if (userProfile.role === 'shop_owner') {
        const validServices = services.filter(s => s.name.trim() && s.price > 0);
        
        const { error: shopError } = await supabase
          .from('shops')
          .insert({
            owner_id: user?.id!,
            name: shopName,
            address,
            description,
            status,
            services: validServices as any,
            phone
          });

        if (shopError) throw shopError;
      }

      toast({
        title: "Profile completed!",
        description: "Welcome to ShopSpotlight!",
      });

      onComplete();
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>
            {userProfile.role === 'shop_owner' 
              ? 'Set up your shop details to start receiving bookings'
              : 'Complete your profile to start booking services'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone/WhatsApp Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Shop Owner Fields */}
            {userProfile.role === 'shop_owner' && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Shop Details</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="shopName">Shop Name</Label>
                      <Input
                        id="shopName"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="pl-10"
                          placeholder="Enter your shop address"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your shop and what makes it special"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Current Status</Label>
                      <RadioGroup 
                        value={status} 
                        onValueChange={(value: 'open' | 'mild' | 'busy' | 'closed') => setStatus(value)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="open" id="open" />
                          <StatusBadge status="open" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mild" id="mild" />
                          <StatusBadge status="mild" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="busy" id="busy" />
                          <StatusBadge status="busy" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="closed" id="closed" />
                          <StatusBadge status="closed" />
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Services Offered</h3>
                    <Button type="button" onClick={addService} size="sm" variant="outline">
                      <Plus size={16} className="mr-2" />
                      Add Service
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {services.map((service, index) => (
                      <div key={index} className="flex gap-3 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>Service Name</Label>
                          <Input
                            value={service.name}
                            onChange={(e) => updateService(index, 'name', e.target.value)}
                            placeholder="e.g., Haircut, Manicure"
                          />
                        </div>
                        <div className="w-24 space-y-2">
                          <Label>Price ($)</Label>
                          <Input
                            type="number"
                            value={service.price}
                            onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        {services.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeService(index)}
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                          >
                            <X size={16} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Setting up...' : 'Complete Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}