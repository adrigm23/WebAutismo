"use client";

import dynamic from "next/dynamic";
import type { CalendarPageProps } from "@/components/platform/calendar/calendar-page";

// Lazy-load the 1100-line calendar component so it ships as a separate JS
// chunk and doesn't inflate the main bundle for the calendario route.
// ssr: false is only valid inside a Client Component — keep this wrapper.
const CalendarPageDynamic = dynamic(
  () =>
    import("@/components/platform/calendar/calendar-page").then((m) => ({
      default: m.CalendarPage,
    })),
  { ssr: false },
);

export function CalendarPageClient(props: CalendarPageProps) {
  return <CalendarPageDynamic {...props} />;
}
