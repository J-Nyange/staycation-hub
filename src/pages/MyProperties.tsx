import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EditPropertyModal from "@/components/EditPropertyModal";
import TransferOwnershipModal from "@/components/TransferOwnershipModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ArrowLeft, Plus, Eye, ArrowRightLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Property } from "@/hooks/useProperties";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MyProperties = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [transferringProperty, setTransferringProperty] = useState<{ id: string; title: string } | null>(null);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['my-properties', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Property[];
    },
    enabled: !!user,
  });

  const handleDelete = async (propertyId: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Property Deleted",
        description: "Your property has been successfully deleted.",
      });

      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      setDeletingPropertyId(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete property. Please try again.",
      });
    }
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-md mx-auto text-center p-8">
              <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to manage your properties.
              </p>
              <Button onClick={() => navigate('/')}>Go to Home</Button>
            </Card>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Properties</h1>
              <p className="text-muted-foreground">
                Manage your property listings
              </p>
            </div>
            <Button onClick={() => navigate('/')}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Property
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <Skeleton className="w-full h-48" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : properties && properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={property.main_image}
                        alt={property.title}
                        className="w-full h-48 object-cover"
                      />
                      <Badge
                        className={`absolute top-3 right-3 ${
                          property.is_active
                            ? 'bg-green-500/90 text-white'
                            : 'bg-red-500/90 text-white'
                        }`}
                      >
                        {property.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2 line-clamp-1">
                        {property.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        {property.location}
                      </p>
                      <p className="text-lg font-bold text-primary mb-4">
                        ${property.price_per_night}/night
                      </p>

                        <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setEditingProperty(property)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setDeletingPropertyId(property.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-muted-foreground hover:text-foreground"
                          onClick={() => setTransferringProperty({ id: property.id, title: property.title })}
                        >
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          Transfer Ownership
                        </Button>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {property.category}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>Max {property.guests} guests</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center p-12">
              <Plus className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Properties Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by adding your first property to begin hosting guests.
              </p>
              <Button onClick={() => navigate('/')}>Add Your First Property</Button>
            </Card>
          )}
        </div>
      </main>
      <Footer />

      {editingProperty && (
        <EditPropertyModal
          open={!!editingProperty}
          onOpenChange={(open) => !open && setEditingProperty(null)}
          property={editingProperty}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['my-properties'] });
            setEditingProperty(null);
          }}
        />
      )}

      <AlertDialog open={!!deletingPropertyId} onOpenChange={(open) => !open && setDeletingPropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your property
              and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPropertyId && handleDelete(deletingPropertyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {transferringProperty && (
        <TransferOwnershipModal
          open={!!transferringProperty}
          onOpenChange={(open) => !open && setTransferringProperty(null)}
          propertyId={transferringProperty.id}
          propertyTitle={transferringProperty.title}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['my-properties'] });
          }}
        />
      )}
    </>
  );
};

export default MyProperties;
