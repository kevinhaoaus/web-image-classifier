class MobileNetManager {
    constructor() {
        this.model = null;
        this.isLoading = false;
        this.loadingCallbacks = [];
    }
    
    async loadModel() {
        if (this.model) {
            return this.model;
        }
        
        if (this.isLoading) {
            return new Promise((resolve) => {
                this.loadingCallbacks.push(resolve);
            });
        }
        
        this.isLoading = true;
        this.updateStatus('Downloading MobileNet model...');
        
        try {
            this.model = await mobilenet.load({
                version: 2,
                alpha: 1.0,
                modelUrl: undefined
            });
            
            this.updateStatus('✅ Model ready for classification');
            console.log('MobileNet loaded successfully');
            
            this.loadingCallbacks.forEach(callback => callback(this.model));
            this.loadingCallbacks = [];
            
            return this.model;
            
        } catch (error) {
            this.updateStatus('❌ Failed to load model');
            console.error('MobileNet loading error:', error);
            throw new Error(`Failed to load MobileNet: ${error.message}`);
        } finally {
            this.isLoading = false;
        }
    }
    
    async classifyImage(imageElement, topK = 5) {
        if (!this.model) {
            await this.loadModel();
        }
        
        try {
            const startTime = performance.now();
            
            const predictions = await this.model.classify(imageElement, topK);
            
            const inferenceTime = performance.now() - startTime;
            
            const formattedPredictions = predictions.map((pred, index) => ({
                rank: index + 1,
                className: pred.className,
                probability: pred.probability,
                confidence: (pred.probability * 100).toFixed(2)
            }));
            
            return {
                predictions: formattedPredictions,
                inferenceTime: Math.round(inferenceTime),
                modelInfo: {
                    name: 'MobileNet v2',
                    version: '2.1.0',
                    size: '~16MB'
                }
            };
            
        } catch (error) {
            console.error('Classification error:', error);
            throw new Error(`Classification failed: ${error.message}`);
        }
    }
    
    updateStatus(message) {
        const statusElement = document.getElementById('modelStatus');
        if (statusElement) {
            const indicator = statusElement.querySelector('.status-indicator');
            const text = statusElement.querySelector('.status-text');
            
            if (message.includes('✅')) {
                indicator.className = 'status-indicator ready';
            } else if (message.includes('❌')) {
                indicator.className = 'status-indicator error';
            } else {
                indicator.className = 'status-indicator loading';
            }
            
            text.textContent = message;
        }
        
        window.dispatchEvent(new CustomEvent('modelStatusUpdate', {
            detail: { message, timestamp: Date.now() }
        }));
    }
    
    getModelInfo() {
        return {
            loaded: !!this.model,
            loading: this.isLoading,
            framework: 'TensorFlow.js',
            model: 'MobileNet v2',
            inputSize: '224x224x3',
            outputClasses: 1000
        };
    }
}