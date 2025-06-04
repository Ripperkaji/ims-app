
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
import type { Sale } from '@/types';
import { Flag, MessageSquareWarning } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface FlaggedItemDetailForUpdate { 
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
  onSaleFlagged: (
    saleId: string, 
    flaggedItemsDetail: FlaggedItemDetailForUpdate[],
    isOtherReasonFlagged: boolean,
    otherReasonCommentText: string
  ) => void;
}

interface ItemFlagState {
  productId: string;
  productName: string;
  quantitySold: number;
  isMarkedForDamageExchange: boolean; 
  damageComment: string; 
}

export default function FlagSaleDialog({ sale, isOpen, onClose, onSaleFlagged }: FlagSaleDialogProps) {
  const { toast } = useToast();
  const [itemStates, setItemStates] = useState<ItemFlagState[]>([]);
  const [flagForOtherReason, setFlagForOtherReason] = useState<boolean>(false);
  const [otherReasonCommentText, setOtherReasonCommentText] = useState<string>('');

  useEffect(() => {
    if (isOpen && sale) {
      setItemStates(
        sale.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantitySold: item.quantity,
          isMarkedForDamageExchange: item.isFlaggedForDamageExchange || false, 
          damageComment: item.damageExchangeComment || '', 
        }))
      );
      setFlagForOtherReason(false); 
      setOtherReasonCommentText('');
    } else if (!isOpen) {
      setItemStates([]); 
      setFlagForOtherReason(false);
      setOtherReasonCommentText('');
    }
  }, [isOpen, sale]);

  const handleItemCheckboxChange = (index: number, checked: boolean) => {
    const newStates = [...itemStates];
    newStates[index].isMarkedForDamageExchange = checked;
    if (!checked) { 
      newStates[index].damageComment = ''; 
    }
    setItemStates(newStates);
  };

  const handleItemCommentChange = (index: number, value: string) => {
    const newStates = [...itemStates];
    newStates[index].damageComment = value;
    setItemStates(newStates);
  };

  const handleConfirmFlag = () => {
    const itemsMarkedForDamage = itemStates.filter(item => item.isMarkedForDamageExchange);
    
    if (itemsMarkedForDamage.length === 0 && !flagForOtherReason) {
      toast({
        title: "No Action Selected",
        description: "Please mark at least one item for damage exchange OR check 'Flag for other reason'.",
        variant: "destructive",
      });
      return;
    }

    if (itemsMarkedForDamage.some(item => !item.damageComment.trim())) {
      toast({
        title: "Comment Required for Damaged Items",
        description: "Please provide a comment for each item marked for damage exchange.",
        variant: "destructive",
      });
      return;
    }

    if (flagForOtherReason && !otherReasonCommentText.trim()) {
       toast({
        title: "Comment Required for Other Reason",
        description: "Please provide a comment if flagging for 'other reason'.",
        variant: "destructive",
      });
      return;
    }
    
    const flaggedItemsData: FlaggedItemDetailForUpdate[] = itemsMarkedForDamage.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantitySold: item.quantitySold,
      isDamagedExchanged: item.isMarkedForDamageExchange, 
      comment: item.damageComment,
    }));

    onSaleFlagged(sale.id, flaggedItemsData, flagForOtherReason, otherReasonCommentText);
  };
  
  const handleDialogClose = () => {
    onClose();
  }

  if (!isOpen || !sale) return null;

  const canConfirm = itemStates.filter(i => i.isMarkedForDamageExchange && i.damageComment.trim()).length > 0 || 
                     (flagForOtherReason && otherReasonCommentText.trim());

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" /> Flag Sale for Review
          </DialogTitle>
          <DialogDescription>
            Sale ID: <strong>{sale.id.substring(0,8)}...</strong> | Customer: <strong>{sale.customerName}</strong>.
            Mark items for damage exchange and/or flag for other reasons.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow py-2 pr-3 -mr-2 space-y-4">
          <p className="text-sm font-medium mb-2">Item-Specific Damage/Exchange:</p>
          {itemStates.map((item, index) => (
            <div key={item.productId} className="p-3 border rounded-md bg-muted/30 mb-3">
              <p className="font-semibold">{item.productName} <span className="text-sm text-muted-foreground">(Qty Sold: {item.quantitySold})</span></p>
              <div className="flex items-center space-x-2 mt-2 mb-1">
                <Checkbox
                  id={`damageExchanged-${item.productId}`}
                  checked={item.isMarkedForDamageExchange}
                  onCheckedChange={(checked) => handleItemCheckboxChange(index, Boolean(checked))}
                />
                <Label htmlFor={`damageExchanged-${item.productId}`} className="text-sm font-normal">
                  Mark as Damaged &amp; Exchanged
                </Label>
              </div>
              {item.isMarkedForDamageExchange && (
                <div className="mt-1">
                  <Label htmlFor={`damageComment-${item.productId}`} className="text-xs">Damage Comment (Required)</Label>
                  <Textarea
                    id={`damageComment-${item.productId}`}
                    value={item.damageComment}
                    onChange={(e) => handleItemCommentChange(index, e.target.value)}
                    placeholder={`Reason for damage/exchange of ${item.productName}...`}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          ))}
          {itemStates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">This sale has no items to mark for damage.</p>
          )}

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">General Flag (Other Reasons):</p>
            <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                    id="flagForOtherReason"
                    checked={flagForOtherReason}
                    onCheckedChange={setFlagForOtherReason} // Simplified handler
                />
                <Label htmlFor="flagForOtherReason" className="text-sm font-normal">
                    Flag for other reason (e.g., data entry error, customer issue)
                </Label>
            </div>
            {flagForOtherReason && (
                <div>
                    <Label htmlFor="otherReasonCommentText" className="text-xs">Comment for Other Reason (Required)</Label>
                    <Textarea
                        id="otherReasonCommentText"
                        value={otherReasonCommentText}
                        onChange={(e) => setOtherReasonCommentText(e.target.value)}
                        placeholder="Specify the reason for flagging (e.g., wrong customer name, incorrect item added initially)..."
                        rows={3}
                        className="text-sm"
                    />
                </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
          </DialogClose>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleConfirmFlag}
            disabled={!canConfirm}
          >
            <Flag className="mr-2 h-4 w-4" /> Confirm Flag(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

