"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Dictionary } from "@/actions/dictionaries";

export default function LoginDialog({
  dictionary,
}: {
  dictionary: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if we've shown this dialog before
    const hasSeenDialog = localStorage.getItem("aguila-seen-promo-dialog");

    if (!hasSeenDialog) {
      setOpen(true);
      // Mark that user has seen the dialog
      localStorage.setItem("aguila-seen-promo-dialog", "true");
    }
  }, []);

  const handleSignIn = () => {
    router.push("/auth/signin");
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dictionary.menu.promoDialog.title}</DialogTitle>
          <DialogDescription>
            {dictionary.menu.promoDialog.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex sm:justify-between">
          <Button variant="outline" onClick={handleClose}>
            {dictionary.menu.promoDialog.dismiss}
          </Button>
          <Button onClick={handleSignIn}>
            {dictionary.menu.promoDialog.register}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}