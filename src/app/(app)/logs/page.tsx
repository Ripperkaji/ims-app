"use client";

import { useAuth } from "@/contexts/AuthContext";
import { mockLogEntries } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useEffect } from 'react';
import { useRouter } from "next/navigation";

export default function LogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive"});
      router.push('/dashboard');
    }
  }, [user, router, toast]);

  const handleExportLogs = () => {
    toast({ title: "Feature Coming Soon", description: "Exporting logs to spreadsheet is not yet implemented." });
    // Placeholder for export functionality
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">Activity Logs</h1>
        <div className="space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filter Logs
          </Button>
          <Button onClick={handleExportLogs}>
            <Download className="mr-2 h-4 w-4" /> Export to Spreadsheet
          </Button>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>System & User Activity</CardTitle>
          <CardDescription>Chronological record of actions and modifications within the system. (Error tracking for sale entries modification is part of this)</CardDescription>
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
              {mockLogEntries.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}</TableCell>
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="truncate max-w-md">{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {mockLogEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No activity logs found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
