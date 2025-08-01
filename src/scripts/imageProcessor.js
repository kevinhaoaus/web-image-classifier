class ImageProcessor {
    constructor() {
        this.maxFileSize = 10 * 1024 * 1024;
        this.supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        this.maxDisplaySize = 400;
    }
    
    validateImage(file) {
        const errors = [];
        
        if (!file) {
            errors.push('No file selected');
        }
        
        if (file && !this.supportedTypes.includes(file.type)) {
            errors.push('Unsupported format. Use JPEG, PNG, WebP, or GIF');
        }
        
        if (file && file.size > this.maxFileSize) {
            errors.push(`File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`);
        }
        
        if (file && file.size === 0) {
            errors.push('Empty file detected');
        }
        
        if (errors.length > 0) {
            throw new Error(errors.join('. '));
        }
        
        return true;
    }
    
    async createImageElement(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(img);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Failed to load image'));
            };
            
            img.crossOrigin = 'anonymous';
            img.src = objectUrl;
        });
    }
    
    async createPreviewData(file) {
        const img = await this.createImageElement(file);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const scale = Math.min(
            this.maxDisplaySize / img.width,
            this.maxDisplaySize / img.height,
            1
        );
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        return {
            dataUrl: canvas.toDataURL('image/jpeg', 0.85),
            originalElement: img,
            fileInfo: {
                name: file.name,
                size: this.formatFileSize(file.size),
                type: file.type,
                dimensions: `${img.width} × ${img.height}`,
                lastModified: new Date(file.lastModified).toLocaleDateString()
            }
        };
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    async processMultipleImages(files) {
        const results = [];
        
        for (let i = 0; i < files.length; i++) {
            try {
                this.validateImage(files[i]);
                const preview = await this.createPreviewData(files[i]);
                results.push({
                    success: true,
                    file: files[i],
                    preview: preview
                });
            } catch (error) {
                results.push({
                    success: false,
                    file: files[i],
                    error: error.message
                });
            }
        }
        
        return results;
    }
}