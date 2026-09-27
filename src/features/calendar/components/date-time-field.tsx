"use client";

import { CalendarIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  applyDatePart,
  applyTimeValue,
  dateToTimeValue,
  formatEventDate,
  formatEventTime,
  TIME_SLOTS,
} from "@/features/calendar/lib/calendar-datetime.utils";
import { cn } from "@/lib/utils";

const fieldTriggerClass =
  "inline-flex h-9 min-w-0 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-sm shadow-xs transition-colors hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

type DateTimeFieldProps = {
  id?: string;
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
  className?: string;
};

export function DateTimeField({
  id,
  label,
  value,
  onChange,
  disabled,
  className,
}: DateTimeFieldProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const timeValue = useMemo(() => dateToTimeValue(value), [value]);

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    onChange(applyDatePart(value, date));
    setCalendarOpen(false);
  }

  function handleTimeChange(nextTime: string | null) {
    if (!nextTime) return;
    onChange(applyTimeValue(value, nextTime));
  }

  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_8.5rem] gap-2.5">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            id={id}
            disabled={disabled}
            className={cn(fieldTriggerClass, "w-full justify-start")}
          >
            <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{formatEventDate(value)}</span>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
            />
          </PopoverContent>
        </Popover>

        <Select
          value={timeValue}
          onValueChange={handleTimeChange}
          disabled={disabled}
        >
          <SelectTrigger className={cn(fieldTriggerClass, "w-full")}>
            <SelectValue>{formatEventTime(value)}</SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {TIME_SLOTS.map((slot) => (
              <SelectItem key={slot.value} value={slot.value}>
                {slot.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
