import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import CustomerDashboard from '@/components/CustomerDashboard';
import ShopOwnerContainer from '@/components/ShopOwnerContainer';
import ProfileSetup from '@/components/ProfileSetup';
import { ThemeToggle } from '@/components/ThemeToggle';

const Index = () => {
  const { user, userProfile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  // Check if customer profile setup is complete 
  const customerNeedsProfileSetup = userProfile.role === 'customer' && (!userProfile.name || !userProfile.phone);

  if (customerNeedsProfileSetup) {
    return <ProfileSetup userProfile={userProfile} onComplete={() => window.location.reload()} />;
  }

  return (
    <div className="pb-20">
      <ThemeToggleButton />
      {userProfile?.role === 'shop_owner' ? (
        <ShopOwnerContainer />
      ) : (
        <CustomerDashboard />
      )}
      <Navigation />
    </div>
  );
};

export default Index;
