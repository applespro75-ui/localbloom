import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Service {
  name: string;
  price: number;
  description?: string;
}

interface ServiceManagerProps {
  shopId: string;
  services: Service[];
  onServicesUpdate: (services: Service[]) => void;
}

export default function ServiceManager({ shopId, services, onServicesUpdate }: ServiceManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newService, setNewService] = useState({ name: '', price: '', description: '' });
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();

  const handleAddService = async () => {
    if (!newService.name || !newService.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in service name and price.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const updatedServices = [
        ...services,
        {
          name: newService.name,
          price: parseFloat(newService.price),
          description: newService.description
        }
      ];

      const { error } = await supabase
        .from('shops')
        .update({ services: updatedServices as any })
        .eq('id', shopId);

      if (error) throw error;

      onServicesUpdate(updatedServices);
      setNewService({ name: '', price: '', description: '' });
      setIsAdding(false);
      
      toast({
        title: "Service Added",
        description: "New service has been added successfully.",
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

  const handleUpdateService = async (index: number, updatedService: Service) => {
    setLoading(true);
    try {
      const updatedServices = [...services];
      updatedServices[index] = updatedService;

      const { error } = await supabase
        .from('shops')
        .update({ services: updatedServices as any })
        .eq('id', shopId);

      if (error) throw error;

      onServicesUpdate(updatedServices);
      setEditingIndex(null);
      
      toast({
        title: "Service Updated",
        description: "Service has been updated successfully.",
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

  const handleDeleteService = async (index: number) => {
    setLoading(true);
    try {
      const updatedServices = services.filter((_, i) => i !== index);

      const { error } = await supabase
        .from('shops')
        .update({ services: updatedServices as any })
        .eq('id', shopId);

      if (error) throw error;

      onServicesUpdate(updatedServices);
      
      toast({
        title: "Service Deleted",
        description: "Service has been removed successfully.",
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

  return (
    <Card className="premium-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Services Management</CardTitle>
            <CardDescription>Add, edit, or remove your shop services</CardDescription>
          </div>
          <Button 
            onClick={() => setIsAdding(true)} 
            className="premium-button"
            disabled={isAdding}
          >
            <Plus size={16} className="mr-2" />
            Add Service
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Service Form */}
        {isAdding && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Service Name</Label>
                <Input
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="e.g., Hair Cut"
                />
              </div>
              <div>
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  placeholder="e.g., 500"
                />
              </div>
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                placeholder="Brief description of the service"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddService} disabled={loading} size="sm">
                <Save size={16} className="mr-2" />
                Save Service
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAdding(false);
                  setNewService({ name: '', price: '', description: '' });
                }} 
                size="sm"
              >
                <X size={16} className="mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Services List */}
        <div className="space-y-3">
          {services.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No services added yet. Click "Add Service" to get started.
            </p>
          ) : (
            services.map((service, index) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                {editingIndex === index ? (
                  <EditServiceForm
                    service={service}
                    onSave={(updatedService) => handleUpdateService(index, updatedService)}
                    onCancel={() => setEditingIndex(null)}
                    loading={loading}
                  />
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{service.name}</span>
                        <Badge variant="secondary">₹{service.price}</Badge>
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingIndex(index)}
                        disabled={loading}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteService(index)}
                        disabled={loading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EditServiceForm({ 
  service, 
  onSave, 
  onCancel, 
  loading 
}: { 
  service: Service; 
  onSave: (service: Service) => void; 
  onCancel: () => void; 
  loading: boolean; 
}) {
  const [editedService, setEditedService] = useState({
    name: service.name,
    price: service.price.toString(),
    description: service.description || ''
  });

  const handleSave = () => {
    if (!editedService.name || !editedService.price) return;
    
    onSave({
      name: editedService.name,
      price: parseFloat(editedService.price),
      description: editedService.description
    });
  };

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          value={editedService.name}
          onChange={(e) => setEditedService({ ...editedService, name: e.target.value })}
          placeholder="Service name"
        />
        <Input
          type="number"
          value={editedService.price}
          onChange={(e) => setEditedService({ ...editedService, price: e.target.value })}
          placeholder="Price"
        />
      </div>
      <Textarea
        value={editedService.description}
        onChange={(e) => setEditedService({ ...editedService, description: e.target.value })}
        placeholder="Description"
        rows={2}
      />
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={loading} size="sm">
          <Save size={16} className="mr-2" />
          Save
        </Button>
        <Button variant="outline" onClick={onCancel} size="sm">
          <X size={16} className="mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}