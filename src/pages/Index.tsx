import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import CustomerDashboard from '@/components/CustomerDashboard';
import ShopOwnerContainer from '@/components/ShopOwnerContainer';
import ProfileSetup from '@/components/ProfileSetup';

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
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-bold">
            {userProfile.role === 'shop_owner' ? 'Shop Dashboard' : 'Find Shops'}
          </h1>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </header>
      
      <main className="p-4">
        {userProfile.role === 'shop_owner' ? (
          <ShopOwnerContainer />
        ) : (
          <CustomerDashboard />
        )}
      </main>
      
      <Navigation />
    </div>
  );
};

export default Index;
