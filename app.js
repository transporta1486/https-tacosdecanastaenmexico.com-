/**
 * app.js - Lógica de Interfaz, Cookies y Seguimiento PWA (Google Analytics 4)
 */

/**
 * Variable global para almacenar el evento de instalación (deferredPrompt).
 * CRÍTICA para que la instalación PWA funcione.
 */
let deferredPrompt;

const PWA_DISMISS_KEY = 'pwa_install_dismissed';
const PWA_DISMISS_DAYS = 14;

const isPWAInstalled = () =>
    window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

const isMobileViewport = () => window.matchMedia('(max-width: 767px)').matches;

const wasPWABannerDismissed = () => {
    const dismissedAt = localStorage.getItem(PWA_DISMISS_KEY);
    if (!dismissedAt) return false;
    const elapsed = Date.now() - Number(dismissedAt);
    return elapsed < PWA_DISMISS_DAYS * 24 * 60 * 60 * 1000;
};

// Función para enviar eventos personalizados a Google Analytics 4
const trackPWAInstallGA4 = (action) => {
    // Verifica que la función gtag esté disponible (Debe estar enlazada en el HTML)
    if (typeof gtag === 'function') {
        gtag('event', 'pwa_install', {
            'event_category': 'pwa',
            'event_label': action, // 'accepted', 'dismissed', 'installed', o 'shown'
            'non_interaction': true
        });
    }
};


