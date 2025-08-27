import ShopOwnerContainer from '@/components/ShopOwnerContainer';
import { Navigation } from '@/components/Navigation';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';

export default function Shop() {
  return (
    <div className="pb-20">
      <ThemeToggleButton />
      <ShopOwnerContainer />
      <Navigation />
    </div>
  );
}