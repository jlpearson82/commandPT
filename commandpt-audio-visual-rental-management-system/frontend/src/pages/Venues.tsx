import { useState } from 'react';
import { useGetAllVenues, useDeleteVenue } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, MapPin, Edit, Trash2, Phone, Globe } from 'lucide-react';
import VenueDialog from '../components/VenueDialog';
import type { Venue } from '../backend';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Venues() {
  const { data: venues = [], isLoading } = useGetAllVenues();
  const deleteVenue = useDeleteVenue();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);

  const filteredVenues = venues.filter((venue) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      venue.venue_name.toLowerCase().includes(searchLower) ||
      venue.city.toLowerCase().includes(searchLower) ||
      venue.state.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setDialogOpen(true);
  };

  const handleDelete = (venue: Venue) => {
    setVenueToDelete(venue);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (venueToDelete) {
      await deleteVenue.mutateAsync(venueToDelete.venue_id);
      setDeleteDialogOpen(false);
      setVenueToDelete(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingVenue(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading venues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Venues</h1>
            <p className="text-muted-foreground mt-1">Manage delivery locations and event venues</p>
          </div>
          <img src="/assets/generated/venues-icon-transparent.dim_64x64.png" alt="Venues" className="h-16 w-16 opacity-80" />
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Venue
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by venue name, city, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredVenues.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No venues found matching your search' : 'No venues yet. Add your first venue to get started.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredVenues.map((venue) => (
                <Card key={venue.venue_id.toString()} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{venue.venue_name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(venue)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(venue)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{venue.address_line_1}</p>
                        {venue.address_line_2 && <p>{venue.address_line_2}</p>}
                        <p>
                          {venue.city}, {venue.state} {venue.postal_code}
                        </p>
                        <p className="text-muted-foreground">{venue.country}</p>
                      </div>
                    </div>
                    {venue.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{venue.phone}</span>
                      </div>
                    )}
                    {venue.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {venue.website}
                        </a>
                      </div>
                    )}
                    {venue.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-muted-foreground text-xs">{venue.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <VenueDialog open={dialogOpen} onOpenChange={handleDialogClose} editingVenue={editingVenue} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Venue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{venueToDelete?.venue_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
