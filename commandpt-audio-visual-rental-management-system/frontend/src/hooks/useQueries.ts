import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { CatalogItem, AssetUnit, Client, Quote, Booking, UserProfile, Vendor, Subrental, Venue, EquipmentLocation, Cost } from '../backend';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

// Catalog Item Queries
export function useGetAllCatalogItems() {
  const { actor, isFetching } = useActor();

  return useQuery<CatalogItem[]>({
    queryKey: ['catalogItems'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCatalogItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCatalogItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<CatalogItem, 'item_id'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addCatalogItem({ ...item, item_id: 0n } as CatalogItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogItems'] });
      toast.success('Catalog item added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add catalog item: ${error.message}`);
    },
  });
}

export function useUpdateCatalogItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, item }: { id: bigint; item: CatalogItem }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCatalogItem(id, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogItems'] });
      toast.success('Catalog item updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update catalog item: ${error.message}`);
    },
  });
}

export function useDeleteCatalogItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCatalogItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogItems'] });
      queryClient.invalidateQueries({ queryKey: ['assetUnits'] });
      toast.success('Catalog item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete catalog item: ${error.message}`);
    },
  });
}

// Asset Unit Queries
export function useGetAllAssetUnits() {
  const { actor, isFetching } = useActor();

  return useQuery<AssetUnit[]>({
    queryKey: ['assetUnits'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAssetUnits();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAssetUnitsByItemId(itemId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AssetUnit[]>({
    queryKey: ['assetUnits', itemId?.toString()],
    queryFn: async () => {
      if (!actor || itemId === null) return [];
      return actor.getAssetUnitsByItemId(itemId);
    },
    enabled: !!actor && !isFetching && itemId !== null,
  });
}

export function useAddAssetUnit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unit: Omit<AssetUnit, 'asset_unit_id'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAssetUnit({ ...unit, asset_unit_id: 0n } as AssetUnit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetUnits'] });
      toast.success('Asset unit added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add asset unit: ${error.message}`);
    },
  });
}

export function useUpdateAssetUnit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, unit }: { id: bigint; unit: AssetUnit }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAssetUnit(id, unit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetUnits'] });
      toast.success('Asset unit updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update asset unit: ${error.message}`);
    },
  });
}

export function useDeleteAssetUnit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAssetUnit(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetUnits'] });
      toast.success('Asset unit deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete asset unit: ${error.message}`);
    },
  });
}

export function useImportCsvData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (csvData: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.importCsvData(csvData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogItems'] });
      queryClient.invalidateQueries({ queryKey: ['assetUnits'] });
      toast.success('CSV data imported successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to import CSV: ${error.message}`);
    },
  });
}

export function useClearInventoryData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearInventoryData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogItems'] });
      queryClient.invalidateQueries({ queryKey: ['assetUnits'] });
      toast.success('Inventory data cleared successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to clear inventory: ${error.message}`);
    },
  });
}

export function useDownloadCsvTemplate() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const csvContent = await actor.getCsvTemplate();
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'inventory_import_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return csvContent;
    },
    onSuccess: () => {
      toast.success('CSV template downloaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to download template: ${error.message}`);
    },
  });
}

// Venue Queries
export function useGetAllVenues() {
  const { actor, isFetching } = useActor();

  return useQuery<Venue[]>({
    queryKey: ['venues'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVenues();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchVenues(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Venue[]>({
    queryKey: ['venues', 'search', searchTerm],
    queryFn: async () => {
      if (!actor || !searchTerm) return [];
      return actor.searchVenues(searchTerm);
    },
    enabled: !!actor && !isFetching && searchTerm.length > 0,
  });
}

export function useAddVenue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (venue: Omit<Venue, 'venue_id'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addVenue({ ...venue, venue_id: 0n } as Venue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('Venue added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add venue: ${error.message}`);
    },
  });
}

export function useUpdateVenue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, venue }: { id: bigint; venue: Venue }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateVenue(id, venue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('Venue updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update venue: ${error.message}`);
    },
  });
}

export function useDeleteVenue() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteVenue(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      toast.success('Venue deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete venue: ${error.message}`);
    },
  });
}

// Client Queries
export function useGetAllClients() {
  const { actor, isFetching } = useActor();

  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllClients();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: Omit<Client, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addClient({ ...client, id: 0n } as Client);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add client: ${error.message}`);
    },
  });
}

export function useUpdateClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, client }: { id: bigint; client: Client }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateClient(id, client);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });
}

export function useDeleteClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteClient(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete client: ${error.message}`);
    },
  });
}

