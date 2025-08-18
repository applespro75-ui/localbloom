import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ProfileSetup from './ProfileSetup';
import ShopOwnerDashboard from './ShopOwnerDashboard';

export default function ShopOwnerContainer() {
  const [hasShop, setHasShop] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (user) {
      checkShopExists();
    }
  }, [user]);

  const checkShopExists = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setHasShop(!!data);
    } catch (error: any) {
      console.error('Error checking shop:', error);
      setHasShop(false);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = () => {
    setHasShop(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasShop) {
    return (
      <ProfileSetup 
        userProfile={userProfile} 
        onComplete={handleProfileComplete}
      />
    );
  }

  return <ShopOwnerDashboard />;
}