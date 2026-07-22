// Nombre del caché. Incrementa este número cada vez que modifiques archivos CRÍTICOS (HTML, CSS, JS)
const CACHE_NAME = 'tacos-canasta-cache-v67';

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Lista de archivos para precachear (CRÍTICO: Incluye todos los HTML, CSS, JS y recursos principales)
const urlsToCache = [
    // Archivos de la raíz y principales
    '/',
    '/index.html',
    '/styles.css',
    '/navbar-glass.css',
    '/faq-glass.css',
    '/menu-glass.css',
    '/trust-glass.css',
    '/empresas-glass.css',
    '/paquetes-glass.css',
    '/zonas-glass.css',
    '/canastatron-sphere.css',
    '/hero-glass-fx.css',
    '/hero-premium.css',
    '/footer-glass.css',
    '/glass-clear.css',
    '/type-unify.css',
    '/delivery-ui.css',
    '/privacidad.html',
    '/terminos.html',
    '/app.js',
    '/whatsapp.js',
    '/manifest.json',

    // Imagen principal (Debes asegurarte que este archivo existe y está en la raíz)
    // Si la imagen de fondo de tu Hero se llama 'hero-bg.jpeg', cámbialo a eso:
    '/hero-bg.jpeg',
    '/img/robot-canasta.jpeg',

    // Páginas localizadas (CRÍTICO: Deben existir todas estas URLs)
    '/atizapan.html',
    '/cuautitlan.html',
    '/tlalnepantla.html',
    '/naucalpan.html',
    '/izcalli.html',
    '/tultitlan.html',
    '/azcapotzalco.html',
    '/ecatepec.html',
    '/nicolas-romero.html',
    '/gustavo-a-madero.html',
    '/tepotzotlan.html',
    // ... Si tienes más zonas, agrégalas aquí ...

    // Íconos PWA (Deben coincidir con los de manifest.json y deben existir en la carpeta /icons/)
    '/icons/icon-32x32.png',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-180x180.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    '/icons/icon-maskable-512x512.png'
];

const isCriticalAsset = (url) => {
    try {
        const path = new URL(url).pathname;
        return (
            path === '/' ||
            path.endsWith('.html') ||
            path.endsWith('.js') ||
            path.endsWith('.css') ||
            path.endsWith('/service-worker.js')
        );
    } catch (_) {
        return false;
    }
};

// Evento 'install': Se activa cuando el Service Worker es instalado.
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Pre-caching de recursos.');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Service Worker: Fallo al pre-cachear URLs:', error);
                return Promise.all(
                    urlsToCache.map((url) => fetch(url).catch((err) => console.error(`Fallo al cargar URL: ${url}`, err)))
                );
            })
    );
});

// Evento 'activate': Se activa después de la instalación.
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Limpiando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// HTML/CSS/JS: red primero (evita overlay/chat viejos pegados en caché).
// Resto: cache-first.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const requestUrl = event.request.url;

    if (isCriticalAsset(requestUrl)) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                if (
                    !requestUrl.includes('google-analytics') &&
                    !requestUrl.includes('googletagmanager') &&
                    !requestUrl.includes('chatbase')
                ) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                }
                return response;
            });
        })
    );
});
