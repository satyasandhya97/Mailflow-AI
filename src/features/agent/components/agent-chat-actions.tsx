"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AgentChatRenameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSubmit: (title: string) => void;
};

function AgentChatRenameDialog({
  open,
  onOpenChange,
  title,
  onSubmit,
}: AgentChatRenameDialogProps) {
  const [value, setValue] = useState(title);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setValue(title);
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename chat</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Chat title"
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type AgentChatActionsMenuProps = {
  conversationId: string;
  title: string;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  align?: "start" | "center" | "end";
  triggerClassName?: string;
  triggerVisible?: "always" | "hover";
};

export function AgentChatActionsMenu({
  conversationId,
  title,
  onRename,
  onDelete,
  align = "start",
  triggerClassName,
  triggerVisible = "always",
}: AgentChatActionsMenuProps) {
  const [renameOpen, setRenameOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "size-7 shrink-0",
                triggerVisible === "hover" &&
                  "opacity-0 transition-opacity group-hover:opacity-100 data-popup-open:opacity-100",
                triggerClassName,
              )}
              aria-label={`Actions for ${title}`}
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-44">
          <DropdownMenuItem onClick={() => setRenameOpen(true)}>
            <Pencil className="size-4" />
            Rename chat
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(conversationId)}
          >
            <Trash2 className="size-4" />
            Delete chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AgentChatRenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        title={title}
        onSubmit={(nextTitle) => onRename(conversationId, nextTitle)}
      />
    </>
  );
}
