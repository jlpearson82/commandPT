import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetAllCatalogItems, useGetAllAssetUnits, useGetAllQuotes, useGetAllBookings } from '../hooks/useQueries';
import { Package, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EquipmentStatus, EquipmentLocation, QuoteStatus } from '../backend';

export default function Dashboard() {
  const { data: catalogItems = [], isLoading: catalogLoading } = useGetAllCatalogItems();
  const { data: assetUnits = [], isLoading: assetsLoading } = useGetAllAssetUnits();
  const { data: quotes = [], isLoading: quotesLoading } = useGetAllQuotes();
  const { data: bookings = [], isLoading: bookingsLoading } = useGetAllBookings();

  const availableCount = assetUnits.filter((unit) => unit.status === EquipmentStatus.available).length;
  const rentedCount = assetUnits.filter((unit) => unit.status === EquipmentStatus.rented).length;
  const maintenanceCount = assetUnits.filter((unit) => unit.status === EquipmentStatus.maintenance).length;

  const draftQuotes = quotes.filter((q) => q.status === QuoteStatus.draft).length;
  const approvedQuotes = quotes.filter((q) => q.status === QuoteStatus.approved).length;

  const upcomingBookings = bookings.filter((b) => {
    const startDate = new Date(b.startDate);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return startDate >= today && startDate <= weekFromNow;
  });

  const recentQuotes = [...quotes].sort((a, b) => Number(b.id - a.id)).slice(0, 5);

  const getLocationCounts = () => {
    const counts: Record<string, { available: number; rented: number; maintenance: number }> = {
      [EquipmentLocation.dallas]: { available: 0, rented: 0, maintenance: 0 },
      [EquipmentLocation.miami]: { available: 0, rented: 0, maintenance: 0 },
      [EquipmentLocation.phoenix]: { available: 0, rented: 0, maintenance: 0 },
      [EquipmentLocation.minneapolis]: { available: 0, rented: 0, maintenance: 0 },
    };

    assetUnits.forEach((unit) => {
      if (unit.status === EquipmentStatus.available) {
        counts[unit.office_location].available++;
      } else if (unit.status === EquipmentStatus.rented) {
        counts[unit.office_location].rented++;
      } else if (unit.status === EquipmentStatus.maintenance) {
        counts[unit.office_location].maintenance++;
      }
    });

    return counts;
  };

  const locationCounts = getLocationCounts();

  const getStatusBadge = (status: QuoteStatus) => {
    const variants: Record<QuoteStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      [QuoteStatus.draft]: 'secondary',
      [QuoteStatus.sent]: 'default',
      [QuoteStatus.approved]: 'default',
      [QuoteStatus.rejected]: 'destructive',
    };
    return <Badge variant={variants[status]} className="capitalize">{status}</Badge>;
  };

  const getLocationLabel = (location: EquipmentLocation) => {
    const locationMap: Record<EquipmentLocation, string> = {
      [EquipmentLocation.dallas]: 'Dallas',
      [EquipmentLocation.miami]: 'Miami',
      [EquipmentLocation.phoenix]: 'Phoenix',
      [EquipmentLocation.minneapolis]: 'Minneapolis',
    };
    return locationMap[location];
  };

  if (catalogLoading || assetsLoading || quotesLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">CommandPT Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your AV rental operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catalog Items</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
              <Package className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{catalogItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {assetUnits.length} total units
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Quotes</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{quotes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {draftQuotes} drafts, {approvedQuotes} approved
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{upcomingBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Next 7 days</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 hover:border-destructive/50 transition-all hover:shadow-lg hover:shadow-primary/10 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center ring-1 ring-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{maintenanceCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Units need attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/30 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-primary">Recent Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuotes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No quotes yet</p>
            ) : (
              <div className="space-y-4">
                {recentQuotes.map((quote) => (
                  <div key={Number(quote.id)} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm text-foreground">{quote.referenceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        ${(Number(quote.totalCents) / 100).toFixed(2)}
                      </p>
                    </div>
                    {getStatusBadge(quote.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-primary">Asset Status by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(locationCounts).map(([location, counts]) => (
                <div key={location} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{getLocationLabel(location as EquipmentLocation)}</span>
                    <span className="text-xs text-muted-foreground">
                      {counts.available + counts.rented + counts.maintenance} units
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-600">{counts.available} avail</span>
                    <span className="text-blue-600">{counts.rented} rented</span>
                    <span className="text-orange-600">{counts.maintenance} maint</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
