import { Home, Store, User, Heart, Calendar } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function Navigation() {
  const location = useLocation();
  const { userProfile } = useAuth();
  
  if (!userProfile) return null;

  const isShopOwner = userProfile.role === 'shop_owner';
  
  const navItems = isShopOwner ? [
    { icon: Store, label: 'My Shop', path: '/shop' },
    { icon: Calendar, label: 'Bookings', path: '/bookings' },
    { icon: User, label: 'Profile', path: '/profile' }
  ] : [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Heart, label: 'Favorites', path: '/favorites' },
    { icon: Calendar, label: 'Bookings', path: '/bookings' },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <div
                className={`p-2 rounded-full transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon size={20} />
              </div>
              <span className={`text-xs mt-1 transition-colors ${
                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}