import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

interface CancellationReasonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string) => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export function CancellationReasonDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false,
}: CancellationReasonDialogProps) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState(false);

    const handleConfirm = () => {
        if (!reason.trim()) {
            setError(true);
            return;
        }
        onConfirm(reason);
        setReason(''); // Reset reason after confirmation
        setError(false);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setReason(''); // Reset reason when dialog is closed
            setError(false);
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="cancellation-reason" className={`block mb-2 ${error ? 'text-destructive' : ''}`}>
                        Reason for cancellation <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="cancellation-reason"
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (e.target.value.trim()) {
                                setError(false);
                            }
                        }}
                        placeholder="Enter reason for cancellation"
                        className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
                        autoFocus
                    />
                    {error && (
                        <p className="mt-1 text-sm text-destructive">
                            Please provide a reason for cancellation
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        loading={isLoading}
                        loadingText={confirmText}
                        disabled={isLoading}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}