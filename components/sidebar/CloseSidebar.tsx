"use client";

import { useToggleSidebar } from "@/context/ToggleSidebar";
import { Button } from "../ui/button";
import { X } from "lucide-react";

export const CloseSidebar = () => {
  const { isOpen, setIsOpen } = useToggleSidebar();

  if (!isOpen) return null;

  return (
    <Button
      onClick={() => setIsOpen(false)}
      className="absolute right-3 top-3 z-[60] h-8 w-8 lg:hidden"
      size="icon"
      variant="ghost"
      aria-label="Close sidebar"
    >
      <X className="h-4 w-4" />
    </Button>
  );
};
