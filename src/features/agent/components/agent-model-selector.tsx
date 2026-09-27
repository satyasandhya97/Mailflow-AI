"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Command } from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
} from "@/components/ai-elements/model-selector";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import {
  findAgentModel,
  getAgentModelKey,
  getAgentProviderLabel,
} from "@/features/agent/lib/agent-models";
import type { AgentModelOption } from "@/features/agent/types/agent.types";
import { cn } from "@/lib/utils";

type AgentModelSelectorProps = {
  models: AgentModelOption[];
  modelKey: string;
  onModelChange: (key: string) => void;
  disabled?: boolean;
};

export function AgentModelSelector({
  models,
  modelKey,
  onModelChange,
  disabled,
}: AgentModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = findAgentModel(modelKey) ?? models[0]!;

  const groups = useMemo(() => {
    const map = new Map<string, AgentModelOption[]>();

    for (const model of models) {
      const label = getAgentProviderLabel(model.provider);
      const existing = map.get(label) ?? [];
      existing.push(model);
      map.set(label, existing);
    }

    return [...map.entries()];
  }, [models]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <PromptInputButton
            type="button"
            variant="ghost"
            disabled={disabled}
            className="h-8 max-w-[11rem] gap-2 rounded-full bg-muted/50 px-3 text-xs font-normal text-foreground shadow-none hover:bg-muted/70 data-popup-open:bg-muted/70"
          />
        }
      >
        <ModelSelectorLogo
          provider={selected.provider}
          className="size-4 shrink-0"
        />
        <ModelSelectorName className="truncate text-xs font-medium">
          {selected.label}
        </ModelSelectorName>
        <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-[min(100vw-2rem,22rem)] overflow-hidden p-0"
      >
        <Command className="rounded-lg **:data-[slot=command-input-wrapper]:h-auto">
          <ModelSelectorInput placeholder="Search models..." />
          <ModelSelectorList className="max-h-64">
            <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
            {groups.map(([providerLabel, providerModels]) => (
              <ModelSelectorGroup key={providerLabel} heading={providerLabel}>
                {providerModels.map((model) => {
                  const key = getAgentModelKey(model);
                  const isSelected = key === modelKey;

                  return (
                    <ModelSelectorItem
                      key={key}
                      value={`${providerLabel} ${model.label} ${model.description ?? ""} ${model.modelId}`}
                      onSelect={() => {
                        onModelChange(key);
                        setOpen(false);
                      }}
                    >
                      <ModelSelectorLogo
                        provider={model.provider}
                        className="size-4 shrink-0"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <ModelSelectorName className="text-sm font-medium">
                          {model.label}
                        </ModelSelectorName>
                        {model.description ? (
                          <span className="truncate text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        ) : null}
                      </div>
                      <CheckIcon
                        className={cn(
                          "ml-auto size-4 shrink-0 text-primary",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </ModelSelectorItem>
                  );
                })}
              </ModelSelectorGroup>
            ))}
          </ModelSelectorList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