document.addEventListener('DOMContentLoaded', () => {

    /* ======================================================= */
    /* 1. Menú Hamburguesa — Liquid Glass Nav v2.0 */
    /* ======================================================= */

    const navbarToggler = document.querySelector('.nav-glass__toggle');
    const menuPanel = document.getElementById('navbarNav');
    const siteNav = document.getElementById('siteNav');

    const closeNavMenu = () => {
        if (!menuPanel || !navbarToggler) return;
        menuPanel.classList.remove('nav-glass__panel--open');
        navbarToggler.classList.remove('nav-glass__toggle--active');
        navbarToggler.setAttribute('aria-expanded', 'false');
        navbarToggler.setAttribute('aria-label', 'Abrir menú de navegación');
        siteNav?.classList.remove('nav-glass--menu-open');
    };

    const openNavMenu = () => {
        if (!menuPanel || !navbarToggler) return;
        menuPanel.classList.add('nav-glass__panel--open');
        navbarToggler.classList.add('nav-glass__toggle--active');
        navbarToggler.setAttribute('aria-expanded', 'true');
        navbarToggler.setAttribute('aria-label', 'Cerrar menú de navegación');
        siteNav?.classList.add('nav-glass--menu-open');
    };

    if (navbarToggler && menuPanel) {
        navbarToggler.addEventListener('click', () => {
            if (menuPanel.classList.contains('nav-glass__panel--open')) {
                closeNavMenu();
            } else {
                openNavMenu();
            }
        });

        document.querySelectorAll('.nav-glass__link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 991) {
                    closeNavMenu();
                }
            });
        });

        siteNav?.addEventListener('click', (event) => {
            if (event.target === siteNav && siteNav.classList.contains('nav-glass--menu-open')) {
                closeNavMenu();
            }
        });

        document.addEventListener('click', (event) => {
            if (!menuPanel.classList.contains('nav-glass__panel--open') || window.innerWidth > 991) {
                return;
            }
            const target = event.target;
            if (navbarToggler.contains(target) || menuPanel.contains(target)) {
                return;
            }
            closeNavMenu();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && menuPanel.classList.contains('nav-glass__panel--open')) {
                closeNavMenu();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 991) {
                closeNavMenu();
            }
        });
    }

    /* ======================================================= */
    /* 1b. Brillo táctil en cristal del Hero */
    /* ======================================================= */

    const initHeroGlassTouch = () => {
        const panels = document.querySelectorAll(
            '.hero-premium__band, section#hero.hero:not(.hero-premium) > .container, .referencias-corporativas--apex .container-empresas, .seccion-dark--corp > .container-empresas, .tabla-paquetes--neo .paquete-card, .locations--neo .location-link'
        );
        if (!panels.length) return;

        const setShine = (panel, clientX, clientY, opacity) => {
            const rect = panel.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;

            const x = ((clientX - rect.left) / rect.width) * 100;
            const y = ((clientY - rect.top) / rect.height) * 100;

            panel.style.setProperty('--shine-x', `${Math.max(0, Math.min(100, x))}%`);
            panel.style.setProperty('--shine-y', `${Math.max(0, Math.min(100, y))}%`);
            panel.style.setProperty('--shine-o', String(opacity));
            panel.classList.toggle('hero-glass--touch', opacity > 0);
        };

        const clearShine = (panel) => setShine(panel, 0, 0, 0);

        panels.forEach((panel) => {
            panel.addEventListener('touchstart', (event) => {
                const touch = event.touches[0];
                if (touch) setShine(panel, touch.clientX, touch.clientY, 0.15);
            }, { passive: true });

            panel.addEventListener('touchmove', (event) => {
                const touch = event.touches[0];
                if (touch) setShine(panel, touch.clientX, touch.clientY, 0.18);
            }, { passive: true });

            panel.addEventListener('touchend', () => clearShine(panel), { passive: true });
            panel.addEventListener('touchcancel', () => clearShine(panel), { passive: true });

            panel.addEventListener('mousemove', (event) => {
                if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                    setShine(panel, event.clientX, event.clientY, 0.1);
                }
            });

            panel.addEventListener('mouseleave', () => clearShine(panel));
        });
    };

    initHeroGlassTouch();

    /* ======================================================= */
    /* 2. Funcionalidad del Banner de Cookies */
    /* ======================================================= */
    const cookieBanner = document.getElementById('cookieBanner');
    const acceptButton = document.getElementById('acceptCookies');
    const rejectButton = document.getElementById('rejectCookies');
    
    const setCookieConsent = (consent) => {
        const d = new Date();
        d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 año
        const expires = "expires=" + d.toUTCString();
        // Agregamos SameSite=Lax para mejor compatibilidad
        document.cookie = `cookie_consent=${consent};${expires};path=/;SameSite=Lax`; 
    };
    
    const getCookieConsent = () => {
        const cookies = document.cookie.split('; ').find(row => row.startsWith('cookie_consent='));
        return cookies ? cookies.split('=')[1] : "";
    };

    if (cookieBanner) {
        const consent = getCookieConsent();
        if (consent === "accepted" || consent === "rejected") {
            cookieBanner.classList.add('d-none'); 
        } else {
            cookieBanner.classList.remove('d-none'); 
        }
    }

    if (acceptButton) {
        acceptButton.addEventListener('click', () => {
            setCookieConsent("accepted");
            cookieBanner.classList.add('d-none');
        });
    }

    if (rejectButton) {
        rejectButton.addEventListener('click', () => {
            setCookieConsent("rejected");
            cookieBanner.classList.add('d-none');
        });
    }
    
    
    /* ======================================================= */
    /* 3. Funcionalidad del Banner de Instalación PWA y GA4 */
    /* ======================================================= */
    setupPWAInstallTracking();

    /* ======================================================= */
    /* 4. Canastatron (robot / globo) → abre widget Chatbase */
    /* ======================================================= */
    const canastaAILauncher = document.getElementById('canasta-ai-launcher');
    if (canastaAILauncher) {
        const canastaSphere = canastaAILauncher.querySelector('.canasta-ai-sphere');
        const canastaBubble = canastaAILauncher.querySelector('.canasta-ai-float__bubble');

        let engageHideTimer = null;

        const setCanastaEngaged = (active) => {
            canastaAILauncher.classList.toggle('canasta-ai-float--engaged', active);
            if (canastaBubble) {
                canastaBubble.setAttribute('aria-hidden', active ? 'false' : 'true');
            }
        };

        const scheduleEngageHide = (delayMs = 1400) => {
            clearTimeout(engageHideTimer);
            engageHideTimer = setTimeout(() => setCanastaEngaged(false), delayMs);
        };

        const cancelEngageHide = () => {
            clearTimeout(engageHideTimer);
        };

        const setSphereShine = (clientX, clientY, opacity) => {
            if (!canastaSphere) return;
            const rect = canastaSphere.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return;

            const x = ((clientX - rect.left) / rect.width) * 100;
            const y = ((clientY - rect.top) / rect.height) * 100;

            canastaSphere.style.setProperty('--sphere-shine-x', `${Math.max(0, Math.min(100, x))}%`);
            canastaSphere.style.setProperty('--sphere-shine-y', `${Math.max(0, Math.min(100, y))}%`);
            canastaSphere.style.setProperty('--sphere-shine-o', String(opacity));
            canastaSphere.classList.toggle('canasta-ai-sphere--touch', opacity > 0.08);
        };

        const clearSphereShine = () => {
            if (!canastaSphere) return;
            canastaSphere.style.setProperty('--sphere-shine-o', '0.22');
            canastaSphere.classList.remove('canasta-ai-sphere--touch');
        };

        if (canastaSphere) {
            canastaSphere.addEventListener('touchstart', (event) => {
                const touch = event.touches[0];
                if (touch) {
                    cancelEngageHide();
                    setCanastaEngaged(true);
                    setSphereShine(touch.clientX, touch.clientY, 0.18);
                }
            }, { passive: true });

            canastaSphere.addEventListener('touchmove', (event) => {
                const touch = event.touches[0];
                if (touch) {
                    cancelEngageHide();
                    setCanastaEngaged(true);
                    setSphereShine(touch.clientX, touch.clientY, 0.2);
                }
            }, { passive: true });

            canastaSphere.addEventListener('touchend', () => {
                clearSphereShine();
                scheduleEngageHide();
            }, { passive: true });

            canastaSphere.addEventListener('touchcancel', () => {
                clearSphereShine();
                scheduleEngageHide(400);
            }, { passive: true });

            canastaSphere.addEventListener('mouseenter', (event) => {
                cancelEngageHide();
                setCanastaEngaged(true);
                setSphereShine(event.clientX, event.clientY, 0.12);
            });

            canastaSphere.addEventListener('mousemove', (event) => {
                if (canastaAILauncher.classList.contains('canasta-ai-float--engaged')) {
                    setSphereShine(event.clientX, event.clientY, 0.15);
                }
            });

            canastaSphere.addEventListener('mouseleave', () => {
                clearSphereShine();
                scheduleEngageHide(200);
            });
        }

        const openChatbaseWidget = () => {
            try {
                if (window.chatbase && typeof window.chatbase.open === 'function') {
                    window.chatbase.open();
                } else if (typeof window.chatbase === 'function') {
                    window.chatbase('open');
                }
            } catch (_) {
                /* embed aún cargando */
            }
        };

        canastaAILauncher.addEventListener('click', (e) => {
            cancelEngageHide();
            setCanastaEngaged(true);
            e.preventDefault();
            openChatbaseWidget();
            scheduleEngageHide(2200);
            if (typeof gtag === 'function') {
                gtag('event', 'abrir_chat_canasta_ai', {
                    event_category: 'engagement',
                    event_label: 'chatbase'
                });
            }
        });

        canastaAILauncher.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openChatbaseWidget();
            }
        });
    }

    /* ======================================================= */
    /* 5. Intro cinematográfica → revelación Canastatron + balón */
    /* ======================================================= */
    const cineIntro = document.getElementById('cine-intro');
    const floatingCluster = document.querySelector('.floating-contact-cluster');
    const mundialBall = document.getElementById('mundial-ball');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const playBallIntro = () => {
        if (!mundialBall || prefersReducedMotion) {
            return;
        }
        mundialBall.classList.remove('ball-intro-play');
        void mundialBall.offsetWidth;
        mundialBall.classList.add('ball-intro-play');
    };

    if (floatingCluster) {
        const playCanastatronIntro = () => {
            const launcher = document.getElementById('canasta-ai-launcher');
            const bubble = launcher?.querySelector('.canasta-ai-float__bubble');

            if (!launcher || prefersReducedMotion) {
                playBallIntro();
                return;
            }

            floatingCluster.classList.add('floating-contact-cluster--intro');
            launcher.classList.add('canasta-ai-float--intro');
            document.body.classList.add('canastatron-intro-active');
            bubble?.setAttribute('aria-hidden', 'false');

            window.setTimeout(() => {
                const firstRect = floatingCluster.getBoundingClientRect();
                floatingCluster.classList.remove('floating-contact-cluster--intro');

                const lastRect = floatingCluster.getBoundingClientRect();
                const dx = (firstRect.left + firstRect.width / 2) - (lastRect.left + lastRect.width / 2);
                const dy = (firstRect.top + firstRect.height / 2) - (lastRect.top + lastRect.height / 2);

                floatingCluster.classList.add('floating-contact-cluster--intro-dock');
                floatingCluster.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
                floatingCluster.style.transformOrigin = 'center center';
                floatingCluster.style.transition = 'none';

                requestAnimationFrame(() => {
                    floatingCluster.style.transition = 'transform 1.4s cubic-bezier(0.33, 1, 0.45, 1)';
                    floatingCluster.style.transform = '';
                });

                window.setTimeout(() => {
                    document.body.classList.remove('canastatron-intro-active');
                    launcher.classList.add('canasta-ai-float--intro-out');
                    bubble?.setAttribute('aria-hidden', 'true');
                }, 750);

                window.setTimeout(() => {
                    launcher.classList.remove('canasta-ai-float--intro', 'canasta-ai-float--intro-out');
                    floatingCluster.classList.remove('floating-contact-cluster--intro-dock');
                    floatingCluster.style.transition = '';
                    floatingCluster.style.transform = '';
                    floatingCluster.style.transformOrigin = '';
                    playBallIntro();
                }, 1500);
            }, 3600);
        };

        const revealCanastron = () => {
            document.body.classList.remove('cine-intro-active');
            floatingCluster.classList.add('floating-contact-cluster--revealed');
            playCanastatronIntro();
        };

        if (cineIntro) {
            if (prefersReducedMotion) {
                cineIntro.remove();
                revealCanastron();
            } else {
                document.body.classList.add('cine-intro-active');

                setTimeout(() => {
                    cineIntro.classList.add('fade-out');
                    setTimeout(() => {
                        cineIntro.remove();
                        revealCanastron();
                    }, 650);
                }, 8800);
            }
        } else {
            revealCanastron();
        }
    }

    /* ======================================================= */
    /* 6. Micro-balón en CTAs y menú */
    /* ======================================================= */
    const ctaSelector = '.btn-warning, .btn-naranja, .btn-paquete, .btn-success, .nav-glass__link, .delivery-hero__cta, .delivery-product-card__cta, .delivery-sticky-bar__btn';

    const spawnButtonBall = (el) => {
        if (prefersReducedMotion) {
            return;
        }
        const rect = el.getBoundingClientRect();
        const pop = document.createElement('span');
        pop.className = 'mundial-ball-pop';
        pop.textContent = '⚽';
        pop.setAttribute('aria-hidden', 'true');
        pop.style.left = `${rect.left + rect.width / 2}px`;
        pop.style.top = `${rect.top + rect.height / 2}px`;
        document.body.appendChild(pop);
        requestAnimationFrame(() => pop.classList.add('mundial-ball-pop--active'));
        window.setTimeout(() => pop.remove(), 600);
    };

    document.addEventListener('click', (e) => {
        const target = e.target.closest(ctaSelector);
        if (target) {
            spawnButtonBall(target);
        }
    }, { passive: true });

    initCoverageSearch({
        inputId: 'footer-coverage-input',
        resultsId: 'footer-coverage-results',
        emptyId: 'footer-coverage-empty',
        staticListId: 'footer-coverage-static'
    });

    initCoverageSearch({
        inputId: 'hero-location-input',
        resultsId: 'hero-location-results',
        emptyId: 'hero-location-empty'
    });
});

