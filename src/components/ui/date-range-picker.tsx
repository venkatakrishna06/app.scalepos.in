import * as React from "react";
import {useEffect, useState} from "react";
import {format} from "date-fns";
import {Calendar as CalendarIcon} from "lucide-react";
import {DateRange} from "react-day-picker";

import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    className?: string;
}

export function DatePickerWithRange({
                                        date,
                                        setDate,
                                        className,
                                    }: DatePickerWithRangeProps) {
    const [monthsToShow, setMonthsToShow] = useState(2);

    // Handle responsive calendar display
    useEffect(() => {
        const handleResize = () => {
            setMonthsToShow(window.innerWidth < 768 ? 1 : 2);
        };

        // Set initial value
        handleResize();

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Clean up
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4"/>
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)] overflow-x-auto" align="start">
                    <div className="max-w-full overflow-hidden">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={monthsToShow}
                            className="max-w-full"
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
