import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Phone, MapPin, Edit, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [shopData, setShopData] = useState<any>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);
      setName(profile?.name || '');
      setPhone(profile?.phone || '');

      // If shop owner, fetch shop data
      if (profile?.role === 'shop_owner') {
        const { data: shop } = await supabase
          .from('shops')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();
        
        if (shop) {
          setShopData(shop);
          setShopName(shop.name || '');
          setAddress(shop.address || '');
          setDescription(shop.description || '');
        }
      }
    } catch (error: any) {
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // Update user profile
      const { error: userError } = await supabase
        .from('users')
        .update({ name, phone })
        .eq('id', user?.id!);

      if (userError) throw userError;

      // If shop owner, update shop data
      if (userProfile?.role === 'shop_owner' && shopData) {
        const { error: shopError } = await supabase
          .from('shops')
          .update({
            name: shopName,
            address,
            description,
            phone
          })
          .eq('id', shopData.id);

        if (shopError) throw shopError;
      }

      setIsEditing(false);
      fetchProfile();
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
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

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Profile</CardTitle>
                <CardDescription>
                  Manage your {userProfile.role === 'shop_owner' ? 'shop' : 'account'} information
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                disabled={loading}
              >
                <Edit size={16} className="mr-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Information */}
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={userProfile.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input 
                value={userProfile.role === 'shop_owner' ? 'Shop Owner' : 'Customer'} 
                disabled 
              />
            </div>
            
            {/* Profile photo upload */}
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="text-xs text-muted-foreground mb-2">
                {userProfile.role === 'customer' ? 'Face photo only' : 'Shop full photo from outside including banner'}
              </div>
              <Button variant="outline" disabled={!isEditing}>
                <Plus size={16} className="mr-2" />
                Upload Photo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shop Information (only for shop owners) */}
        {userProfile.role === 'shop_owner' && (
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={20} />
                Shop Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name</Label>
                <Input
                  id="shopName"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        {isEditing && (
          <Card className="premium-card">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Button 
                  onClick={handleSave} 
                  disabled={loading} 
                  className="flex-1 premium-button"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Navigation />
    </div>
  );
}