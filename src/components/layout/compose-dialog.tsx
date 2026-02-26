"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PostComposer } from "@/components/post/post-composer";

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComposeDialog({ open, onOpenChange }: ComposeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="sr-only">Crear una publicación</DialogTitle>
        </DialogHeader>
        <PostComposer onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
