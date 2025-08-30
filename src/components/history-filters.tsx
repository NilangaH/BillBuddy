
'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Utility, Payment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { useMemo } from 'react';

interface HistoryFiltersProps {
  filterType: Utility | 'all';
  setFilterType: (type: Utility | 'all') => void;
  filterDate: Date | undefined;
  setFilterDate: (date: Date | undefined) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  allPayments: Payment[];
}

export function HistoryFilters({
  filterType,
  setFilterType,
  filterDate,
  setFilterDate,
  selectedMonth,
  setSelectedMonth,
  allPayments
}: HistoryFiltersProps) {

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allPayments.forEach(p => {
      months.add(format(parseISO(p.date), 'yyyy-MM'));
    });
    return Array.from(months).sort().reverse();
  }, [allPayments]);

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    if (value !== 'all') {
      setFilterDate(undefined); // Reset date filter when month is selected
    }
  };
  
  const handleDateChange = (date: Date | undefined) => {
    setFilterDate(date);
    if (date) {
      setSelectedMonth('all'); // Reset month filter when date is selected
    }
  }

  const resetFilters = () => {
    setFilterType('all');
    setFilterDate(undefined);
    setSelectedMonth('all');
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select value={filterType} onValueChange={(value: Utility | 'all') => setFilterType(value)}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Utilities</SelectItem>
          <SelectItem value="LECO">LECO</SelectItem>
          <SelectItem value="CEB">CEB</SelectItem>
          <SelectItem value="Water">Water</SelectItem>
        </SelectContent>
      </Select>

       <Select value={selectedMonth} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {availableMonths.map(month => (
            <SelectItem key={month} value={month}>
              {format(new Date(month), 'MMMM yyyy')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-full sm:w-[240px] justify-start text-left font-normal',
              !filterDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filterDate ? format(filterDate, 'PPP') : <span>Filter by date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filterDate}
            onSelect={handleDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
       {(filterType !== 'all' || filterDate || selectedMonth !== 'all') && (
        <Button 
          variant="ghost" 
          onClick={resetFilters}
          className="w-full sm:w-auto"
        >
          <X className="mr-2 h-4 w-4" />
          Reset
        </Button>
      )}
    </div>
  );
}