// Quote Queries
export function useGetAllQuotes() {
  const { actor, isFetching } = useActor();

  return useQuery<Quote[]>({
    queryKey: ['quotes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllQuotes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetConfirmedQuotes() {
  const { actor, isFetching } = useActor();

  return useQuery<Quote[]>({
    queryKey: ['confirmedQuotes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConfirmedQuotes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateQuote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quote: Omit<Quote, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createQuote({ ...quote, id: 0n } as Quote);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['confirmedQuotes'] });
      toast.success('Quote created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create quote: ${error.message}`);
    },
  });
}

export function useUpdateQuote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quote }: { id: bigint; quote: Quote }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateQuote(id, quote);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['confirmedQuotes'] });
      toast.success('Quote updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update quote: ${error.message}`);
    },
  });
}

export function useDeleteQuote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteQuote(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['confirmedQuotes'] });
      toast.success('Quote deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete quote: ${error.message}`);
    },
  });
}

// Booking Queries
export function useGetAllBookings() {
  const { actor, isFetching } = useActor();

  return useQuery<Booking[]>({
    queryKey: ['bookings'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBookings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddBooking() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: Omit<Booking, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBooking({ ...booking, id: 0n } as Booking);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add booking: ${error.message}`);
    },
  });
}

export function useUpdateBooking() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, booking }: { id: bigint; booking: Booking }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBooking(id, booking);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update booking: ${error.message}`);
    },
  });
}

export function useDeleteBooking() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBooking(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete booking: ${error.message}`);
    },
  });
}

// Vendor Queries
export function useGetAllVendors() {
  const { actor, isFetching } = useActor();

  return useQuery<Vendor[]>({
    queryKey: ['vendors'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVendors();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddVendor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendor: Omit<Vendor, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addVendor({ ...vendor, id: 0n } as Vendor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add vendor: ${error.message}`);
    },
  });
}

export function useUpdateVendor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, vendor }: { id: bigint; vendor: Vendor }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateVendor(id, vendor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update vendor: ${error.message}`);
    },
  });
}

export function useDeleteVendor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteVendor(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete vendor: ${error.message}`);
    },
  });
}

// Subrental Queries
export function useGetAllSubrentals() {
  const { actor, isFetching } = useActor();

  return useQuery<Subrental[]>({
    queryKey: ['subrentals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSubrentals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSubrentalsByQuoteId(quoteId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Subrental[]>({
    queryKey: ['subrentals', quoteId?.toString()],
    queryFn: async () => {
      if (!actor || quoteId === null) return [];
      return actor.getSubrentalsByQuoteId(quoteId);
    },
    enabled: !!actor && !isFetching && quoteId !== null,
  });
}

export function useAddSubrental() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subrental: Omit<Subrental, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addSubrental({ ...subrental, id: 0n } as Subrental);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subrentals'] });
      toast.success('Subrental added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add subrental: ${error.message}`);
    },
  });
}

export function useUpdateSubrental() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, subrental }: { id: bigint; subrental: Subrental }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSubrental(id, subrental);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subrentals'] });
      toast.success('Subrental updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update subrental: ${error.message}`);
    },
  });
}

export function useDeleteSubrental() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteSubrental(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subrentals'] });
      toast.success('Subrental deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete subrental: ${error.message}`);
    },
  });
}

// Cost Queries
export function useGetAllCosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Cost[]>({
    queryKey: ['costs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCostsByJobId(jobId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Cost[]>({
    queryKey: ['costs', jobId?.toString()],
    queryFn: async () => {
      if (!actor || jobId === null) return [];
      return actor.getCostsByJobId(jobId);
    },
    enabled: !!actor && !isFetching && jobId !== null,
  });
}

export function useAddCost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cost: Cost) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addCost(cost);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      toast.success('Cost added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add cost: ${error.message}`);
    },
  });
}

export function useUpdateCost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cost }: { id: bigint; cost: Cost }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCost(id, cost);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      toast.success('Cost updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update cost: ${error.message}`);
    },
  });
}

export function useDeleteCost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCost(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      toast.success('Cost deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete cost: ${error.message}`);
    },
  });
}

// Admin Check
export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}