/** Municipios con página de cobertura (SEO local). */
const FOOTER_COVERAGE_ZONES = [
    { name: 'Atizapán de Zaragoza', url: 'atizapan.html', keys: ['atizapan', 'atizapán'] },
    { name: 'Naucalpan de Juárez', url: 'naucalpan.html', keys: ['naucalpan'] },
    { name: 'Tlalnepantla de Baz', url: 'tlalnepantla.html', keys: ['tlalnepantla'] },
    { name: 'Cuautitlán Izcalli', url: 'cuatitlan-izcalli.html', keys: ['cuautitlan izcalli', 'izcalli'] },
    { name: 'Cuautitlán México', url: 'cuatitlan-mexico.html', keys: ['cuautitlan mexico', 'cuautitlán'] },
    { name: 'Tultitlán', url: 'tultitlan.html', keys: ['tultitlan', 'tultitlán'] },
    { name: 'Ecatepec de Morelos', url: 'ecatepec.html', keys: ['ecatepec'] },
    { name: 'Azcapotzalco', url: 'acapotzalco.html', keys: ['azcapotzalco'] },
    { name: 'Satélite', url: 'satelite.html', keys: ['satelite', 'satélite'] },
    { name: 'Nicolas Romero', url: 'nicolasromero.html', keys: ['nicolas romero', 'nicholas'] },
    { name: 'Tepotzotlán', url: 'tepotzotlan.html', keys: ['tepotzotlan', 'tepotzotlán'] },
    { name: 'Gustavo A. Madero', url: 'gustavo-a-madero.html', keys: ['gustavo a madero', 'g.a.m.'] },
    { name: 'Miguel Hidalgo', url: 'miguel-hidalgo.html', keys: ['miguel hidalgo'] },
    { name: 'Benito Juárez', url: 'benito-juarez.html', keys: ['benito juarez', 'benito juárez'] },
    { name: 'Coyoacán', url: 'coyoacan.html', keys: ['coyoacan', 'coyoacán'] }
];

