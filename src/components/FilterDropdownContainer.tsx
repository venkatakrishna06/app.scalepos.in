import React from 'react';
import {cn} from '@/lib/utils';

interface FilterDropdownContainerProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * A container component for filter dropdowns that displays them in two columns on mobile devices
 * and in a row on larger screens.
 */
export function FilterDropdownContainer({children, className}: FilterDropdownContainerProps) {
    return (
        <div
            className={cn(
                "grid grid-cols-2 sm:grid-cols-none sm:flex sm:flex-row sm:flex-wrap gap-2",
                className
            )}
        >
            {React.Children.map(children, (child) => {
                // If the child is a valid React element, add responsive width classes
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, {
                        className: cn(
                            "w-full sm:w-auto", // Full width within grid cell on mobile, auto width on larger screens
                            child.props.className
                        ),
                    });
                }
                return child;
            })}
        </div>
    );
}
