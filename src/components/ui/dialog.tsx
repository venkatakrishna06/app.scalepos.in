import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {X} from "lucide-react"
import {cn} from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({className, ...props}, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            className
        )}
        {...props}
    />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    onClose?: () => void;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}
>(({className, children, onClose, size = 'md', ...props}, ref) => {
    // Define size variants
    const sizeVariants = {
        sm: "max-w-sm", // 24rem (384px)
        md: "max-w-md", // 28rem (448px)
        lg: "max-w-lg", // 32rem (512px)
        xl: "max-w-xl", // 36rem (576px)
        full: "max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw]" // Responsive full width
    };

    // Define height variants based on size
    const heightVariants = {
        sm: "max-h-[80vh]", // Smaller dialogs can be taller
        md: "max-h-[85vh]", // Medium dialogs
        lg: "max-h-[85vh]", // Large dialogs
        xl: "max-h-[90vh]", // Extra large dialogs
        full: "max-h-[90vh]" // Full-screen dialogs
    };

    // Define padding variants based on size
    const paddingVariants = {
        sm: "p-4 sm:p-5", // Smaller padding for small dialogs
        md: "p-4 sm:p-5", // Medium padding
        lg: "p-4 sm:p-6", // Larger padding for large dialogs
        xl: "p-4 sm:p-6", // Larger padding for extra large dialogs
        full: "p-3 sm:p-4" // Minimal padding for full-screen dialogs to maximize content space
    };

    return (
        <DialogPortal>
            <DialogOverlay/>
            <DialogPrimitive.Content
                ref={ref}
                onInteractOutside={(e) => {
                    // Allow closing when clicking outside if onClose is provided
                    if (onClose) {
                        onClose();
                    } else {
                        e.preventDefault();
                    }
                }}
                className={cn(
                    "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-3 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
                    // Apply size variant
                    sizeVariants[size],
                    // Apply height variant
                    heightVariants[size],
                    // Apply padding variant
                    paddingVariants[size],
                    // Add overflow handling with custom scrollbar
                    "overflow-y-auto custom-scrollbar",
                    className
                )}
                {...props}
            >
                {children}
                {onClose && (
                    <DialogPrimitive.Close
                        onClick={onClose}
                        className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                    >
                        <X className="h-4 w-4"/>
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                )}
            </DialogPrimitive.Content>
        </DialogPortal>
    );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
                          className,
                          ...props
                      }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-1 text-center sm:text-left",
            className
        )}
        {...props}
    />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
                          className,
                          ...props
                      }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
            className
        )}
        {...props}
    />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({className, ...props}, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn(
            "text-lg font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({className, ...props}, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogClose,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
}
