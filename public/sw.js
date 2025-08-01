const CACHE_NAME = 'mobilenet-classifier-v1.0.0';
const STATIC_CACHE = 'static-assets-v1';
const DYNAMIC_CACHE = 'dynamic-content-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/src/styles/main.css',
    '/src/styles/components.css',
    '/src/styles/animations.css',
    '/src/scripts/app.js',
    '/src/scripts/modelManager.js',
    '/src/scripts/imageProcessor.js',
    '/src/scripts/classifier.js',
    '/src/scripts/storage.js',
    '/src/scripts/ui.js',
    '/src/scripts/constants.js',
    '/manifest.json'
];

const TF_ASSETS = [
    'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js',
    'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js'
];

self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then((cache) => {
                return cache.addAll(STATIC_ASSETS);
            }),
            caches.open(DYNAMIC_CACHE).then((cache) => {
                return cache.addAll(TF_ASSETS);
            })
        ]).then(() => {
            console.log('Static assets cached successfully');
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                    .map((name) => {
                        console.log('Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('Cache cleanup completed');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    if (STATIC_ASSETS.includes(url.pathname) || url.pathname === '/') {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                return cachedResponse || fetch(request).then((networkResponse) => {
                    if (networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(STATIC_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return networkResponse;
                });
            }).catch(() => {
                if (url.pathname === '/' || url.pathname.endsWith('.html')) {
                    return caches.match('/index.html');
                }
            })
        );
    }
    
    else if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('tensorflow')) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                return cachedResponse || fetch(request).then((networkResponse) => {
                    if (networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return networkResponse;
                });
            })
        );
    }
    
    else {
        event.respondWith(
            fetch(request).catch(() => {
                return caches.match(request);
            })
        );
    }
});