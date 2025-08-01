class UIManager {
    constructor() {
        this.elements = this.getElements();
        this.setupInteractions();
    }
    
    getElements() {
        return {
            dropZone: document.getElementById('dropZone'),
            imagePreview: document.getElementById('imagePreview'),
            previewImg: document.getElementById('previewImg'),
            imageInfo: document.getElementById('imageInfo'),
            classifyBtn: document.getElementById('classifyBtn'),
            resetBtn: document.getElementById('resetBtn'),
            resultsSection: document.getElementById('resultsSection'),
            predictionsList: document.getElementById('predictionsList'),
            confidenceChart: document.getElementById('confidenceChart'),
            inferenceStats: document.getElementById('inferenceStats'),
            historyGrid: document.getElementById('historyGrid'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            errorToast: document.getElementById('errorToast')
        };
    }
    
    setupInteractions() {
        this.elements.dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.add('drag-over');
        });
        
        this.elements.dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (!this.elements.dropZone.contains(e.relatedTarget)) {
                this.elements.dropZone.classList.remove('drag-over');
            }
        });
        
        this.elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        this.elements.resetBtn?.addEventListener('click', () => {
            this.resetUpload();
        });
        
        this.elements.errorToast?.querySelector('#errorClose')?.addEventListener('click', () => {
            this.hideError();
        });
    }
    
    showImagePreview(preview) {
        this.elements.previewImg.src = preview.dataUrl;
        
        this.elements.imageInfo.innerHTML = `
            <div class="image-meta">
                <div class="meta-item">
                    <span class="meta-label">File:</span>
                    <span class="meta-value">${preview.fileInfo.name}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Size:</span>
                    <span class="meta-value">${preview.fileInfo.size}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Dimensions:</span>
                    <span class="meta-value">${preview.fileInfo.dimensions}</span>
                </div>
            </div>
        `;
        
        this.elements.imagePreview.style.display = 'block';
        this.elements.dropZone.style.display = 'none';
        this.elements.classifyBtn.disabled = false;
    }
    
    showResults(result) {
        this.elements.predictionsList.innerHTML = '';
        
        result.predictions.forEach((pred, index) => {
            const predCard = document.createElement('div');
            predCard.className = `prediction-card rank-${index + 1}`;
            predCard.innerHTML = `
                <div class="prediction-header">
                    <span class="prediction-rank">#${pred.rank}</span>
                    <span class="prediction-confidence">${pred.confidence}%</span>
                </div>
                <div class="prediction-class">${pred.className}</div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${pred.confidence}%"></div>
                </div>
            `;
            this.elements.predictionsList.appendChild(predCard);
        });
        
        this.elements.inferenceStats.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Inference Time</span>
                    <span class="stat-value">${result.inferenceTime}ms</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Model</span>
                    <span class="stat-value">${result.modelInfo.name}</span>
                </div>
            </div>
        `;
        
        this.elements.resultsSection.style.display = 'block';
        this.elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    showLoading(show, title = 'Processing', message = 'Please wait...') {
        if (show) {
            document.getElementById('loadingTitle').textContent = title;
            document.getElementById('loadingMessage').textContent = message;
            this.elements.loadingOverlay.style.display = 'flex';
        } else {
            this.elements.loadingOverlay.style.display = 'none';
        }
    }
    
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        this.elements.errorToast.style.display = 'block';
        
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }
    
    hideError() {
        this.elements.errorToast.style.display = 'none';
    }
    
    resetUpload() {
        this.elements.imagePreview.style.display = 'none';
        this.elements.dropZone.style.display = 'block';
        this.elements.resultsSection.style.display = 'none';
        
        document.getElementById('imageInput').value = '';
        this.elements.dropZone.classList.remove('drag-over');
        this.elements.classifyBtn.disabled = true;
    }
    
    async renderHistory(historyItems) {
        this.elements.historyGrid.innerHTML = '';
        
        if (historyItems.length === 0) {
            this.elements.historyGrid.innerHTML = `
                <div class="empty-history">
                    <div class="empty-icon">📷</div>
                    <h3>No Classifications Yet</h3>
                    <p>Upload an image to get started!</p>
                </div>
            `;
            return;
        }
        
        historyItems.forEach(item => {
            const historyCard = document.createElement('div');
            historyCard.className = 'history-card';
            historyCard.innerHTML = `
                <div class="history-image">
                    <img src="${item.imageDataUrl}" alt="Classified image" loading="lazy">
                </div>
                <div class="history-content">
                    <div class="history-prediction">
                        <h4>${item.predictions[0].className}</h4>
                        <span class="history-confidence">${item.predictions[0].confidence}% confident</span>
                    </div>
                    <div class="history-meta">
                        <span class="history-date">${this.formatRelativeTime(item.timestamp)}</span>
                        <span class="history-speed">${item.inferenceTime}ms</span>
                    </div>
                </div>
            `;
            this.elements.historyGrid.appendChild(historyCard);
        });
    }
    
    formatRelativeTime(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    }
}