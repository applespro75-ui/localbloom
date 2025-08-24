import ShopOwnerContainer from '@/components/ShopOwnerContainer';
import { Navigation } from '@/components/Navigation';

export default function Shop() {
  return (
    <div className="pb-20">
      <ShopOwnerContainer />
      <Navigation />
    </div>
  );
}