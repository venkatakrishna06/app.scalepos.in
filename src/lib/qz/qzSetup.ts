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
                // Fallback to a hardcoded certificate if the endpoint is not available
                // You should replace this with your actual certificate content from cert.pem
                return `-----BEGIN CERTIFICATE-----
[YOUR CERTIFICATE CONTENT HERE]
-----END CERTIFICATE-----`;
            }
        });

        // 2. Set signing function using your Go backend
        window.qz.security.setSignaturePromise(async (toSign: string) => {
            try {
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
                
                return await response.text();
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
