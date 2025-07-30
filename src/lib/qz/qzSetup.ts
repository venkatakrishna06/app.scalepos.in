// qzSecuritySetup.ts
export const setupQZSecurity = async () => {
    if (typeof window.qz === 'undefined') {
        console.error("QZ Tray not loaded.");
        return;
    }

    try {
        // 1. Fetch the certificate from your backend
        // This assumes you'll create an endpoint to serve the certificate
        window.qz.security.setCertificatePromise(async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/certificate`);
                if (!response.ok) {
                    throw new Error('Failed to fetch certificate');
                }
                const certificate = await response.text();
                return certificate;
            } catch (error) {
                console.error('Error fetching certificate:', error);
                // Fallback to empty certificate - will cause signing to fail
                // but at least won't crash the application
                throw new Error('Certificate endpoint not available');
            }
        });

        // 2. Set signing function using your Go backend
        window.qz.security.setSignaturePromise(async (toSign: string) => {
            try {
                console.log('Data to sign:', toSign);
                console.log('Data length:', toSign.length);

                const response = await fetch(`${import.meta.env.VITE_API_URL}/sign`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                    body: toSign
                });

                if (!response.ok) {
                    throw new Error('Failed to sign payload');
                }

                const signature = await response.text();
                console.log('Signature received:', signature);
                console.log('Signature length:', signature.length);

                return signature;
            } catch (error) {
                console.error('Error signing payload:', error);
                throw error;
            }
        });

        console.log('QZ Tray security configured successfully');
    } catch (error) {
        console.error('Error setting up QZ Tray security:', error);
        throw error;
    }
};
