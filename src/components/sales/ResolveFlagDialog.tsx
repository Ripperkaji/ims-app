
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { ShieldCheck } from 'lucide-react'; // Using a more positive icon for resolution
import { useToast } from '@/hooks/use-toast';

interface ResolveFlagDialogProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
  onFlagResolved: (saleId: string, resolutionComment: string) => void;
}

export default function ResolveFlagDialog({ sale, isOpen, onClose, onFlagResolved }: ResolveFlagDialogProps) {
  const [resolutionComment, setResolutionComment] = useState<string>('');
  const { toast } = useToast();

  const handleConfirmResolution = () => {
    if (!resolutionComment.trim()) {
      toast({
        title: "Resolution Comment Required",
        description: "Please provide a comment explaining how the flag was resolved.",
        variant: "destructive",
      });
      return;
    }
    onFlagResolved(sale.id, resolutionComment);
    setResolutionComment(''); 
    onClose(); // Parent will manage closing by changing isOpen prop via its state
  };

  const handleDialogClose = () => {
    setResolutionComment('');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" /> Resolve Flag for Sale
          </DialogTitle>
          <DialogDescription>
            Reviewing flagged sale <strong>{sale.id.substring(0,8)}...</strong> for customer <strong>{sale.customerName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="originalFlagComment">Original Flag Comment:</Label>
            <p id="originalFlagComment" className="text-sm p-2 bg-muted rounded-md border min-h-[60px]">
              {sale.flaggedComment || "No original comment provided."}
            </p>
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="resolutionComment">Resolution Comment (Required)</Label>
            <Textarea
              id="resolutionComment"
              value={resolutionComment}
              onChange={(e) => setResolutionComment(e.target.value)}
              placeholder="Explain the resolution or action taken..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleDialogClose}>Cancel</Button>
          <Button 
            type="button" 
            onClick={handleConfirmResolution} 
            disabled={!resolutionComment.trim()}
            className={!resolutionComment.trim() ? "bg-primary/50" : "bg-primary hover:bg-primary/90"}
          >
            Confirm Resolution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

