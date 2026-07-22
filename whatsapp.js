/**
 * whatsapp.js — Enlaces y mensajes inteligentes de WhatsApp
 */
(function () {
    const WHATSAPP_PHONE = '525588180117';
    const MIN_PEOPLE = 20;
    const TACOS_PER_PERSON = 5;

    const MUNICIPALITY_BY_PAGE = {
        'index.html': 'CDMX y Estado de México',
        'acapotzalco.html': 'Azcapotzalco',
        'atizapan.html': 'Atizapán de Zaragoza',
        'benito-juarez.html': 'Benito Juárez',
        'coyoacan.html': 'Coyoacán',
        'cuatitlan-izcalli.html': 'Cuautitlán Izcalli',
        'cuatitlan-mexico.html': 'Cuautitlán',
        'ecatepec.html': 'Ecatepec',
        'gustavo-a-madero.html': 'Gustavo A. Madero',
        'miguel-hidalgo.html': 'Miguel Hidalgo',
        'naucalpan.html': 'Naucalpan',
        'nicolasromero.html': 'Nicolás Romero',
        'satelite.html': 'Ciudad Satélite',
        'tepotzotlan.html': 'Tepotzotlán',
        'tlalnepantla.html': 'Tlalnepantla',
        'tultitlan.html': 'Tultitlán'
    };

    const getPageSlug = () => {
        const path = window.location.pathname;
        const file = path.split('/').pop() || 'index.html';
        return file === '' ? 'index.html' : file;
    };

    const getMunicipality = () => MUNICIPALITY_BY_PAGE[getPageSlug()] || 'CDMX y Estado de México';

    const getOrderFormValues = () => {
        const flavorEl = document.getElementById('wa-order-flavor');
        const peopleEl = document.getElementById('wa-order-qty');
        const zoneEl = document.getElementById('wa-order-zone');

        let people = parseInt(peopleEl?.value, 10);
        if (!Number.isFinite(people) || people < MIN_PEOPLE) {
            people = MIN_PEOPLE;
        }

        return {
            municipality: getMunicipality(),
            flavor: flavorEl?.value || 'mixto',
            people,
            qty: people * TACOS_PER_PERSON,
            zone: (zoneEl?.value || '').trim()
        };
    };

    const orderLine = (people, qty, flavor) =>
        `👥 ${people} personas (${qty} tacos)${flavor ? ` de ${flavor}` : ''}`;

    const zoneLine = (zone) => (zone ? zone : 'por confirmar');

    const buildMessage = (intent, ctx) => {
        const { municipality, flavor, people, qty, zone } = ctx;
        const z = zoneLine(zone);

        switch (intent) {
            case 'chicharron':
                return `Hola, vi su página de ${municipality} y quiero pedir tacos de chicharrón.

${orderLine(people, qty, 'chicharrón')}
📍 Colonia/zona: ${z}
⏰ Fecha de entrega (mín. 1 día de anticipación): por confirmar

¿Me confirman total y entrega? Gracias.`;

            case 'frijol':
                return `Hola, vi su página de ${municipality} y quiero pedir tacos de frijol.

${orderLine(people, qty, 'frijol')}
📍 Colonia/zona: ${z}
⏰ Fecha de entrega (mín. 1 día de anticipación): por confirmar

¿Me confirman total y entrega? Gracias.`;

            case 'papa':
                return `Hola, vi su página de ${municipality} y quiero pedir tacos de papa.

${orderLine(people, qty, 'papa')}
📍 Colonia/zona: ${z}
⏰ Fecha de entrega (mín. 1 día de anticipación): por confirmar

¿Me confirman total y entrega? Gracias.`;

            case 'mole':
                return `Hola, vi su página de ${municipality} y quiero pedir tacos de mole rojo.

${orderLine(people, qty, 'mole rojo')}
📍 Colonia/zona: ${z}
⏰ Fecha de entrega (mín. 1 día de anticipación): por confirmar

¿Me confirman total y entrega? Gracias.`;

            case 'paquete-ejecutivo':
                return `Hola, me interesa el Paquete Ejecutivo ($55/persona) en ${municipality}.

👥 Personas: ${people} (mín. 20)
📍 Ubicación: ${z}
📅 Fecha y hora del evento (mín. 1 día de anticipación): por confirmar

¿Me envían cotización formal? Gracias.`;

            case 'paquete-premium':
                return `Hola, me interesa el Paquete Premium ($75/persona) en ${municipality}.

👥 Personas: ${people} (mín. 20)
📍 Ubicación: ${z}
📅 Fecha y hora del evento (mín. 1 día de anticipación): por confirmar

¿Me envían cotización con montaje incluido? Gracias.`;

            case 'corporativo':
                return `Hola, solicito una COTIZACIÓN FORMAL empresarial en ${municipality}.

🏢 Empresa: por confirmar
👥 Asistentes estimados: ${people} personas (mín. 20)
📍 Dirección de entrega: ${z}
📅 Fecha y hora (mín. 1 día de anticipación): por confirmar

Requiero factura CFDI. ¿Me apoyan con propuesta?`;

            case 'paquete-grande':
                return `Hola, quiero cotizar un paquete grande de tacos de canasta en ${municipality}.

👥 Personas: ${people} (${qty} tacos aprox.)
📍 Ubicación: ${z}
📅 Fecha y hora (mín. 1 día de anticipación): por confirmar

¿Me comparten opciones y precio? Gracias.`;

            case 'domicilio':
                return `Hola, necesito servicio de tacos de canasta a domicilio en ${municipality}.

${orderLine(people, qty, flavor)}
📍 Colonia/zona: ${z}
⏰ Fecha de entrega (mín. 1 día de anticipación): por confirmar

¿Tienen cobertura y cuál sería el total?`;

            case 'pedido':
            default:
                return `Hola, vi su página de ${municipality} y quiero pedir tacos de canasta.

${orderLine(people, qty, flavor)}
📍 Colonia/zona: ${z}
⏰ Fecha de entrega (mín. 1 día de anticipación): por confirmar

¿Me confirman disponibilidad y total? Gracias.`;
        }
    };

    const buildUrl = (message) =>
        `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

    const decodeLinkText = (href) => {
        const match = href.match(/[?&]text=([^&]*)/);
        if (!match) return '';
        try {
            return decodeURIComponent(match[1].replace(/\+/g, ' '));
        } catch (_) {
            return '';
        }
    };

    const detectIntent = (link) => {
        if (link.dataset.waIntent) {
            return link.dataset.waIntent;
        }

        const oldText = decodeLinkText(link.getAttribute('href') || '');

        if (link.classList.contains('delivery-product-card__cta')) {
            if (/chichar/i.test(oldText)) return 'chicharron';
            if (/frijol/i.test(oldText)) return 'frijol';
            if (/papa/i.test(oldText)) return 'papa';
            if (/mole/i.test(oldText)) return 'mole';
        }

        if (link.id === 'clic-whatsapp-empresas' || /cotizaci[oó]n formal/i.test(oldText)) {
            return 'corporativo';
        }
        if (/ejecutivo/i.test(oldText) || (link.classList.contains('btn-paquete') && /\$55/.test(oldText))) {
            return 'paquete-ejecutivo';
        }
        if (/premium/i.test(oldText) || (link.classList.contains('btn-paquete') && /premium/i.test(oldText))) {
            return 'paquete-premium';
        }
        if (link.classList.contains('btn-success') || /paquete grande/i.test(oldText)) {
            return 'paquete-grande';
        }
        if (/necesito servicio/i.test(oldText) || link.classList.contains('whatsapp-float')) {
            return 'domicilio';
        }

        return 'pedido';
    };

    const patchLink = (link) => {
        const intent = detectIntent(link);
        const message = buildMessage(intent, getOrderFormValues());
        link.setAttribute('href', buildUrl(message));
        if (!link.getAttribute('target')) {
            link.setAttribute('target', '_blank');
        }
        if (!link.getAttribute('rel')) {
            link.setAttribute('rel', 'noopener noreferrer');
        }
        link.dataset.waIntent = intent;
    };

    const initHeroOrderForm = () => {
        const zoneEl = document.getElementById('wa-order-zone');
        if (!zoneEl) return;

        const municipality = getMunicipality();
        if (municipality !== 'CDMX y Estado de México') {
            zoneEl.placeholder = `Ej. colonia en ${municipality}...`;
        }
    };

    const initWhatsApp = () => {
        document.querySelectorAll('a[href*="wa.me"]').forEach(patchLink);

        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href*="wa.me"]');
            if (!link) return;

            const intent = detectIntent(link);
            const url = buildUrl(buildMessage(intent, getOrderFormValues()));
            link.setAttribute('href', url);
            event.preventDefault();
            window.open(url, '_blank', 'noopener,noreferrer');
        }, true);

        const peopleEl = document.getElementById('wa-order-qty');
        if (peopleEl) {
            peopleEl.addEventListener('change', () => {
                const val = parseInt(peopleEl.value, 10);
                if (!Number.isFinite(val) || val < MIN_PEOPLE) {
                    peopleEl.value = String(MIN_PEOPLE);
                }
            });
        }

        initHeroOrderForm();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWhatsApp);
    } else {
        initWhatsApp();
    }

    window.TacosWhatsApp = {
        buildUrl,
        buildMessage,
        getMunicipality,
        getOrderFormValues,
        WHATSAPP_PHONE
    };
})();
