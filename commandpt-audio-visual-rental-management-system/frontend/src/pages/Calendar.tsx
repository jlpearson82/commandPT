import { useState } from 'react';
import { useGetAllQuotes, useGetAllCatalogItems, useGetAllClients, useGetAllVenues } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { QuoteStatus } from '../backend';

export default function Calendar() {
  const { data: quotes = [], isLoading } = useGetAllQuotes();
  const { data: catalogItems = [] } = useGetAllCatalogItems();
  const { data: clients = [] } = useGetAllClients();
  const { data: venues = [] } = useGetAllVenues();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedQuoteId, setSelectedQuoteId] = useState<bigint | null>(null);

  const confirmedQuotes = quotes.filter(q => q.status === QuoteStatus.approved);

  const getClientName = (clientId: bigint) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getVenueName = (venueId: bigint | undefined) => {
    if (!venueId) return null;
    const venue = venues.find((v) => v.venue_id === venueId);
    return venue ? venue.venue_name : null;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getQuotesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return confirmedQuotes.filter((quote) => {
      if (!quote.event_start_date) return false;
      const start = quote.event_start_date;
      const end = quote.event_end_date || quote.event_start_date;
      return dateStr >= start && dateStr <= end;
    });
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const formatDateRange = (startDate: string, endDate?: string) => {
    if (!endDate || startDate === endDate) {
      return new Date(startDate).toLocaleDateString();
    }
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Calendar</h1>
          <p className="text-muted-foreground mt-1">View scheduled events and bookings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {monthNames[month]} {year}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const date = new Date(year, month, day);
              const dayQuotes = getQuotesForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={day}
                  className={`aspect-square border rounded-lg p-2 ${
                    isToday ? 'border-primary bg-primary/5' : 'border-border'
                  } hover:bg-muted/50 transition-colors`}
                >
                  <div className="text-sm font-medium mb-1">{day}</div>
                  <div className="space-y-1">
                    {dayQuotes.slice(0, 2).map((quote) => {
                      const venueName = getVenueName(quote.venue_id);
                      return (
                        <div
                          key={Number(quote.id)}
                          className="text-xs bg-primary/10 text-primary px-1 py-0.5 rounded truncate cursor-pointer hover:bg-primary/20"
                          title={`${quote.referenceNumber} - ${getClientName(quote.clientId)}${venueName ? ` @ ${venueName}` : ''}`}
                          onClick={() => setSelectedQuoteId(quote.id)}
                        >
                          {quote.referenceNumber}
                        </div>
                      );
                    })}
                    {dayQuotes.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayQuotes.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          {confirmedQuotes.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No confirmed events scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {confirmedQuotes.slice(0, 5).map((quote) => {
                const venueName = getVenueName(quote.venue_id);
                return (
                  <div 
                    key={Number(quote.id)} 
                    className="flex items-center justify-between border-b pb-3 last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                    onClick={() => setSelectedQuoteId(quote.id)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{quote.referenceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {getClientName(quote.clientId)}
                      </p>
                      {venueName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {venueName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateRange(quote.event_start_date, quote.event_end_date)}
                      </p>
                    </div>
                    <Badge variant="secondary">{quote.status}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
