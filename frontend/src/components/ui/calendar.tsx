"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker";
import { es, enUS } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  locale,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();
  const { language } = useSettings();
  const activeLocale = locale || (language === "es" ? es : enUS);

  return (
    <DayPicker
      locale={activeLocale}
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-transparent group/calendar p-2 select-none",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(activeLocale.code || "es", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months,
        ),
        month: cn("flex flex-col w-full gap-2", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between px-1 z-10",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 rounded-xl border border-border/60 hover:border-action/40 hover:bg-action/10 hover:text-action dark:hover:bg-blue-500/15 dark:hover:text-blue-400 p-0 flex items-center justify-center transition-all cursor-pointer aria-disabled:opacity-30 aria-disabled:pointer-events-none select-none",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-8 rounded-xl border border-border/60 hover:border-action/40 hover:bg-action/10 hover:text-action dark:hover:bg-blue-500/15 dark:hover:text-blue-400 p-0 flex items-center justify-center transition-all cursor-pointer aria-disabled:opacity-30 aria-disabled:pointer-events-none select-none",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex items-center justify-center h-8 w-full px-8",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-semibold justify-center h-8 gap-1.5",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative has-focus:border-action border border-border/80 shadow-xs rounded-xl",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "absolute bg-card inset-0 opacity-0 cursor-pointer",
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          "select-none font-bold text-sm capitalize text-titles dark:text-foreground tracking-tight",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex justify-between mt-2 mb-1 border-b border-border/40 pb-1", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground/75 font-bold text-[0.7rem] uppercase tracking-wider size-9 flex items-center justify-center select-none",
          defaultClassNames.weekday,
        ),
        week: cn("flex w-full justify-between mt-1", defaultClassNames.week),
        week_number_header: cn(
          "select-none size-9 flex items-center justify-center",
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          "text-[0.75rem] select-none text-muted-foreground/60 font-medium",
          defaultClassNames.week_number,
        ),
        day: cn(
          "relative size-9 p-0 text-center flex items-center justify-center aspect-square select-none group/day",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-xl"
            : "[&:first-child[data-selected=true]_button]:rounded-l-xl",
          "[&:last-child[data-selected=true]_button]:rounded-r-xl",
          defaultClassNames.day,
        ),
        range_start: cn(
          "rounded-l-xl bg-action",
          defaultClassNames.range_start,
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-xl bg-action", defaultClassNames.range_end),
        today: cn(
          "text-action font-bold",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground/40 opacity-40 aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-muted-foreground/25 opacity-25 cursor-not-allowed pointer-events-none",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            );
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-9 items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const isToday = modifiers.today;
  const isSelected = modifiers.selected;
  const isSingleSelected =
    isSelected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle;

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={isSingleSelected}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-today={isToday && !isSelected}
      className={cn(
        // Base day styling
        "size-9 w-9 h-9 min-w-[2.25rem] min-h-[2.25rem] p-0 flex items-center justify-center text-xs font-medium rounded-xl select-none cursor-pointer transition-all duration-150",
        // Interactive hover
        "hover:bg-action/10 hover:text-action dark:hover:bg-blue-500/15 dark:hover:text-blue-400",
        // Today styling (when not selected)
        "data-[today=true]:border-2 data-[today=true]:border-action/40 data-[today=true]:text-action dark:data-[today=true]:text-blue-400 data-[today=true]:font-bold data-[today=true]:bg-action/5",
        // Single Selected styling
        "data-[selected-single=true]:bg-action data-[selected-single=true]:text-white data-[selected-single=true]:font-bold data-[selected-single=true]:shadow-md data-[selected-single=true]:shadow-action/30 data-[selected-single=true]:hover:bg-action data-[selected-single=true]:hover:text-white",
        // Range Styling
        "data-[range-start=true]:bg-action data-[range-start=true]:text-white data-[range-start=true]:font-bold data-[range-start=true]:rounded-l-xl data-[range-start=true]:rounded-r-none data-[range-start=true]:shadow-sm data-[range-start=true]:hover:bg-action data-[range-start=true]:hover:text-white",
        "data-[range-end=true]:bg-action data-[range-end=true]:text-white data-[range-end=true]:font-bold data-[range-end=true]:rounded-r-xl data-[range-end=true]:rounded-l-none data-[range-end=true]:shadow-sm data-[range-end=true]:hover:bg-action data-[range-end=true]:hover:text-white",
        "data-[range-middle=true]:bg-action/15 dark:data-[range-middle=true]:bg-blue-500/20 data-[range-middle=true]:text-action dark:data-[range-middle=true]:text-blue-300 data-[range-middle=true]:font-semibold data-[range-middle=true]:rounded-none data-[range-middle=true]:hover:bg-action/25",
        // Outside days
        "data-[outside=true]:text-muted-foreground/40 data-[outside=true]:opacity-40",
        // Focus ring
        "focus-visible:ring-2 focus-visible:ring-action/50 focus-visible:outline-none",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
