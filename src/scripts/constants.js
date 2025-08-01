const CONFIG = {
    MODEL: {
        VERSION: 2,
        ALPHA: 1.0,
        TOP_PREDICTIONS: 5
    },
    
    IMAGE: {
        MAX_FILE_SIZE: 10 * 1024 * 1024,
        SUPPORTED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        MAX_DISPLAY_SIZE: 400
    },
    
    STORAGE: {
        MAX_HISTORY_ITEMS: 100,
        DB_NAME: 'MobileNetClassifierDB',
        DB_VERSION: 1
    },
    
    UI: {
        LOADING_TIMEOUT: 30000,
        ERROR_TIMEOUT: 5000,
        ANIMATION_DURATION: 300
    }
};