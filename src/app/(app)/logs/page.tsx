
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { mockLogEntries } from "@/lib/data";
import type { LogEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, Filter, CalendarIcon, ListFilter, X } from "lucide-react";
import { format, startOfDay, endOfDay, isValid } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const ALL_ACTIONS_VALUE = "__ALL_ACTIONS__";

export default function LogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [allLogs] = useState<LogEntry[]>(mockLogEntries.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  const [filteredLogEntries, setFilteredLogEntries] = useState<LogEntry[]>(allLogs);
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [selectedAction, setSelectedAction] = useState<string>(ALL_ACTIONS_VALUE);
  const [isFilterActive, setIsFilterActive] = useState<boolean>(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState<boolean>(false);

  const availableActions = useMemo(() => {
    const actions = new Set(allLogs.map(log => log.action));
    return Array.from(actions);
  }, [allLogs]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const applyFilters = () => {
    let tempFilteredLogs = [...allLogs];

    if (dateRange.from && dateRange.to) {
      const from = startOfDay(dateRange.from);
      const to = endOfDay(dateRange.to);
      if (isValid(from) && isValid(to)) {
        tempFilteredLogs = tempFilteredLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          return isValid(logDate) && logDate >= from && logDate <= to;
        });
      }
    } else if (dateRange.from) {
      const from = startOfDay(dateRange.from);
       if (isValid(from)) {
        tempFilteredLogs = tempFilteredLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          return isValid(logDate) && logDate >= from;
        });
      }
    } else if (dateRange.to) {
      const to = endOfDay(dateRange.to);
      if (isValid(to)) {
        tempFilteredLogs = tempFilteredLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          return isValid(logDate) && logDate <= to;
        });
      }
    }
    
    if (selectedAction && selectedAction !== ALL_ACTIONS_VALUE) {
      tempFilteredLogs = tempFilteredLogs.filter(log => log.action === selectedAction);
    }

    setFilteredLogEntries(tempFilteredLogs);
    const activeFilters = !!dateRange.from || !!dateRange.to || (!!selectedAction && selectedAction !== ALL_ACTIONS_VALUE);
    setIsFilterActive(activeFilters);
    setIsFilterPopoverOpen(false);

    if (activeFilters) {
        toast({ title: "Filters Applied", description: "Log entries have been filtered." });
    } else {
        toast({ title: "Filters Cleared/No Filters", description: "Showing all log entries." });
    }
  };

  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setSelectedAction(ALL_ACTIONS_VALUE);
    setFilteredLogEntries(allLogs);
    setIsFilterActive(false);
    setIsFilterPopoverOpen(false);
    toast({ title: "Filters Cleared", description: "Showing all log entries." });
  };
  
  const handleExportLogs = (type: 'all' | 'filtered') => {
    const dataToExport = type === 'filtered' && isFilterActive ? filteredLogEntries : allLogs;
    toast({ 
      title: "Feature Coming Soon", 
      description: `Exporting ${type === 'filtered' && isFilterActive ? 'filtered' : 'all'} ${dataToExport.length} logs to spreadsheet is not yet implemented.` 
    });
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">Activity Logs</h1>
        <div className="flex items-center gap-2">
          <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn(isFilterActive && "border-primary text-primary")}>
                <ListFilter className="mr-2 h-4 w-4" /> {isFilterActive ? "Filters Applied" : "Filter Logs"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 z-50" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Filter Logs</h4>
                  <p className="text-sm text-muted-foreground">
                    Refine logs by date and action.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? format(dateRange.from, "PPP") : <span>From date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                     <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.to ? format(dateRange.to, "PPP") : <span>To date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                          disabled={(date) => dateRange.from ? date < dateRange.from : false }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="actionCategory">Action Category</Label>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger id="actionCategory">
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_ACTIONS_VALUE}>All Actions</SelectItem>
                      {availableActions.map(action => (
                        <SelectItem key={action} value={action}>{action}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={clearFilters}><X className="mr-2 h-4 w-4"/>Clear</Button>
                    <Button onClick={applyFilters}><Filter className="mr-2 h-4 w-4"/>Apply</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportLogs('all')}>
                Export All Logs
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleExportLogs('filtered')}
                disabled={!isFilterActive}
              >
                Export Filtered Logs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>System & User Activity</CardTitle>
          <CardDescription>Chronological record of actions and modifications within the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogEntries.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}</TableCell>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="truncate max-w-md">{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {filteredLogEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {isFilterActive ? "No logs found matching your filters." : "No activity logs found."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Label component if not already globally available or for local styling
const Label = ({ htmlFor, children, className }: { htmlFor?: string; children: React.ReactNode, className?: string }) => (
  <label htmlFor={htmlFor} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}>
    {children}
  </label>
);

