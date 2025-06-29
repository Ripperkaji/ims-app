
"use client";

import { useAuthStore } from "@/stores/authStore";
import { mockLogEntries } from "@/lib/data";
import type { LogEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Filter, CalendarIcon, ListFilter, X, Info } from "lucide-react";
import { format, startOfDay, endOfDay, isValid, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const ALL_ACTIONS_VALUE = "__ALL_ACTIONS__";

export default function LogsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const [allLogs] = useState<LogEntry[]>(() => [...mockLogEntries].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  const [filteredLogEntries, setFilteredLogEntries] = useState<LogEntry[]>(allLogs);

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [selectedAction, setSelectedAction] = useState<string>(ALL_ACTIONS_VALUE);
  const [filterUser, setFilterUser] = useState<string>('');
  const [isFilterActive, setIsFilterActive] = useState<boolean>(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState<boolean>(false);

  const [selectedLogForDetails, setSelectedLogForDetails] = useState<LogEntry | null>(null);
  const [isLogDetailsDialogOpen, setIsLogDetailsDialogOpen] = useState<boolean>(false);

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
    
    if (filterUser.trim()) {
        tempFilteredLogs = tempFilteredLogs.filter(log =>
            log.user.toLowerCase().includes(filterUser.toLowerCase().trim())
        );
    }

    setFilteredLogEntries(tempFilteredLogs);
    const activeFilters = !!dateRange.from || !!dateRange.to || (!!selectedAction && selectedAction !== ALL_ACTIONS_VALUE) || !!filterUser.trim();
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
    setFilterUser('');
    setFilteredLogEntries(allLogs);
    setIsFilterActive(false);
    setIsFilterPopoverOpen(false);
    toast({ title: "Filters Cleared", description: "Showing all log entries." });
  };

  const escapeCsvCell = (cellData: string): string => {
    if (cellData === null || cellData === undefined) {
      return '';
    }
    const stringData = String(cellData);
    if (stringData.includes(',') || stringData.includes('\n') || stringData.includes('"')) {
      return `"${stringData.replace(/"/g, '""')}"`;
    }
    return stringData;
  };

  const handleExportLogs = (type: 'all' | 'filtered') => {
    const dataToExport = type === 'filtered' && isFilterActive ? filteredLogEntries : allLogs;

    if (dataToExport.length === 0) {
      toast({
        title: "No Logs to Export",
        description: type === 'filtered' && isFilterActive ? "No logs match the current filters." : "There are no logs to export.",
        variant: "default",
      });
      return;
    }

    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Details'];
    const csvRows = [
      headers.join(','), 
      ...dataToExport.map(log => [
        escapeCsvCell(log.id),
        escapeCsvCell(format(parseISO(log.timestamp), 'yyyy-MM-dd HH:mm:ss')),
        escapeCsvCell(log.user),
        escapeCsvCell(log.action),
        escapeCsvCell(log.details),
      ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // Added BOM for Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    link.setAttribute('download', `vapetrack_logs_${type}_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Logs Exported",
      description: `${dataToExport.length} log entries have been exported to CSV.`,
    });
  };

  const handleOpenLogDetails = (log: LogEntry) => {
    setSelectedLogForDetails(log);
    setIsLogDetailsDialogOpen(true);
  };

  const handleCloseLogDetails = () => {
    setSelectedLogForDetails(null);
    setIsLogDetailsDialogOpen(false);
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
                    Refine logs by date, action, and user.
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
                 <div className="grid gap-2">
                    <Label htmlFor="filterUser">User</Label>
                    <Input
                        id="filterUser"
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        placeholder="Search by user name..."
                        className="h-9 text-sm"
                    />
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
                disabled={!isFilterActive && filteredLogEntries.length === allLogs.length}
              >
                Export Filtered Logs ({isFilterActive ? filteredLogEntries.length : allLogs.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>System & User Activity</CardTitle>
          <CardDescription>Chronological record of actions and modifications within the system. Click a row for details.</CardDescription>
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
                <TableRow
                  key={log.id}
                  onClick={() => handleOpenLogDetails(log)}
                  className="cursor-pointer hover:bg-muted/50"
                >
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

      {selectedLogForDetails && (
        <Dialog open={isLogDetailsDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) handleCloseLogDetails(); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" /> Log Entry Details
              </DialogTitle>
              <DialogDescription>
                Complete information for log ID: {selectedLogForDetails.id}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4 text-sm">
              <div>
                <span className="font-semibold">Timestamp:</span> {format(parseISO(selectedLogForDetails.timestamp), 'MMM dd, yyyy HH:mm:ss.SSS')}
              </div>
              <div>
                <span className="font-semibold">User:</span> {selectedLogForDetails.user}
              </div>
              <div>
                <span className="font-semibold">Action:</span> {selectedLogForDetails.action}
              </div>
              <div>
                <span className="font-semibold">Full Details:</span>
                <ScrollArea className="h-40 mt-1 rounded-md border p-2 bg-muted/30 whitespace-pre-wrap">
                  {selectedLogForDetails.details}
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" onClick={handleCloseLogDetails}>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

const Label = ({ htmlFor, children, className }: { htmlFor?: string; children: React.ReactNode, className?: string }) => (
  <label htmlFor={htmlFor} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}>
    {children}
  </label>
);
