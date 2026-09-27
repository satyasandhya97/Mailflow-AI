"use client";

import { Lightbulb, LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

export function TaskQuickAdd() {
  const utils = api.useUtils();
  const [text, setText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const invalidate = async () => {
    await utils.tasks.listBoard.invalidate();
    await utils.tasks.countActive.invalidate();
    await utils.tasks.listLabels.invalidate();
  };

  const createFromText = api.tasks.createFromText.useMutation({
    onSuccess: async (task) => {
      await invalidate();
      setText("");
      toast.success(`Created "${task.title}"`);
    },
    onError: (error) => toast.error(error.message),
  });

  const suggestionsQuery = api.tasks.suggest.useQuery(undefined, {
    enabled: showSuggestions,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 3 || createFromText.isPending) return;
    createFromText.mutate({ text: trimmed });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary/70" />
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit(text);
              }
            }}
            placeholder="Describe a task… e.g. “every weekday 8am summarize my inbox”"
            disabled={createFromText.isPending}
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
          />
        </div>
        <Button
          onClick={() => submit(text)}
          disabled={text.trim().length < 3 || createFromText.isPending}
        >
          {createFromText.isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          <span className="hidden sm:inline">Create with AI</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowSuggestions((value) => !value)}
          title="Suggest tasks"
        >
          <Lightbulb className="size-4" />
          <span className="hidden md:inline">Suggest</span>
        </Button>
      </div>

      {showSuggestions ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {suggestionsQuery.isFetching ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <LoaderCircle className="size-3 animate-spin" />
              Thinking of useful tasks…
            </span>
          ) : suggestionsQuery.data?.length ? (
            suggestionsQuery.data.map((suggestion, index) => (
              <button
                key={`${suggestion.title}-${index}`}
                type="button"
                disabled={createFromText.isPending}
                onClick={() =>
                  submit(
                    `${suggestion.title}. ${suggestion.instructions ?? suggestion.description ?? ""}`,
                  )
                }
                title={suggestion.reason}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/60 hover:bg-primary/10 disabled:opacity-60"
              >
                <Lightbulb className="size-3 text-primary" />
                {suggestion.title}
              </button>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">
              No suggestions right now.
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
