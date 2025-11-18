import { useState } from 'react';
import { useGetAllClients, useDeleteClient, useGetAllQuotes } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash2, Users, Mail, Phone, Building } from 'lucide-react';
import { type Client } from '../backend';
import ClientDialog from '../components/ClientDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function Clients() {
  const { data: clients = [], isLoading } = useGetAllClients();
  const { data: quotes = [] } = useGetAllQuotes();
  const deleteClient = useDeleteClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.company.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleDelete = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (clientToDelete) {
      await deleteClient.mutateAsync(clientToDelete.id);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const getClientQuoteCount = (clientId: bigint) => {
    return quotes.filter((q) => q.clientId === clientId).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">{clients.length} total clients</p>
        </div>
        <Button onClick={() => { setEditingClient(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clients found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {searchTerm
                ? 'Try adjusting your search'
                : 'Add your first client to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={Number(client.id)} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {client.company}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      {getClientQuoteCount(client.id)} quote(s)
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(client)} className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(client)} className="flex-1">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingClient={editingClient}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{clientToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
