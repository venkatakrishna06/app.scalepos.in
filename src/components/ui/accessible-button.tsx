import React, { forwardRef } from 'react';
import { Button, ButtonProps } from './button';
import { cn } from '@/lib/utils';

export interface AccessibleButtonProps extends ButtonProps {
  /**
   * Accessible label for screen readers
   * Use this when the button text is not descriptive enough
   * or when the button only contains an icon
   */
  ariaLabel?: string;

  /**
   * ID of the element that describes the button
   */
  ariaDescribedBy?: string;

  /**
   * Whether the button controls an expanded element
   */
  ariaExpanded?: boolean;

  /**
   * Whether the button has a popup menu
   */
  ariaHasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';

  /**
   * ID of the element that is controlled by the button
   */
  ariaControls?: string;

  /**
   * Whether the button is currently pressed
   * Useful for toggle buttons
   */
  ariaPressed?: boolean;

  /**
   * Whether the button is currently selected
   * Useful for tab-like buttons
   */
  ariaSelected?: boolean;

  /**
   * Current state of the button
   */
  ariaChecked?: boolean | 'mixed';

  /**
   * Whether the button is disabled
   * This is in addition to the disabled prop
   */
  ariaDisabled?: boolean;

  /**
   * Whether the button is required
   */
  ariaRequired?: boolean;

  /**
   * Whether the button is currently busy
   */
  ariaBusy?: boolean;

  /**
   * Whether the button is currently loading
   * This will add a loading indicator and make the button non-interactive
   */
  isLoading?: boolean;

  /**
   * Icon to display when the button is loading
   */
  loadingIcon?: React.ReactNode;

  /**
   * Text to display when the button is loading
   */
  loadingText?: string;

  /**
   * Whether to hide the button text when loading
   */
  hideTextWhenLoading?: boolean;
}

/**
 * An accessible button component that extends the base Button component
 * with additional ARIA attributes and keyboard navigation support.
 * 
 * @example
 * <AccessibleButton
 *   ariaLabel="Add new item"
 *   ariaExpanded={isExpanded}
 *   ariaControls="dropdown-menu"
 *   onClick={handleClick}
 * >
 *   Add Item
 * </AccessibleButton>
 */
export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    className,
    children,
    ariaLabel,
    ariaDescribedBy,
    ariaExpanded,
    ariaHasPopup,
    ariaControls,
    ariaPressed,
    ariaSelected,
    ariaChecked,
    ariaDisabled,
    ariaRequired,
    ariaBusy,
    isLoading,
    loadingIcon,
    loadingText,
    hideTextWhenLoading = false,
    disabled,
    ...props
  }, ref) => {
    // Combine disabled state from props and aria attributes
    const isDisabled = disabled || ariaDisabled || isLoading;

    // Determine what to render as children
    const renderChildren = () => {
      if (!isLoading) return children;

      if (hideTextWhenLoading) {
        return loadingIcon || <span className="animate-spin">⟳</span>;
      }

      return (
        <>
          {loadingIcon || <span className="animate-spin mr-2">⟳</span>}
          {loadingText || children}
        </>
      );
    };

    return (
      <Button
        ref={ref}
        className={cn(
          isLoading && "opacity-80 cursor-not-allowed",
          className
        )}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHasPopup}
        aria-controls={ariaControls}
        aria-pressed={ariaPressed}
        aria-selected={ariaSelected}
        aria-checked={ariaChecked}
        aria-disabled={ariaDisabled}
        aria-required={ariaRequired}
        aria-busy={ariaBusy || isLoading}
        {...props}
      >
        {renderChildren()}
      </Button>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";
