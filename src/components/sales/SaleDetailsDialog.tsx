
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Sale } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Eye, Calendar, User, Phone, ShoppingCart, DollarSign, Tag, Store, Globe, Flag, ShieldCheck } from 'lucide-react';

interface SaleDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export default function SaleDetailsDialog({ isOpen, onClose, sale }: SaleDetailsDialogProps) {
  if (!isOpen || !sale) {
    return null;
  }

  const getPaymentSummary = (sale: Sale): string => {
    if (sale.formPaymentMethod === 'Hybrid') {
        const parts = [];
        if (sale.cashPaid > 0) parts.push(`Cash: ${formatCurrency(sale.cashPaid)}`);
        if (sale.digitalPaid > 0) parts.push(`Digital: ${formatCurrency(sale.digitalPaid)}`);
        if (sale.amountDue > 0) parts.push(`Due: ${formatCurrency(sale.amountDue)}`);
        return parts.length > 0 ? `Hybrid (${parts.join(', ')})` : 'Hybrid (N/A)';
    }
    return sale.formPaymentMethod;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" /> Sale Details
          </DialogTitle>
          <DialogDescription>
            Detailed view of transaction ID: {sale.id}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow pr-6">
          <div className="space-y-4">
            {/* Customer & Sale Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> Customer</p>
                <p className="font-semibold">{sale.customerName}</p>
              </div>
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> Contact</p>
                <p className="font-semibold">{sale.customerContact || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Sale Date</p>
                <p className="font-semibold">{format(parseISO(sale.date), 'MMM dd, yyyy HH:mm')}</p>
              </div>
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> Recorded By</p>
                <p className="font-semibold">{sale.createdBy}</p>
              </div>
               <div className="space-y-1">
                <p className="flex items-center gap-2 text-muted-foreground">
                    {sale.saleOrigin === 'store' ? <Store className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    Sale Origin
                </p>
                <p className="font-semibold capitalize">{sale.saleOrigin}</p>
              </div>
            </div>

            <Separator />

            {/* Items Table */}
            <div>
              <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /> Items Sold</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item, index) => (
                    <TableRow key={`${item.productId}-${index}`}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">NRP {formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-semibold">NRP {formatCurrency(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <Separator />
            
            {/* Payment Details */}
            <div>
              <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Payment Summary</h3>
              <div className="space-y-2 text-sm p-3 bg-muted/50 rounded-md">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount</span>
                  <span>NRP {formatCurrency(sale.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <Badge variant="secondary">{getPaymentSummary(sale)}</Badge>
                </div>
                 <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={sale.status === 'Paid' ? 'default' : 'destructive'} className={cn(sale.status === 'Paid' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600', "text-xs")}>
                    {sale.status}
                  </Badge>
                </div>
                {sale.amountDue > 0 && (
                   <div className="flex justify-between text-destructive font-semibold">
                    <span>Amount Due</span>
                    <span>NRP {formatCurrency(sale.amountDue)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Flagging Info */}
            {(sale.isFlagged || sale.flaggedComment) && (
              <>
              <Separator />
              <div>
                <h3 className="text-md font-semibold mb-2 flex items-center gap-2">
                    {sale.isFlagged 
                        ? <Flag className="h-4 w-4 text-destructive" />
                        : <ShieldCheck className="h-4 w-4 text-green-600" />
                    }
                    Flagging Information
                </h3>
                <div className="p-3 border rounded-md text-sm whitespace-pre-wrap bg-muted/50">
                    <p className="font-semibold">Status: <span className={sale.isFlagged ? "text-destructive" : "text-green-600"}>{sale.isFlagged ? "Flagged for Review" : "Flag Resolved"}</span></p>
                    <p className="text-muted-foreground mt-1">{sale.flaggedComment || "No comments provided."}</p>
                </div>
              </div>
              </>
            )}

          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
