
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { Sale, SaleItem } from '@/types';
import { Flag, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FlaggedItemDetail {
  productId: string;
  productName: string;
  quantitySold: number;
  isDamagedExchanged: boolean;
  comment: string;
}

interface FlagSaleDialogProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
  onSaleFlagged: (saleId: string, flaggedItemsDetail: FlaggedItemDetail[]) => void;
}

interface ItemFlagState {
  productId: string;
  productName: string;
  quantitySold: number;
  isMarked: boolean;
  comment: string;
}

export default function FlagSaleDialog({ sale, isOpen, onClose, onSaleFlagged }: FlagSaleDialogProps) {
  const { toast } = useToast();
  const [itemStates, setItemStates] = useState<ItemFlagState[]>([]);

  useEffect(() => {
    if (isOpen && sale) {
      setItemStates(
        sale.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantitySold: item.quantity,
          isMarked: item.isFlaggedForDamageExchange || false,
          comment: item.damageExchangeComment || '',
        }))
      );
    } else if (!isOpen) {
      setItemStates([]); // Reset when closed
    }
  }, [isOpen, sale]);

  const handleItemCheckboxChange = (index: number, checked: boolean) => {
    const newStates = [...itemStates];
    newStates[index].isMarked = checked;
    if (!checked) { // Clear comment if unmarked
      newStates[index].comment = '';
    }
    setItemStates(newStates);
  };

  const handleItemCommentChange = (index: number, value: string) => {
    const newStates = [...itemStates];
    newStates[index].comment = value;
    setItemStates(newStates);
  };

  const handleConfirmFlag = () => {
    const itemsToFlag = itemStates.filter(item => item.isMarked);
    if (itemsToFlag.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please mark at least one item for damage exchange or provide a reason.",
        variant: "destructive",
      });
      return;
    }

    if (itemsToFlag.some(item => !item.comment.trim())) {
      toast({
        title: "Comment Required",
        description: "Please provide a comment for each item marked for damage exchange.",
        variant: "destructive",
      });
      return;
    }
    
    const flaggedItemsData: FlaggedItemDetail[] = itemsToFlag.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantitySold: item.quantitySold,
      isDamagedExchanged: item.isMarked,
      comment: item.comment,
    }));

    onSaleFlagged(sale.id, flaggedItemsData);
    // Parent (DashboardPage) closes dialog by setting saleToFlag to null which also resets local state via useEffect
  };
  
  const handleDialogClose = () => {
    onClose();
  }

  if (!isOpen || !sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" /> Flag Items in Sale for Review
          </DialogTitle>
          <DialogDescription>
            Sale ID: <strong>{sale.id.substring(0,8)}...</strong> | Customer: <strong>{sale.customerName}</strong>.
            Mark individual items for damage exchange and provide comments.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow py-2 pr-3 -mr-2">
          <div className="space-y-4">
            {itemStates.map((item, index) => (
              <div key={item.productId} className="p-3 border rounded-md bg-muted/50">
                <p className="font-semibold">{item.productName} <span className="text-sm text-muted-foreground">(Qty: {item.quantitySold})</span></p>
                <div className="flex items-center space-x-2 mt-2 mb-1">
                  <Checkbox
                    id={`damageExchanged-${item.productId}`}
                    checked={item.isMarked}
                    onCheckedChange={(checked) => handleItemCheckboxChange(index, Boolean(checked))}
                  />
                  <Label htmlFor={`damageExchanged-${item.productId}`} className="text-sm font-normal">
                    Mark this item as Damaged &amp; Exchanged
                  </Label>
                </div>
                {item.isMarked && (
                  <div className="mt-1">
                    <Label htmlFor={`comment-${item.productId}`} className="text-xs">Comment (Required)</Label>
                    <Textarea
                      id={`comment-${item.productId}`}
                      value={item.comment}
                      onChange={(e) => handleItemCommentChange(index, e.target.value)}
                      placeholder={`Reason for flagging ${item.productName}...`}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {itemStates.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">This sale has no items to flag.</p>
        )}

        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
          </DialogClose>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleConfirmFlag}
            disabled={itemStates.filter(i => i.isMarked).length === 0 || itemStates.some(i => i.isMarked && !i.comment.trim())}
          >
            Confirm Flag Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
