import React, {forwardRef, InputHTMLAttributes} from 'react';
import {Input} from './input';
import {cn} from '@/lib/utils';

export interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
    /**
     * Label for the input
     * This is required for accessibility
     */
    label: string;

    /**
     * Whether to visually hide the label
     * The label will still be available to screen readers
     */
    hideLabel?: boolean;

    /**
     * Description or hint text for the input
     */
    description?: string;

    /**
     * Error message to display
     */
    error?: string;

    /**
     * ID for the input
     * If not provided, a unique ID will be generated
     */
    id?: string;

    /**
     * Additional className for the container
     */
    containerClassName?: string;

    /**
     * Additional className for the label
     */
    labelClassName?: string;

    /**
     * Additional className for the description
     */
    descriptionClassName?: string;

    /**
     * Additional className for the error message
     */
    errorClassName?: string;
}

/**
 * An accessible input component that extends the base Input component
 * with additional ARIA attributes and proper labeling.
 *
 * @example
 * <AccessibleInput
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   description="We'll never share your email with anyone else."
 *   error={errors.email?.message}
 *   required
 * />
 */
export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
    ({
         label,
         hideLabel = false,
         description,
         error,
         id: providedId,
         containerClassName,
         labelClassName,
         descriptionClassName,
         errorClassName,
         className,
         required,
         disabled,
         'aria-describedby': ariaDescribedBy,
         ...props
     }, ref) => {
        // Generate unique IDs for accessibility
        const id = providedId || `input-${Math.random().toString(36).substring(2, 9)}`;
        const descriptionId = description ? `${id}-description` : undefined;
        const errorId = error ? `${id}-error` : undefined;

        // Combine aria-describedby values
        const combinedAriaDescribedBy = [
            ariaDescribedBy,
            descriptionId,
            errorId
        ].filter(Boolean).join(' ') || undefined;

        return (
            <div className={cn("space-y-2", containerClassName)}>
                <label
                    htmlFor={id}
                    className={cn(
                        "text-sm font-medium",
                        hideLabel && "sr-only",
                        error && "text-destructive",
                        labelClassName
                    )}
                >
                    {label}
                    {required && <span aria-hidden="true" className="text-destructive ml-1">*</span>}
                </label>

                {description && (
                    <p
                        id={descriptionId}
                        className={cn("text-sm text-muted-foreground", descriptionClassName)}
                    >
                        {description}
                    </p>
                )}

                <Input
                    ref={ref}
                    id={id}
                    className={cn(error && "border-destructive", className)}
                    aria-invalid={!!error}
                    aria-describedby={combinedAriaDescribedBy}
                    aria-required={required}
                    aria-disabled={disabled}
                    required={required}
                    disabled={disabled}
                    {...props}
                />

                {error && (
                    <p
                        id={errorId}
                        className={cn("text-sm text-destructive", errorClassName)}
                        role="alert"
                    >
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

AccessibleInput.displayName = "AccessibleInput";