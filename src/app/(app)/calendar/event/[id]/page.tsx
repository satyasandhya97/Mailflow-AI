import { CalendarEventPage } from "@/features/calendar/components/calendar-event-page";

type CalendarEventRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function CalendarEventRoutePage({
  params,
}: CalendarEventRouteProps) {
  const { id } = await params;
  return <CalendarEventPage eventId={id} />;
}
