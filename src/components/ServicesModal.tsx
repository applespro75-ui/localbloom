import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Service {
  name: string;
  price: string;
  description?: string;
}

interface ServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  services: Service[];
}

export default function ServicesModal({ isOpen, onClose, shopName, services }: ServicesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Services Offered</DialogTitle>
          <DialogDescription>
            Available services at {shopName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {services && services.length > 0 ? (
            services.map((service, index) => (
              <div key={index} className="flex justify-between items-start p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{service.name}</h4>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {service.description}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="ml-2">
                  ₹{service.price}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No services listed yet.
            </p>
          )}
        </div>
        
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}