const normalizeCoverageQuery = (value) =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/**
 * Filtra municipios de cobertura en buscadores del sitio.
 */
const initCoverageSearch = ({ inputId, resultsId, emptyId, staticListId }) => {
    const input = document.getElementById(inputId);
    const results = document.getElementById(resultsId);
    const empty = emptyId ? document.getElementById(emptyId) : null;
    const staticList = staticListId ? document.getElementById(staticListId) : null;

    if (!input || !results) {
        return;
    }

    const renderResults = (matches) => {
        results.innerHTML = '';
        if (matches.length === 0) {
            results.classList.remove('is-visible');
            if (empty) {
                empty.classList.add('is-visible');
            }
            if (staticList) {
                staticList.style.display = 'none';
            }
            return;
        }

        if (empty) {
            empty.classList.remove('is-visible');
        }
        if (staticList) {
            staticList.style.display = 'none';
        }

        matches.forEach((zone) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = zone.url;
            a.textContent = zone.name;
            li.appendChild(a);
            results.appendChild(li);
        });
        results.classList.add('is-visible');
    };

    const filterZones = () => {
        const query = normalizeCoverageQuery(input.value);
        if (!query) {
            results.classList.remove('is-visible');
            results.innerHTML = '';
            if (empty) {
                empty.classList.remove('is-visible');
            }
            if (staticList) {
                staticList.style.display = '';
            }
            return;
        }

        const matches = FOOTER_COVERAGE_ZONES.filter((zone) => {
            const name = normalizeCoverageQuery(zone.name);
            if (name.includes(query)) {
                return true;
            }
            return zone.keys.some((key) => key.includes(query) || query.includes(key));
        });

        renderResults(matches);
    };

    input.addEventListener('input', filterZones, { passive: true });
    input.addEventListener('search', filterZones, { passive: true });
};

