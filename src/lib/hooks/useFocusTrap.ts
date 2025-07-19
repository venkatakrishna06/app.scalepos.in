import {useEffect, useRef} from 'react';

interface FocusTrapOptions {
    /**
     * Whether the focus trap is active
     * Default: true
     */
    active?: boolean;

    /**
     * Whether to auto-focus the first focusable element when the trap is activated
     * Default: true
     */
    autoFocus?: boolean;

    /**
     * Element to return focus to when the trap is deactivated
     * Default: document.activeElement
     */
    returnFocusTo?: HTMLElement | null;

    /**
     * CSS selector for focusable elements
     * Default: 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
     */
    selector?: string;
}

/**
 * Hook for trapping focus within a container (e.g., modal, dialog)
 *
 * @example
 * const modalRef = useFocusTrap({
 *   active: isOpen,
 *   autoFocus: true,
 * });
 *
 * return (
 *   <div ref={modalRef} className="modal">
 *     <button>Close</button>
 *     <input type="text" />
 *     <button>Submit</button>
 *   </div>
 * );
 */
export function useFocusTrap({
                                 active = true,
                                 autoFocus = true,
                                 returnFocusTo = null,
                                 selector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
                             }: FocusTrapOptions = {}) {
    const containerRef = useRef<HTMLElement | null>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Get all focusable elements within the container
    const getFocusableElements = () => {
        if (!containerRef.current) return [];

        return Array.from(
            containerRef.current.querySelectorAll<HTMLElement>(selector)
        ).filter(el => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1');
    };

    // Handle tab key to trap focus
    const handleTabKey = (event: KeyboardEvent) => {
        const focusableElements = getFocusableElements();

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // If shift+tab on first element, move to last element
        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        }
        // If tab on last element, move to first element
        else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    };

    // Handle keydown events
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
            handleTabKey(event);
        }

        // Handle escape key to close modal/dialog
        if (event.key === 'Escape') {
            // This is just a signal - the consumer should handle the actual closing
            const closeEvent = new CustomEvent('focus-trap-escape', {
                bubbles: true,
                cancelable: true,
            });
            containerRef.current?.dispatchEvent(closeEvent);
        }
    };

    // Set up focus trap when active
    useEffect(() => {
        if (!active) return;

        // Store the previously focused element
        previousFocusRef.current = (document.activeElement as HTMLElement) || null;

        // Auto-focus the first focusable element
        if (autoFocus) {
            const focusableElements = getFocusableElements();
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            } else {
                // If no focusable elements, focus the container itself
                if (containerRef.current) {
                    containerRef.current.tabIndex = -1;
                    containerRef.current.focus();
                }
            }
        }

        // Add event listener for keydown
        const container = containerRef.current;
        if (container) {
            container.addEventListener('keydown', handleKeyDown);
        }

        // Clean up
        return () => {
            if (container) {
                container.removeEventListener('keydown', handleKeyDown);
            }

            // Return focus to the previously focused element or the specified element
            const elementToFocus = returnFocusTo || previousFocusRef.current;
            if (elementToFocus && typeof elementToFocus.focus === 'function') {
                elementToFocus.focus();
            }
        };
    }, [active, autoFocus, returnFocusTo]);

    return containerRef;
}