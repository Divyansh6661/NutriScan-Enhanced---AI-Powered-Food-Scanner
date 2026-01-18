class BarcodeScanner {
    constructor() {
        this.isScanning = false;
        this.onBarcodeDetected = null;
        this.lastDetectedBarcode = null;
        this.lastDetectionTime = 0;
        this.detectionCooldown = 2000; // 2 seconds between detections
    }

    async startScanning(canvasElement, onDetected) {
        this.onBarcodeDetected = onDetected;

        try {
            // Add scanning class to container
            const container = canvasElement.parentElement;
            container.classList.add('scanning');
            
            await this.initQuagga(container);
            this.isScanning = true;
            return true;
        } catch (error) {
            console.error('Failed to start scanning:', error);
            throw error;
        }
    }

    stopScanning() {
        if (this.isScanning) {
            try {
                Quagga.stop();
                this.isScanning = false;
                this.lastDetectedBarcode = null;
                this.lastDetectionTime = 0;
                
                // Remove scanning class
                const container = document.querySelector('.scanner-container');
                if (container) {
                    container.classList.remove('scanning');
                }
            } catch (error) {
                console.error('Error stopping scanner:', error);
            }
        }
    }

    async initQuagga(container) {
        return new Promise((resolve, reject) => {
            Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: container,
                    constraints: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: "environment",
                        aspectRatio: { ideal: 16/9 }
                    },
                    area: { // Define scanning area
                        top: "20%",
                        right: "10%",
                        left: "10%",
                        bottom: "20%"
                    }
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                numOfWorkers: 4,
                frequency: 10, // Back to 10 for faster detection
                decoder: {
                    readers: [
                        "ean_reader",
                        "ean_8_reader",
                        "code_128_reader",
                        "code_39_reader",
                        "upc_reader",
                        "upc_e_reader"
                    ],
                    debug: {
                        drawBoundingBox: true,
                        showFrequency: false,
                        drawScanline: true,
                        showPattern: false
                    },
                    multiple: false
                },
                locate: true
            }, (err) => {
                if (err) {
                    console.error('Quagga initialization error:', err);
                    reject(err);
                    return;
                }

                console.log('✅ Quagga initialized successfully');
                
                // Setup detection handler BEFORE starting
                Quagga.onDetected((data) => {
                    console.log('📸 Barcode detection event fired!', data);
                    this.handleDetection(data);
                });
                
                // Add processed handler to monitor scanning
                let frameCount = 0;
                Quagga.onProcessed((result) => {
                    frameCount++;
                    if (frameCount % 30 === 0) { // Log every 30 frames
                        console.log(`🎬 Processing frames... (${frameCount} frames processed)`);
                        if (result && result.boxes) {
                            console.log(`📦 Found ${result.boxes.length} potential barcode boxes`);
                        }
                    }
                });
                
                Quagga.start();
                console.log('✅ Quagga started, listening for barcodes...');
                console.log('💡 TIP: Hold barcode 15-30cm from camera, keep steady for 3 seconds');

                resolve();
            });
        });
    }

    handleDetection(data) {
        if (!this.onBarcodeDetected || !data.codeResult) {
            return;
        }

        const barcode = data.codeResult.code;
        
        // Log ALL detections for debugging
        console.log(`🔍 RAW DETECTION: "${barcode}" (length: ${barcode.length})`);
        
        const confidence = data.codeResult.decodedCodes
            ? data.codeResult.decodedCodes.reduce((sum, code) => sum + (code.error || 0), 0) / data.codeResult.decodedCodes.length
            : 1;
        
        console.log(`📊 Confidence: ${((1-confidence)*100).toFixed(1)}%`);
        
        const now = Date.now();

        // TEMPORARILY DISABLED - Accept all confidence levels for testing
        // if (confidence > 0.1) {
        //     console.log(`⚠️ Low confidence barcode ignored: ${barcode} (confidence: ${(1-confidence)*100}%)`);
        //     return;
        // }

        // Ignore if same barcode detected recently (cooldown)
        if (barcode === this.lastDetectedBarcode && 
            (now - this.lastDetectionTime) < this.detectionCooldown) {
            console.log('⏱️ Cooldown active, ignoring duplicate');
            return;
        }

        // Validate barcode format
        if (!this.isValidBarcode(barcode)) {
            console.log('❌ Invalid barcode format:', barcode);
            return;
        }

        // Update tracking
        this.lastDetectedBarcode = barcode;
        this.lastDetectionTime = now;

        console.log(`✅ Valid barcode detected: ${barcode} (confidence: ${((1-confidence)*100).toFixed(1)}%)`);
        
        // Show visual feedback
        this.showDetectionFeedback(barcode);

        // Callback to main app
        this.onBarcodeDetected(barcode);
    }

    isValidBarcode(barcode) {
        if (!barcode || typeof barcode !== 'string') {
            console.log('❌ Empty or non-string barcode');
            return false;
        }

        // Must be numeric
        if (!/^\d+$/.test(barcode)) {
            console.log('❌ Not numeric:', barcode);
            return false;
        }

        // RELAXED VALIDATION FOR TESTING
        // Accept 8, 12, 13, 14 digit barcodes
        const validLengths = [8, 12, 13, 14];
        
        if (!validLengths.includes(barcode.length)) {
            console.log(`❌ Invalid length (${barcode.length}):`, barcode, '- Need 8, 12, 13, or 14 digits');
            return false;
        }

        // TEMPORARILY SKIP CHECKSUM VALIDATION
        console.log(`✅ Basic validation passed for ${barcode.length}-digit barcode`);
        return true;

        // // Additional checksum validation for EAN-13
        // if (barcode.length === 13) {
        //     if (!this.validateEAN13Checksum(barcode)) {
        //         console.log('❌ Invalid EAN-13 checksum:', barcode);
        //         return false;
        //     }
        // }

        // // Validate UPC-A checksum
        // if (barcode.length === 12) {
        //     if (!this.validateUPCAChecksum(barcode)) {
        //         console.log('❌ Invalid UPC-A checksum:', barcode);
        //         return false;
        //     }
        // }

        // return true;
    }

    // EAN-13 checksum validation
    validateEAN13Checksum(barcode) {
        const digits = barcode.split('').map(Number);
        const checkDigit = digits.pop();
        
        let sum = 0;
        for (let i = 0; i < digits.length; i++) {
            sum += digits[i] * (i % 2 === 0 ? 1 : 3);
        }
        
        const calculatedCheck = (10 - (sum % 10)) % 10;
        return calculatedCheck === checkDigit;
    }

    // UPC-A checksum validation
    validateUPCAChecksum(barcode) {
        const digits = barcode.split('').map(Number);
        const checkDigit = digits.pop();
        
        let sum = 0;
        for (let i = 0; i < digits.length; i++) {
            sum += digits[i] * (i % 2 === 0 ? 3 : 1);
        }
        
        const calculatedCheck = (10 - (sum % 10)) % 10;
        return calculatedCheck === checkDigit;
    }

    showDetectionFeedback(barcode) {
        // Add visual feedback in the scanner overlay
        const overlay = document.getElementById('scanner-overlay');
        if (!overlay) return;

        const feedback = document.createElement('div');
        feedback.className = 'barcode-detected';
        feedback.innerHTML = `✓ Barcode Detected!<br><span style="font-size: 1.2em; font-weight: bold;">${barcode}</span>`;
        overlay.appendChild(feedback);

        // Vibrate if supported
        if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }

        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }

    // Helper method to get supported formats
    getSupportedFormats() {
        return [
            'EAN-13',    // European Article Number (most common)
            'EAN-8',     // Short EAN
            'UPC-A',     // Universal Product Code (USA)
            'UPC-E',     // Short UPC
            'Code 128',  // General retail
            'Code 39'    // Industrial/logistics
        ];
    }
}