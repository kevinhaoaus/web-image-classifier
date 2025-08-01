class ImageClassifier {
    constructor() {
        this.modelManager = new MobileNetManager();
        this.imageProcessor = new ImageProcessor();
        this.storage = new OfflineStorage();
        this.isProcessing = false;
    }
    
    async classifyImage(imageFile) {
        if (this.isProcessing) {
            throw new Error('Classification already in progress');
        }
        
        this.isProcessing = true;
        
        try {
            this.imageProcessor.validateImage(imageFile);
            const preview = await this.imageProcessor.createPreviewData(imageFile);
            
            const classificationResult = await this.modelManager.classifyImage(
                preview.originalElement, 
                5
            );
            
            const result = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                imageInfo: preview.fileInfo,
                imageDataUrl: preview.dataUrl,
                ...classificationResult
            };
            
            await this.storage.saveClassificationResult(result);
            
            return result;
            
        } catch (error) {
            console.error('Classification failed:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }
    
    async batchClassify(imageFiles, onProgress = null) {
        const results = [];
        const total = imageFiles.length;
        
        for (let i = 0; i < total; i++) {
            try {
                const result = await this.classifyImage(imageFiles[i]);
                results.push({ success: true, result });
            } catch (error) {
                results.push({
                    success: false,
                    filename: imageFiles[i].name,
                    error: error.message
                });
            }
            
            if (onProgress) {
                onProgress({
                    completed: i + 1,
                    total: total,
                    percentage: Math.round(((i + 1) / total) * 100)
                });
            }
        }
        
        return results;
    }
    
    async getClassificationHistory(limit = 20) {
        return await this.storage.getClassificationHistory(limit);
    }
    
    async clearHistory() {
        return await this.storage.clearHistory();
    }
    
    async exportHistory() {
        const history = await this.getClassificationHistory(100);
        
        const exportData = {
            exportDate: new Date().toISOString(),
            totalClassifications: history.length,
            classifications: history.map(item => ({
                timestamp: item.timestamp,
                topPrediction: item.predictions[0].className,
                confidence: item.predictions[0].confidence,
                allPredictions: item.predictions,
                inferenceTime: item.inferenceTime,
                imageInfo: item.imageInfo
            }))
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = `classification-history-${new Date().toISOString().split('T')[0]}.json`;
        downloadLink.click();
        
        URL.revokeObjectURL(downloadLink.href);
    }
}