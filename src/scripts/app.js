class MobileNetApp {
    constructor() {
        this.classifier = new ImageClassifier();
        this.ui = new UIManager();
        this.currentFile = null;
        
        this.init();
    }
    
    async init() {
        try {
            this.setupEventListeners();
            await this.loadHistory();
            await this.preloadModel();
        } catch (error) {
            console.error('App initialization failed:', error);
            this.ui.showError('Failed to initialize app');
        }
    }
    
    setupEventListeners() {
        const imageInput = document.getElementById('imageInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const classifyBtn = document.getElementById('classifyBtn');
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        const exportHistoryBtn = document.getElementById('exportHistoryBtn');
        const dropZone = document.getElementById('dropZone');
        
        // Debug logging
        console.log('Setting up event listeners...');
        console.log('Upload button found:', !!uploadBtn);
        console.log('Image input found:', !!imageInput);
        
        // Upload button click handler
        if (uploadBtn && imageInput) {
            uploadBtn.addEventListener('click', (e) => {
                console.log('Upload button clicked');
                e.preventDefault();
                imageInput.click();
            });
        }
        
        // File input change handler
        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                console.log('File input changed');
                if (e.target.files && e.target.files[0]) {
                    console.log('File selected:', e.target.files[0].name);
                    this.handleImageUpload(e.target.files[0]);
                }
            });
        }
        
        classifyBtn?.addEventListener('click', () => {
            this.classifyCurrentImage();
        });
        
        clearHistoryBtn?.addEventListener('click', () => {
            this.clearHistory();
        });
        
        exportHistoryBtn?.addEventListener('click', () => {
            this.exportHistory();
        });
        
        // Drop zone event handlers
        if (dropZone) {
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files && files[0]) {
                    console.log('File dropped:', files[0].name);
                    this.handleImageUpload(files[0]);
                }
            });
            
            dropZone.addEventListener('click', (e) => {
                console.log('Drop zone clicked');
                if (imageInput && e.target.closest('.drop-zone')) {
                    imageInput.click();
                }
            });
        }
    }
    
    async preloadModel() {
        try {
            await this.classifier.modelManager.loadModel();
        } catch (error) {
            console.error('Model preloading failed:', error);
            this.ui.showError('Failed to load AI model');
        }
    }
    
    async handleImageUpload(file) {
        try {
            console.log('Handling image upload:', file.name, file.type, file.size);
            this.currentFile = file;
            
            this.classifier.imageProcessor.validateImage(file);
            console.log('Image validation passed');
            
            const preview = await this.classifier.imageProcessor.createPreviewData(file);
            console.log('Preview data created');
            
            this.ui.showImagePreview(preview);
            console.log('Image preview shown');
        } catch (error) {
            console.error('Image upload failed:', error);
            this.ui.showError(error.message);
        }
    }
    
    async classifyCurrentImage() {
        if (!this.currentFile) {
            this.ui.showError('No image selected');
            return;
        }
        
        try {
            this.ui.showLoading(true, 'Classifying Image', 'AI is analyzing your image...');
            
            const result = await this.classifier.classifyImage(this.currentFile);
            
            this.ui.showResults(result);
            await this.loadHistory();
            
        } catch (error) {
            console.error('Classification failed:', error);
            this.ui.showError(error.message);
        } finally {
            this.ui.showLoading(false);
        }
    }
    
    async loadHistory() {
        try {
            const history = await this.classifier.getClassificationHistory(10);
            this.ui.renderHistory(history);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }
    
    async clearHistory() {
        if (confirm('Are you sure you want to clear all classification history?')) {
            try {
                await this.classifier.clearHistory();
                await this.loadHistory();
            } catch (error) {
                console.error('Failed to clear history:', error);
                this.ui.showError('Failed to clear history');
            }
        }
    }
    
    async exportHistory() {
        try {
            await this.classifier.exportHistory();
        } catch (error) {
            console.error('Failed to export history:', error);
            this.ui.showError('Failed to export history');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new MobileNetApp();
});