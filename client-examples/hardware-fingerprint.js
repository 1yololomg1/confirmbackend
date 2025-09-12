// Client-side hardware fingerprinting for your oil & gas software
// This code would be integrated into your main application

class HardwareFingerprint {
    constructor() {
        this.apiBaseUrl = 'https://your-license-server.com/api';
    }

    // Get hardware information (implementation depends on your platform)
    async getHardwareInfo() {
        // Example implementation - adapt for your platform (C++, .NET, etc.)
        try {
            const hardwareInfo = {
                cpu_id: await this.getCPUID(),
                motherboard_id: await this.getMotherboardID(),
                bios_serial: await this.getBIOSSerial(),
                mac_address: await this.getPrimaryMACAddress()
            };

            return hardwareInfo;
        } catch (error) {
            console.error('Failed to get hardware info:', error);
            throw new Error('Hardware identification failed');
        }
    }

    // Generate machine fingerprint and get payment URL
    async generateFingerprintAndPaymentURL() {
        try {
            const hardwareInfo = await this.getHardwareInfo();
            
            const response = await fetch(`${this.apiBaseUrl}/machine-fingerprint`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    hardware_info: hardwareInfo
                })
            });

            const result = await response.json();
            
            if (result.success) {
                return {
                    fingerprint: result.machine_fingerprint,
                    paymentUrl: result.payment_url
                };
            } else {
                throw new Error(result.error || 'Failed to generate fingerprint');
            }
        } catch (error) {
            console.error('Fingerprint generation failed:', error);
            throw error;
        }
    }

    // Verify license status
    async verifyLicense() {
        try {
            const hardwareInfo = await this.getHardwareInfo();
            
            const response = await fetch(`${this.apiBaseUrl}/verify-secure-license`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    hardware_info: hardwareInfo,
                    product: 'your-oil-gas-software',
                    version: '1.0.0'
                })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('License verification failed:', error);
            return {
                status: 'error',
                message: 'Unable to verify license - network error'
            };
        }
    }

    // Create payment session for specific license type
    async createPaymentSession(licenseType, isRenewal = false) {
        try {
            const { fingerprint } = await this.generateFingerprintAndPaymentURL();
            
            const response = await fetch(`${this.apiBaseUrl}/create-payment-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    machine_fingerprint: fingerprint,
                    license_type: licenseType,
                    is_renewal: isRenewal
                })
            });

            const result = await response.json();
            
            if (result.success) {
                return result.checkout_url;
            } else {
                throw new Error(result.error || 'Failed to create payment session');
            }
        } catch (error) {
            console.error('Payment session creation failed:', error);
            throw error;
        }
    }

    // Platform-specific hardware info methods (examples - implement for your platform)
    async getCPUID() {
        // Windows: Use WMI query for Win32_Processor.ProcessorId
        // Linux: Read from /proc/cpuinfo
        // macOS: Use system_profiler
        return 'example-cpu-id';
    }

    async getMotherboardID() {
        // Windows: Win32_BaseBoard.SerialNumber
        // Linux: DMI information
        // macOS: system_profiler
        return 'example-motherboard-id';
    }

    async getBIOSSerial() {
        // Windows: Win32_BIOS.SerialNumber
        // Linux: DMI information
        // macOS: system_profiler
        return 'example-bios-serial';
    }

    async getPrimaryMACAddress() {
        // Get primary network adapter MAC address
        // Filter out virtual adapters, VPNs, etc.
        return 'example-mac-address';
    }
}

// Usage example in your main application
class LicenseManager {
    constructor() {
        this.fingerprint = new HardwareFingerprint();
        this.isLicensed = false;
        this.licenseInfo = null;
    }

    // Check license on application startup
    async initializeLicense() {
        try {
            const result = await this.fingerprint.verifyLicense();
            
            switch (result.status) {
                case 'valid':
                    this.isLicensed = true;
                    this.licenseInfo = result;
                    console.log(`License valid until: ${result.expires_at}`);
                    
                    // Check for expiration warning
                    if (result.warnings && result.warnings.length > 0) {
                        this.showRenewalWarning(result.warnings[0], result.renewal_url);
                    }
                    
                    return true;

                case 'expired':
                    this.showRenewalDialog(result.renewal_url);
                    return false;

                case 'invalid':
                    this.showPurchaseDialog(result.purchase_url);
                    return false;

                default:
                    this.showErrorDialog(result.message);
                    return false;
            }
        } catch (error) {
            console.error('License initialization failed:', error);
            this.showErrorDialog('Unable to verify license. Please check your internet connection.');
            return false;
        }
    }

    // Show purchase dialog with license options
    showPurchaseDialog(purchaseUrl) {
        // Implement your UI dialog
        const licenseOptions = [
            { type: 'student', name: 'Student License', price: '$49/year', description: 'Full features at student pricing' },
            { type: 'startup', name: 'Startup License', price: '$99/month', description: 'Full features with monthly billing' },
            { type: 'professional', name: 'Professional License', price: '$199/month', description: 'Full features standard pricing' },
            { type: 'professional_yearly', name: 'Professional (Yearly)', price: '$1,999/year', description: 'Full features with yearly discount' },
            { type: 'enterprise', name: 'Enterprise License', price: '$499/month', description: 'Full features premium pricing' },
            { type: 'enterprise_yearly', name: 'Enterprise (Yearly)', price: '$4,999/year', description: 'Full features premium yearly' }
        ];

        // Show dialog with options
        // When user selects option, call:
        // this.purchaseLicense(selectedType);
    }

    async purchaseLicense(licenseType) {
        try {
            const checkoutUrl = await this.fingerprint.createPaymentSession(licenseType, false);
            
            // Open checkout URL in browser
            // After successful payment, the webhook will create the license automatically
            // User should restart the application to verify the new license
            
            this.openExternalUrl(checkoutUrl);
            this.showRestartMessage();
        } catch (error) {
            console.error('Purchase failed:', error);
            this.showErrorDialog('Failed to initiate purchase. Please try again.');
        }
    }

    // Utility methods (implement based on your platform)
    openExternalUrl(url) {
        // Platform-specific URL opening
        console.log(`Open URL: ${url}`);
    }

    showRenewalWarning(message, renewalUrl) {
        console.log(`Renewal warning: ${message}`);
        // Show non-blocking warning dialog
    }

    showRenewalDialog(renewalUrl) {
        console.log('License expired - showing renewal dialog');
        // Show blocking dialog requiring renewal
    }

    showErrorDialog(message) {
        console.log(`Error: ${message}`);
        // Show error dialog
    }

    showRestartMessage() {
        console.log('Payment initiated - please restart application after payment completion');
        // Show message asking user to restart after payment
    }

    // Call this before allowing access to licensed features
    requireValidLicense() {
        if (!this.isLicensed) {
            throw new Error('Valid license required for this feature');
        }
    }

    // Periodic license check (call every few hours)
    async periodicLicenseCheck() {
        if (this.isLicensed) {
            const result = await this.fingerprint.verifyLicense();
            if (result.status !== 'valid') {
                this.isLicensed = false;
                this.licenseInfo = null;
                // Lock the application
                this.lockApplication();
            }
        }
    }

    lockApplication() {
        // Disable all licensed features
        console.log('Application locked - license no longer valid');
    }
}

// Export for use in your application
// module.exports = { LicenseManager, HardwareFingerprint };