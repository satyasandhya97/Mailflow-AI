"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PLUGIN_FILTER_CATEGORIES,
  type PluginFilterCategory,
} from "@/features/plugins/constants/plugin-filters";
import { cn } from "@/lib/utils";

type PluginsFiltersProps = {
  query: string;
  category: PluginFilterCategory;
  onQueryChange: (value: string) => void;
  onCategoryChange: (category: PluginFilterCategory) => void;
};

export function PluginsFilters({
  query,
  category,
  onQueryChange,
  onCategoryChange,
}: PluginsFiltersProps) {
  return (
    <div className="flex  justify-between items-center ">
      <div className="relative min-w-96">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search your plugins..."
          className="h-10 pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {PLUGIN_FILTER_CATEGORIES.map((item) => {
          const isActive = category === item.id;

          return (
            <Button
              key={item.id}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full")}
              onClick={() => onCategoryChange(item.id)}
            >
              {item.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
