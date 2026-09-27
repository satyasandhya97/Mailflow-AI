"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CatalogPluginRow } from "@/features/plugins/components/catalog-plugin-row";
import { PLUGIN_CATALOG } from "@/features/plugins/plugin-catalog";
import { filterPlugins } from "@/features/plugins/lib/plugin-workspace.service";

type AddPluginSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddPluginSheet({ open, onOpenChange }: AddPluginSheetProps) {
  const [query, setQuery] = useState("");

  const catalogItems = useMemo(
    () => filterPlugins(PLUGIN_CATALOG, { query, category: "all" }),
    [query],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/70 px-4 py-4 text-left">
          <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <span
              className="size-2 rounded-full bg-[var(--ember-600)]"
              aria-hidden
            />
            Catalog
          </div>
          <SheetTitle>Add plugin</SheetTitle>
          <SheetDescription>
            Choose a plugin from the Corsair catalog.
          </SheetDescription>
        </SheetHeader>

        <div className="border-b border-border/70 px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search plugins..."
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {catalogItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No plugins match your search.
            </p>
          ) : (
            catalogItems.map((plugin) => (
              <CatalogPluginRow key={plugin.id} plugin={plugin} />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
