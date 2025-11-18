import { useState } from 'react';
import { useGetConfirmedQuotes, useGetAllClients, useGetAllCatalogItems, useGetAllVenues } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Scan, CheckCircle, Package, FileText, MapPin, Calendar } from 'lucide-react';
import type { Quote } from '../backend';

export default function Pull() {
  const { data: quotes = [], isLoading: quotesLoading } = useGetConfirmedQuotes();
  const { data: clients = [] } = useGetAllClients();
  const { data: catalogItems = [] } = useGetAllCatalogItems();
  const { data: venues = [] } = useGetAllVenues();
  const [searchTerm, setSearchTerm] = useState('');
  const [scanningQuote, setScanningQuote] = useState<bigint | null>(null);
  const [checkInQuote, setCheckInQuote] = useState<bigint | null>(null);
  const [scannedItems, setScannedItems] = useState<Record<string, number>>({});

  const filteredQuotes = quotes.filter((quote) => {
    const client = clients.find((c) => c.id === quote.clientId);
    const searchLower = searchTerm.toLowerCase();
    return (
      quote.referenceNumber.toLowerCase().includes(searchLower) ||
      client?.name.toLowerCase().includes(searchLower)
    );
  });

  const getVenueInfo = (venueId: bigint | undefined) => {
    if (!venueId) return null;
    return venues.find((v) => v.venue_id === venueId);
  };

  const formatDateRange = (startDate: string, endDate?: string) => {
    if (!endDate || startDate === endDate) {
      return new Date(startDate).toLocaleDateString();
    }
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  };

  const handleStartScan = (quoteId: bigint) => {
    setScanningQuote(quoteId);
    setScannedItems({});
  };

  const handleFinalizeScan = () => {
    console.log('Finalizing scan for quote:', scanningQuote);
    setScanningQuote(null);
    setScannedItems({});
  };

  const handleStartCheckIn = (quoteId: bigint) => {
    setCheckInQuote(quoteId);
    setScannedItems({});
  };

  const handleCompleteCheckIn = () => {
    console.log('Completing check-in for quote:', checkInQuote);
    console.log('Generating missing items PDF...');
    setCheckInQuote(null);
    setScannedItems({});
  };

  if (quotesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Pull</h1>
          <p className="text-muted-foreground mt-1">Check-out and check-in equipment for jobs</p>
        </div>
        <img src="/assets/generated/pull-icon-transparent.dim_64x64.png" alt="Pull" className="h-16 w-16 opacity-80" />
      </div>

      {scanningQuote && (
        <Card className="border-primary border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-primary animate-pulse" />
              Scanning Mode Active
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <img src="/assets/generated/barcode-scanner-icon-transparent.dim_64x64.png" alt="Scanner" className="h-16 w-16" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Scan asset tags to check out items</p>
                <Input placeholder="Scan or enter asset tag..." className="font-mono" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFinalizeScan} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalize Check-Out
              </Button>
              <Button variant="outline" onClick={() => setScanningQuote(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {checkInQuote && (
        <Card className="border-green-600 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 animate-pulse" />
              Check-In Mode Active
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <img src="/assets/generated/barcode-scanner-icon-transparent.dim_64x64.png" alt="Scanner" className="h-16 w-16" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Scan asset tags to check in items</p>
                <Input placeholder="Scan or enter asset tag..." className="font-mono" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCompleteCheckIn} className="flex-1 bg-green-600 hover:bg-green-700">
                <FileText className="h-4 w-4 mr-2" />
                Complete & Generate Missing Items PDF
              </Button>
              <Button variant="outline" onClick={() => setCheckInQuote(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by job number or client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No confirmed jobs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuotes.map((quote) => {
                const client = clients.find((c) => c.id === quote.clientId);
                const venue = getVenueInfo(quote.venue_id);
                const totalItems = quote.sections.reduce((sum, section) => sum + section.items.length, 0);

                return (
                  <Card key={quote.id.toString()} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Job #{quote.referenceNumber}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Client: {client?.name || 'Unknown'}
                          </p>
                          {venue && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              Delivery Location: {venue.venue_name}, {venue.city}, {venue.state}
                            </p>
                          )}
                          {quote.event_start_date && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              Event Dates: {formatDateRange(quote.event_start_date, quote.event_end_date)}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">{totalItems} items</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {quote.sections.map((section, sectionIdx) => (
                          <div key={sectionIdx} className="border rounded-lg p-3">
                            <h4 className="font-semibold text-sm mb-2">{section.name}</h4>
                            <div className="space-y-1">
                              {section.items.map((item, itemIdx) => {
                                const catalogItem = item.equipmentId ? catalogItems.find((c) => c.item_id === item.equipmentId) : null;
                                const itemName = item.isCustom ? (item.customName || 'Custom Item') : (catalogItem?.name || 'Unknown Item');

                                return (
                                  <div key={itemIdx} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                                    <span>{itemName}</span>
                                    <span className="text-muted-foreground">Qty: {item.quantity.toString()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-2">
                          <Button onClick={() => handleStartScan(quote.id)} className="flex-1" disabled={!!scanningQuote || !!checkInQuote}>
                            <Scan className="h-4 w-4 mr-2" />
                            Scan (Check-Out)
                          </Button>
                          <Button onClick={() => handleStartCheckIn(quote.id)} variant="outline" className="flex-1" disabled={!!scanningQuote || !!checkInQuote}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Check In
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
