
import { Button } from '@/components/ui/button';
import React from 'react';

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

export function ActionButton({ icon, label, onClick }: ActionButtonProps) {
    return (
        <Button
            variant="outline"
            className="flex h-24 flex-col items-center justify-center gap-2 p-0 hover:border-primary/50 hover:bg-muted/80"
            onClick={onClick}
        >
            <div className="rounded-full bg-primary/10 p-2">
                {icon}
            </div>
            <span className="text-sm font-medium">{label}</span>
        </Button>
    );
}
