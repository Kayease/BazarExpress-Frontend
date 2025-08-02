"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={true}
      className={cn(
        "p-4 max-w-xs mx-auto rounded-xl bg-white shadow-md border",
        className
      )}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar"

export { Calendar }
