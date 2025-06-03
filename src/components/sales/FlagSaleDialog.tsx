
"use client";

import { useState } from 'react';
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

interface FlagSaleDialogProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
  onSaleFlagged: (saleId: string, comment: string, isDamageExchanged: boolean) => void;
}

export default function FlagSaleDialog({ sale, isOpen, onClose, onSaleFlagged }: FlagSaleDialogProps) {
  const [comment, setComment] = useState<string>('');
  const [isDamageExchanged, setIsDamageExchanged] = useState<boolean>(false);
  const { toast } = useToast();

  const handleConfirmFlag = () => {
    if (!comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a reason for flagging this sale.",
        variant: "destructive",
      });
      return;
    }
    onSaleFlagged(sale.id, comment, isDamageExchanged);
    setComment(''); 
    setIsDamageExchanged(false);
    // Parent (DashboardPage) closes dialog by setting saleToFlag to null
  };
  
  const handleDialogClose = () => {
    setComment('');
    setIsDamageExchanged(false);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" /> Flag Sale for Review
          </DialogTitle>
          <DialogDescription>
            You are flagging sale <strong>{sale.id.substring(0,8)}...</strong> for customer <strong>{sale.customerName}</strong>.
            Please provide a brief comment explaining the issue.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="flagComment">Comment (Required)</Label>
            <Textarea
              id="flagComment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="E.g., Incorrect item price, customer dispute, etc."
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="damageExchanged"
              checked={isDamageExchanged}
              onCheckedChange={(checked) => setIsDamageExchanged(Boolean(checked))}
            />
            <Label htmlFor="damageExchanged" className="text-sm font-normal">
              Mark items as Damaged & Exchanged (updates inventory)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={handleConfirmFlag}>
            Confirm Flag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

