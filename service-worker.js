// Nombre del caché. Incrementa este número cada vez que modifiques archivos CRÍTICOS (HTML, CSS, JS)
const CACHE_NAME = 'tacos-canasta-cache-v54';

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
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png'
];


// Evento 'install': Se activa cuando el Service Worker es instalado.
self.addEventListener('install', (event) => {
    // Espera hasta que el caché se abra y los archivos sean añadidos.
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Pre-caching de recursos.');
                // CORRECCIÓN CLAVE: El Service Worker solo puede cachear recursos de tu dominio.
                // Si Tailwind está en esta lista, dará CORS. Al usar solo los archivos de arriba, lo evitamos.
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                // Si ves este error, es porque algún archivo en urlsToCache no existe (404).
                console.error('Service Worker: Fallo al pre-cachear URLs:', error);
                // Muestra cuál URL falló si es posible
                // La línea 43 del error anterior está aquí:
                Promise.all(urlsToCache.map(url => fetch(url).catch(err => console.error(`Fallo al cargar URL: ${url}`, err))));
            })
    );
});

// Evento 'activate': Se activa después de la instalación.
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];

    // Limpia cachés antiguos que ya no son necesarios.
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
        })
    );
    // Asegura que el SW toma el control inmediatamente después de activarse
    return self.clients.claim();
});

// Evento 'fetch': Intercepta solicitudes de red. (Esta lógica está bien)
self.addEventListener('fetch', (event) => {
    // Estrategia: Cache, luego Network (Intenta usar el caché primero)
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Devuelve la respuesta del caché si está disponible
                if (response) {
                    return response;
                }
                // Si no está en caché, va a la red
                return fetch(event.request).then(
                    (response) => {
                        // Verifica si recibimos una respuesta válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clona la respuesta. Una respuesta es un stream y solo se puede consumir una vez.
                        const responseToCache = response.clone();

                        // Abre el caché y almacena la nueva respuesta
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                // No cachear solicitudes externas como Google Analytics o fuentes. (Aquí se excluyen automáticamente las CDN)
                                if (!event.request.url.includes('google-analytics') && !event.request.url.includes('googletagmanager')) {
                                    cache.put(event.request, responseToCache);
                                }
                            });

                        return response;
                    }
                );
            })
    );
});