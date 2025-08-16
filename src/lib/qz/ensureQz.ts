// Common helper to ensure QZ Tray is available and connected
// Returns the window.qz object after ensuring a live websocket connection

interface QZ {
    websocket: {
        connect: () => Promise<void>;
        isActive: () => boolean;
    };
    printers?: {
        find: () => Promise<string[]>;
    };
    configs?: {
        create: (printer: string) => unknown;
    };
    print?: (config: unknown, data: unknown) => Promise<void>;
}

export const ensureQzConnected = async (): Promise<QZ> => {
    // Check if window.qz exists
    if (typeof window === 'undefined' || !('qz' in window)) {
        throw new Error(
            'QZ Tray not available. Please ensure QZ Tray is installed and running.'
        );
    }

    // Cast to unknown first, then to QZ
    const qz = ((window as unknown) as { qz: QZ }).qz;

    if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
    }

    return qz;
};


// Optional type augmentation can live elsewhere; relying on existing global decls in project.
