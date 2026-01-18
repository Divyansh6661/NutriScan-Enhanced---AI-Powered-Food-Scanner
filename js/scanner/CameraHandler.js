class CameraHandler {
    constructor() {
        this.stream = null;
        this.hasPermission = false;
    }

    async requestCameraPermission() {
        try {
            // Check if mediaDevices is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

            // Request camera permission
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: CONFIG.SCANNER.WIDTH },
                    height: { ideal: CONFIG.SCANNER.HEIGHT }
                }
            });

            this.hasPermission = true;
            return {
                success: true,
                stream: this.stream
            };

        } catch (error) {
            return this.handleCameraError(error);
        }
    }

    handleCameraError(error) {
        let userMessage = '';
        let technicalMessage = error.message;
        let canRetry = false;
        let suggestions = [];

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            userMessage = 'Camera access was denied';
            suggestions = [
                'Click the camera icon in your browser address bar',
                'Select "Allow" for camera permissions',
                'Reload the page and try again'
            ];
            canRetry = true;

        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            userMessage = 'No camera found on this device';
            suggestions = [
                'Check if your device has a camera',
                'Try using a different device',
                'Use manual barcode entry instead'
            ];
            canRetry = false;

        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            userMessage = 'Camera is already in use';
            suggestions = [
                'Close other apps using the camera',
                'Close other browser tabs using camera',
                'Restart your browser and try again'
            ];
            canRetry = true;

        } else if (error.name === 'OverconstrainedError') {
            userMessage = 'Camera settings not compatible';
            suggestions = [
                'Your camera may not support the required settings',
                'Try a different browser',
                'Use manual barcode entry instead'
            ];
            canRetry = false;

        } else if (error.message.includes('not supported')) {
            userMessage = 'Camera not supported in this browser';
            suggestions = [
                'Try using Chrome, Firefox, or Safari',
                'Update your browser to the latest version',
                'Use manual barcode entry instead'
            ];
            canRetry = false;

        } else {
            userMessage = 'Camera access failed';
            suggestions = [
                'Check your camera permissions in browser settings',
                'Reload the page and try again',
                'Use manual barcode entry as alternative'
            ];
            canRetry = true;
        }

        return {
            success: false,
            error: {
                userMessage,
                technicalMessage,
                canRetry,
                suggestions,
                errorType: error.name || 'UnknownError'
            }
        };
    }

    async checkCameraAvailability() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === 'videoinput');
            
            return {
                available: cameras.length > 0,
                count: cameras.length,
                cameras: cameras.map(cam => ({
                    id: cam.deviceId,
                    label: cam.label || `Camera ${cameras.indexOf(cam) + 1}`
                }))
            };
        } catch (error) {
            return {
                available: false,
                count: 0,
                cameras: [],
                error: error.message
            };
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.hasPermission = false;
        }
    }

    async switchCamera(deviceId) {
        this.stopCamera();
        
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } }
            });
            
            return {
                success: true,
                stream: this.stream
            };
        } catch (error) {
            return this.handleCameraError(error);
        }
    }
}