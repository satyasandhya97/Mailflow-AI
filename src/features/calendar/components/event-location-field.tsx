"use client";

import { ExternalLink, MapPin, Phone, Users, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const EVENT_LOCATION_PRESETS = [
  {
    id: "meet",
    label: "Google Meet",
    value: "https://meet.google.com/new",
    icon: Video,
  },
  {
    id: "zoom",
    label: "Zoom",
    value: "https://zoom.us/",
    icon: Video,
  },
  {
    id: "teams",
    label: "Teams",
    value: "Microsoft Teams meeting",
    icon: Video,
  },
  {
    id: "office",
    label: "In office",
    value: "Office",
    icon: Users,
  },
  {
    id: "phone",
    label: "Phone call",
    value: "Phone call",
    icon: Phone,
  },
] as const;

function isLocationUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function locationHelperText(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Add a room, address, or paste a video meeting link.";
  }
  if (isLocationUrl(trimmed)) {
    return "Video link — guests can join from the calendar invite.";
  }
  if (/meet|zoom|teams/i.test(trimmed)) {
    return "Virtual meeting — include the join link in the description if needed.";
  }
  return "In-person or custom location.";
}

type EventLocationFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function EventLocationField({
  id = "event-location",
  value,
  onChange,
  disabled,
  className,
}: EventLocationFieldProps) {
  const trimmed = value.trim();
  const isUrl = isLocationUrl(trimmed);
  const helper = locationHelperText(value);

  return (
    <div className={cn("grid min-w-0 gap-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        Location
      </Label>

      <InputGroup className="h-10 bg-background">
        <InputGroupAddon align="inline-start">
          <MapPin className="size-4 text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Conference room, address, or https://meet.google.com/..."
          disabled={disabled}
          className="h-10"
        />
        {isUrl && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              aria-label="Open location link"
              disabled={disabled}
              onClick={() => window.open(trimmed, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>

      <div className="flex min-w-0 flex-wrap gap-1.5">
        {EVENT_LOCATION_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isActive = trimmed === preset.value;
          return (
            <Button
              key={preset.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className={cn(
                "h-7 gap-1.5 rounded-full border-border/60 bg-background px-2.5 text-xs font-medium shadow-none",
                isActive &&
                  "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--teal-900)] hover:bg-[var(--brand-tint)]",
              )}
              onClick={() => onChange(preset.value)}
            >
              <Icon className="size-3.5 shrink-0 opacity-70" />
              {preset.label}
            </Button>
          );
        })}
      </div>

      {helper && (
        <p className="text-xs leading-relaxed text-muted-foreground">{helper}</p>
      )}
    </div>
  );
}
