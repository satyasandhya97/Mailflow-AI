export type MappedCalendarEvent = {
  id: string;
  summary: string;
  description: string;
  location: string;
  status: string;
  start: string;
  end: string;
  attendees: string[];
  htmlLink: string;
  createdAt: Date | null;
  timestamp: number;
};

export type CalendarListItem = {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor: string;
};

export type CalendarBusyBlock = {
  calendarId: string;
  start: string;
  end: string;
};

export type CalendarEvent = MappedCalendarEvent;
export type CalendarEventDetail = MappedCalendarEvent;

export type CalendarAvailability = {
  timeMin: string;
  timeMax: string;
  busyBlocks: CalendarBusyBlock[];
};
