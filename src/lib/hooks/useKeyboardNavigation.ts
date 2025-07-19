import {useCallback, useEffect, useRef} from 'react';

interface KeyboardNavigationOptions {
    /**
     * CSS selector for focusable elements
     * Default: 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
     */
    selector?: string;

    /**
     * Whether to enable arrow key navigation
     * Default: true
     */
    enableArrowKeys?: boolean;

    /**
     * Whether to enable home/end key navigation
     * Default: true
     */
    enableHomeEndKeys?: boolean;

    /**
     * Whether to enable page up/down key navigation
     * Default: false
     */
    enablePageKeys?: boolean;

    /**
     * Whether to wrap around when reaching the end of the list
     * Default: true
     */
    wrapAround?: boolean;

    /**
     * Whether to auto-focus the first element when the container is mounted
     * Default: false
     */
    autoFocus?: boolean;

    /**
     * Callback when an element is focused
     */
    onFocus?: (element: HTMLElement) => void;

    /**
     * Callback when a key is pressed
     */
    onKeyDown?: (event: KeyboardEvent) => void;
}

/**
 * Hook for implementing keyboard navigation within a container
 *
 * @example
 * const containerRef = useKeyboardNavigation({
 *   selector: 'button, a',
 *   enableArrowKeys: true,
 *   wrapAround: true,
 * });
 *
 * return (
 *   <div ref={containerRef}>
 *     <button>First</button>
 *     <button>Second</button>
 *     <button>Third</button>
 *   </div>
 * );
 */
export function useKeyboardNavigation({
                                          selector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
                                          enableArrowKeys = true,
                                          enableHomeEndKeys = true,
                                          enablePageKeys = false,
                                          wrapAround = true,
                                          autoFocus = false,
                                          onFocus,
                                          onKeyDown,
                                      }: KeyboardNavigationOptions = {}) {
    const containerRef = useRef<HTMLElement | null>(null);

    // Get all focusable elements within the container
    const getFocusableElements = useCallback(() => {
        if (!containerRef.current) return [];

        return Array.from(
            containerRef.current.querySelectorAll<HTMLElement>(selector)
        ).filter(el => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1');
    }, [selector]);

    // Focus a specific element
    const focusElement = useCallback((element: HTMLElement) => {
        if (element && typeof element.focus === 'function') {
            element.focus();
            onFocus?.(element);
        }
    }, [onFocus]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Call the onKeyDown callback if provided
        onKeyDown?.(event);

        // Get the currently focused element
        const focusedElement = document.activeElement as HTMLElement;

        // If the focused element is not within the container, do nothing
        if (!containerRef.current?.contains(focusedElement)) {
            return;
        }

        // Get all focusable elements
        const elements = getFocusableElements();
        if (elements.length === 0) return;

        // Get the index of the currently focused element
        const currentIndex = elements.indexOf(focusedElement);

        // Handle arrow key navigation
        if (enableArrowKeys) {
            if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                event.preventDefault();

                if (currentIndex === elements.length - 1) {
                    // If at the end, wrap around or stay at the end
                    focusElement(wrapAround ? elements[0] : elements[currentIndex]);
                } else {
                    focusElement(elements[currentIndex + 1]);
                }
            } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                event.preventDefault();

                if (currentIndex === 0) {
                    // If at the beginning, wrap around or stay at the beginning
                    focusElement(wrapAround ? elements[elements.length - 1] : elements[0]);
                } else {
                    focusElement(elements[currentIndex - 1]);
                }
            }
        }

        // Handle home/end key navigation
        if (enableHomeEndKeys) {
            if (event.key === 'Home') {
                event.preventDefault();
                focusElement(elements[0]);
            } else if (event.key === 'End') {
                event.preventDefault();
                focusElement(elements[elements.length - 1]);
            }
        }

        // Handle page up/down key navigation
        if (enablePageKeys) {
            const pageSize = Math.max(3, Math.floor(elements.length / 3));

            if (event.key === 'PageDown') {
                event.preventDefault();

                const newIndex = Math.min(currentIndex + pageSize, elements.length - 1);
                focusElement(elements[newIndex]);
            } else if (event.key === 'PageUp') {
                event.preventDefault();

                const newIndex = Math.max(currentIndex - pageSize, 0);
                focusElement(elements[newIndex]);
            }
        }
    }, [
        enableArrowKeys,
        enableHomeEndKeys,
        enablePageKeys,
        focusElement,
        getFocusableElements,
        onKeyDown,
        wrapAround,
    ]);

    // Set up event listeners
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Add keydown event listener
        container.addEventListener('keydown', handleKeyDown);

        // Auto-focus the first element if enabled
        if (autoFocus) {
            const elements = getFocusableElements();
            if (elements.length > 0) {
                focusElement(elements[0]);
            }
        }

        // Clean up event listeners
        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }, [autoFocus, focusElement, getFocusableElements, handleKeyDown]);

    return containerRef;
}