/** @deprecated Usar initCoverageSearch */
const initFooterCoverageSearch = () => initCoverageSearch({
    inputId: 'footer-coverage-input',
    resultsId: 'footer-coverage-results',
    emptyId: 'footer-coverage-empty',
    staticListId: 'footer-coverage-static'
});


/**
 * Configura el Service Worker y el Banner de Instalación PWA.
 */
const setupPWAInstallTracking = () => {
    const installBanner = document.getElementById('pwa-install-banner');
    const installButton = document.getElementById('pwa-install-button');
    const closeButton = document.getElementById('pwa-close-button');

    // 1. Registro del Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
             // Registrar el archivo correcto del service worker del proyecto
             navigator.serviceWorker.register('/service-worker.js') 
                 .then(reg => console.log('Service Worker registrado con éxito:', reg))
                 .catch(err => console.error('Fallo el registro del Service Worker:', err));
        });
    }

    const showPWAInstallBanner = () => {
        if (!installBanner || isPWAInstalled() || wasPWABannerDismissed() || !isMobileViewport()) return;
        installBanner.classList.add('visible');
        trackPWAInstallGA4('shown_custom_banner');
    };

    // 2. Escucha el evento 'beforeinstallprompt'
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showPWAInstallBanner();
    });

    // 3. Manejar el botón de instalación del banner (CRÍTICO: llama a prompt())
    if (installButton) {
        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                installBanner.classList.remove('visible');
                
                // Muestra el prompt nativo del navegador
                deferredPrompt.prompt(); 
                
                const choiceResult = await deferredPrompt.userChoice;
                
                if (choiceResult.outcome === 'accepted') {
                    // EVENTO GA4: El usuario aceptó el prompt de instalación del navegador
                    trackPWAInstallGA4('accepted');
                } else {
                    // EVENTO GA4: El usuario cerró el prompt de instalación del navegador
                    trackPWAInstallGA4('dismissed');
                }
                deferredPrompt = null;
            }
        });
    }

    // 4. Manejar el botón de cerrar del banner customizado
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            installBanner.classList.remove('visible');
            localStorage.setItem(PWA_DISMISS_KEY, String(Date.now()));
            trackPWAInstallGA4('closed_custom_banner');
        });
    }

    // 5. Escucha el evento 'appinstalled' (Instalación Exitosa)
    window.addEventListener('appinstalled', (event) => {
        
        // Ocultar el banner si se instala
        if (installBanner) {
            installBanner.classList.remove('visible'); 
        }
        
        // EVENTO GA4: Instalación exitosa
        trackPWAInstallGA4('installed'); 
    });
};