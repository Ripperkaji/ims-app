
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
import { Flag } from 'lucide-react';
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
    generalReasonComment: string
  ) => void;
}

interface ItemFlagState {
  tempUiId: string; 
  productId: string;
  productName: string;
  quantitySold: number;
  isMarkedForDamageExchange: boolean;
  damageComment: string;
}

export default function FlagSaleDialog({ sale, isOpen, onClose, onSaleFlagged }: FlagSaleDialogProps) {
  const { toast } = useToast();
  const [itemStates, setItemStates] = useState<ItemFlagState[]>([]);
  const [generalReasonCommentText, setGeneralReasonCommentText] = useState<string>('');

  useEffect(() => {
    if (isOpen && sale) {
      setItemStates(
        sale.items.map((originalSaleItem, originalIndex) => ({
          tempUiId: `${originalSaleItem.productId}-${originalIndex}`,
          productId: originalSaleItem.productId,
          productName: originalSaleItem.productName,
          quantitySold: originalSaleItem.quantity,
          isMarkedForDamageExchange: originalSaleItem.isFlaggedForDamageExchange || false,
          damageComment: originalSaleItem.damageExchangeComment || '',
        }))
      );
      setGeneralReasonCommentText('');
    } else if (!isOpen) {
      setItemStates([]);
      setGeneralReasonCommentText('');
    }
  }, [isOpen, sale]);

  const handleItemCheckboxChange = (tempUiIdToUpdate: string, checked: boolean) => {
    setItemStates(prevStates =>
      prevStates.map(item => {
        if (item.tempUiId === tempUiIdToUpdate) {
          const updatedItem = { ...item, isMarkedForDamageExchange: checked };
          if (!checked) {
            updatedItem.damageComment = '';
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleItemCommentChange = (tempUiIdToUpdate: string, value: string) => {
    setItemStates(prevStates =>
      prevStates.map(item => {
        if (item.tempUiId === tempUiIdToUpdate) {
          return { ...item, damageComment: value };
        }
        return item;
      })
    );
  };

  const handleConfirmFlag = () => {
    const itemsMarkedForDamage = itemStates.filter(item => item.isMarkedForDamageExchange);
    
    if (!generalReasonCommentText.trim()) {
      toast({
        title: "General Reason Required",
        description: "Please provide a general reason for flagging this sale.",
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
    
    const flaggedItemsData: FlaggedItemDetailForUpdate[] = itemsMarkedForDamage.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantitySold: item.quantitySold,
      isDamagedExchanged: item.isMarkedForDamageExchange,
      comment: item.damageComment,
    }));

    onSaleFlagged(sale.id, flaggedItemsData, generalReasonCommentText);
  };

  const handleDialogClose = () => {
    onClose();
  }

  if (!isOpen || !sale) return null;

  const itemsMarkedForDamageExchange = itemStates.filter(i => i.isMarkedForDamageExchange);
  const allDamageCommentsProvided = itemsMarkedForDamageExchange.every(item => item.damageComment.trim() !== '');
  const isGeneralCommentProvided = generalReasonCommentText.trim() !== '';
  
  const canConfirm = isGeneralCommentProvided && (itemsMarkedForDamageExchange.length === 0 || allDamageCommentsProvided);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" /> Flag Sale for Review
          </DialogTitle>
          <DialogDescription>
            Sale ID: <strong>{sale.id.substring(0,8)}...</strong> | Customer: <strong>{sale.customerName}</strong>.
            Mark items for damage exchange and provide a general reason for flagging.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-4 px-6 pb-4">
            <p className="text-sm font-medium mb-2">Item-Specific Damage/Exchange (Optional):</p>
            {itemStates.map((itemStateForRender) => (
              <div key={itemStateForRender.tempUiId} className="p-3 border rounded-md bg-muted/30 mb-3">
                <p className="font-semibold">{itemStateForRender.productName} <span className="text-sm text-muted-foreground">(Qty Sold: {itemStateForRender.quantitySold})</span></p>
                <div className="flex items-center space-x-2 mt-2 mb-1">
                  <Checkbox
                    id={`damageExchanged-${itemStateForRender.tempUiId}`}
                    checked={itemStateForRender.isMarkedForDamageExchange}
                    onCheckedChange={(checked) => handleItemCheckboxChange(itemStateForRender.tempUiId, Boolean(checked))}
                  />
                  <Label htmlFor={`damageExchanged-${itemStateForRender.tempUiId}`} className="text-sm font-normal">
                    Mark as Damaged & Exchanged
                  </Label>
                </div>
                {itemStateForRender.isMarkedForDamageExchange && (
                  <div className="mt-1">
                    <Label htmlFor={`damageComment-${itemStateForRender.tempUiId}`} className="text-xs">Damage Comment (Required if item marked)</Label>
                    <Textarea
                      id={`damageComment-${itemStateForRender.tempUiId}`}
                      value={itemStateForRender.damageComment}
                      onChange={(e) => handleItemCommentChange(itemStateForRender.tempUiId, e.target.value)}
                      placeholder={`Reason for damage/exchange of ${itemStateForRender.productName}...`}
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
              <Label htmlFor="generalReasonCommentText" className="text-sm font-medium mb-1 block">General Flag Reason (Required)</Label>
               <p className="text-xs text-muted-foreground mb-2">Explain why this sale is being flagged (e.g., data entry error, customer issue, incorrect item selection, etc.).</p>
              <Textarea
                  id="generalReasonCommentText"
                  value={generalReasonCommentText}
                  onChange={(e) => setGeneralReasonCommentText(e.target.value)}
                  placeholder="Specify the overall reason for flagging..."
                  rows={3}
                  className="text-sm"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmFlag}
            disabled={!canConfirm}
          >
            <Flag className="mr-2 h-4 w-4" /> Confirm Flag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
