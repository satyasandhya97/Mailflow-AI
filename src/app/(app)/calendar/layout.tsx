import { CalendarShellLayout } from "@/features/calendar/layouts/calendar-shell-layout";

export default function CalendarLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <CalendarShellLayout>{children}</CalendarShellLayout>;
}
