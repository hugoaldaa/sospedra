// Configuración
const API_URL = 'bd/api.php';

// Estado de la aplicación
let allPrendas = [];
let activePrendas = [];
let allTipos = [];
let currentLang = localStorage.getItem('sospedra_lang') || 'es';
let currentPage = 1;
let itemsPerPage = 6;

// Diccionario de Traducciones
const translations = {
    es: {
        results_label: "resultados",
        prev_page: "Anterior",
        next_page: "Siguiente"
    },
    ca: {
        footer_copyright: "&copy; 2025 SOSPEDRA 1919. Col·lecció Exclusiva.",
        nav_home: "Inici",
        nav_catalog: "Catàleg",
        nav_history: "La Nostra Història",
        nav_contact: "Contacte",
        hero_title: "Tratges d'home des del <span>1919</span>",
        hero_subtitle: "Des de fa més d’un segle, a Sastreria Sospedra confeccionem tratges amb l’equilibri perfecte entre tradició artesana i elegància contemporània.",
        catalog_label: "¡Més peçes a la botiga!",
        catalog_title: "Catàleg",
        search_placeholder: "Cercar peça...",
        filter_types: "Tipus de Peça",
        history_label: "Des de 1919",
        history_title: "Una Tradició Centenaria",
        history_p1: "A la nostra sastreria, cada peça és única perquè està pensada exclusivament per a tu. Des de l’elecció dels teixits fins al més petit detall, treballem perquè el vestit reflecteixi la teva personalitat i estil.",
        history_p2: "Amb més de 100 anys d’experiència a Barcelona, unim tradició artesana i tècniques actuals per aconseguir un resultat impecable que s’adapta perfectament al teu cos i a la teva manera de viure.",
        back_to_catalog: "← Tornar al catàleg",
        footer_desc: "Artesania i elegància en cada puntada. Sastrería de luxe dedicada a la confecció a mida amb els millors materials del món des de fa més d'un segle.",
        footer_nav_title: "Navegació",
        footer_contact_title: "Contacte",
        ver_detalles: "Veure més fotos →",
        no_entries: "No s'han trobat peces.",
        contact_prompt: "Per a més informació o comandes personalitzades, contacti amb nosaltres directament.",
        results_label: "resultats",
        prev_page: "Anterior",
        next_page: "Següent"
    }
};

// DOM Elements
const catalogGrid = document.getElementById('catalogGrid');
const typeFilter = document.getElementById('typeFilter');
const perPageFilter = document.getElementById('perPageFilter');
const catalogView = document.getElementById('catalogView');
const detailView = document.getElementById('detailView');
const closeDetail = document.getElementById('closeDetail');
const detailContent = document.getElementById('detailContent');
const menuToggle = document.getElementById('menuToggle');
const navLinksContainer = document.getElementById('navLinks');
const navLinks = document.querySelectorAll('.nav-links a');
const langButtons = document.querySelectorAll('.lang-btn');
const totalResultsSpan = document.getElementById('totalResults');
const paginationControls = document.getElementById('paginationControls');

// Capture English/Original strings from HTML
function captureOriginalTexts() {
    // Capturar textos normales
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Solo sobrescribir si no es una clave que definimos manualmente (como prev_page)
        // Aunque prev_page no está en el DOM, results_label si.
        // Mantenemos la lógica de captura para asegurar sincronización.
        translations.es[key] = el.innerHTML;
    });

    // Capturar placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        translations.es[key] = el.placeholder;
    });
}

// Fetch initial data from Database
async function initApp() {
    updateStaticTexts();
    try {
        const response = await fetch(`${API_URL}?action=catalog&lang=${currentLang}`);
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        allPrendas = data.prendas;
        activePrendas = [...allPrendas];
        allTipos = data.tipos;

        initFilters();
        renderCatalog();
    } catch (error) {
        console.error('Error cargando catálogo:', error);
        catalogGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Error al conectar con la base de datos.</p>`;
    }
}

// Update Static Texts
function updateStaticTexts() {
    const t = translations[currentLang];

    // Elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.innerHTML = t[key];
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });

    // Update active state in lang buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
}

// Render Catalog
function renderCatalog() {
    catalogGrid.innerHTML = '';

    // Update Total Count
    if (totalResultsSpan) {
        totalResultsSpan.textContent = activePrendas.length;
    }

    if (activePrendas.length === 0) {
        catalogGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #999;">${translations[currentLang].no_entries || 'No entries found'}</p>`;
        paginationControls.innerHTML = '';
        return;
    }

    // Pagination Logic
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const slicedPrendas = activePrendas.slice(startIndex, endIndex);

    slicedPrendas.forEach(prenda => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openDetail(prenda.id);

        card.innerHTML = `
            <div class="card-image">
                <img src="${prenda.imagen}" alt="${prenda.nombre}" onerror="this.src='https://images.unsplash.com/photo-1594932224828-b4b05a83296c?q=80&w=800&auto=format&fit=crop'">
            </div>
            <div class="card-content">
                <span class="card-price"></span>
                <span style="color: var(--secondary); font-size: 0.9rem;">${translations[currentLang].ver_detalles}</span>
            </div>
        `;
        catalogGrid.appendChild(card);
    });

    renderPagination();
}

// Render Pagination Controls
function renderPagination() {
    paginationControls.innerHTML = '';
    const totalPages = Math.ceil(activePrendas.length / itemsPerPage);

    if (totalPages <= 1) return;

    const t = translations[currentLang];

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.textContent = t.prev_page;
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => changePage(currentPage - 1);
    paginationControls.appendChild(prevBtn);

    // Page Numbers
    // Simple logic: render all if <= 7, else show window?
    // User requested simple pagination. Let's do all for now or simple window.
    // Given the amount of images, let's keep it simple for now (all numbers)
    // or max 5.

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.className = 'page-btn';
        firstBtn.textContent = '1';
        firstBtn.onclick = () => changePage(1);
        paginationControls.appendChild(firstBtn);

        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.alignSelf = 'center';
            paginationControls.appendChild(dots);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => changePage(i);
        paginationControls.appendChild(btn);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.alignSelf = 'center';
            paginationControls.appendChild(dots);
        }

        const lastBtn = document.createElement('button');
        lastBtn.className = 'page-btn';
        lastBtn.textContent = totalPages;
        lastBtn.onclick = () => changePage(totalPages);
        paginationControls.appendChild(lastBtn);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.textContent = t.next_page;
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => changePage(currentPage + 1);
    paginationControls.appendChild(nextBtn);
}

function changePage(newPage) {
    const totalPages = Math.ceil(activePrendas.length / itemsPerPage);
    if (newPage < 1 || newPage > totalPages) return;

    currentPage = newPage;
    renderCatalog();
    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
}

// Open Detail Page
async function openDetail(id) {
    try {
        const response = await fetch(`${API_URL}?action=detail&id=${id}&lang=${currentLang}`);
        const prenda = await response.json();

        if (prenda.error) throw new Error(prenda.error);

        const imagenes = prenda.todas_imagenes || [prenda.imagen];
        const t = translations[currentLang];

        detailContent.innerHTML = `
            <div class="detail-container">
                <div class="detail-image">
                    <div class="carousel-container">
                        ${imagenes.map((img, index) => `
                            <div class="carousel-slide ${index === 0 ? 'active' : ''}">
                                <img src="${img}" alt="${prenda.nombre}" onerror="this.src='https://images.unsplash.com/photo-1594932224828-b4b05a83296c?q=80&w=800&auto=format&fit=crop'">
                            </div>
                        `).join('')}
                        
                        ${imagenes.length > 1 ? `
                            <div class="carousel-nav">
                                <button class="carousel-btn" onclick="moveSlide(-1)">❮</button>
                                <button class="carousel-btn" onclick="moveSlide(1)">❯</button>
                            </div>
                            <div class="carousel-dots">
                                ${imagenes.map((_, index) => `
                                    <span class="dot ${index === 0 ? 'active' : ''}" onclick="currentSlide(${index})"></span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="detail-info">
                    <h2 class="serif">${prenda.nombre}</h2>
                    <div class="contact-prompt">
                        <p>${t.contact_prompt}</p>
                        <div class="contact-links">
                            <a href="tel:+34934211749" class="contact-method">📞 +34 934 21 17 49</a>
                            <a href="mailto:sastresospedra@telefonica.net" class="contact-method">✉️ sastresospedra@telefonica.net</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        catalogView.style.display = 'none';
        detailView.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.currentSlideIndex = 0;

    } catch (error) {
        console.error(error);
    }
}

// Global Carousel Logic
window.moveSlide = function (n) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;
    slides[window.currentSlideIndex].classList.remove('active');
    if (dots.length > 0) dots[window.currentSlideIndex].classList.remove('active');
    window.currentSlideIndex = (window.currentSlideIndex + n + slides.length) % slides.length;
    slides[window.currentSlideIndex].classList.add('active');
    if (dots.length > 0) dots[window.currentSlideIndex].classList.add('active');
}

window.currentSlide = function (index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    if (slides.length === 0) return;
    slides[window.currentSlideIndex].classList.remove('active');
    if (dots.length > 0) dots[window.currentSlideIndex].classList.remove('active');
    window.currentSlideIndex = index;
    slides[window.currentSlideIndex].classList.add('active');
    if (dots.length > 0) dots[window.currentSlideIndex].classList.add('active');
}

// Close Detail
closeDetail.onclick = () => {
    detailView.style.display = 'none';
    catalogView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Filters Logic
function filterProducts() {
    // Update itemsPerPage just in case
    itemsPerPage = parseInt(perPageFilter.value) || 6;
    const selectedType = typeFilter.value;

    activePrendas = allPrendas.filter(p => {
        const matchesType = selectedType === 'all' || p.id_tipo_prenda == selectedType;
        return matchesType;
    });

    currentPage = 1;
    renderCatalog();
}

// Init Dropdowns
function initFilters() {
    typeFilter.innerHTML = `<option value="all" data-i18n="filter_types">${translations[currentLang].filter_types || 'Tipos de Prenda'}</option>`;

    // Remove existing custom selectors to avoid duplication
    document.querySelectorAll('.custom-select').forEach(cs => cs.remove());

    allTipos.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.nombre;
        typeFilter.appendChild(opt);
    });

    transformToCustomSelect(typeFilter);

    // Setup perPageFilter input listener
    perPageFilter.addEventListener('change', () => {
        let value = parseInt(perPageFilter.value);
        if (isNaN(value) || value < 1) {
            value = 6;
            perPageFilter.value = 6;
        }
        if (value > 100) {
            value = 100;
            perPageFilter.value = 100;
        }
        itemsPerPage = value;
        currentPage = 1;
        renderCatalog();
    });
}

// Custom Select Logic
function transformToCustomSelect(selectEl) {
    const parent = selectEl.parentElement;
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';

    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    trigger.innerHTML = `<span>${selectEl.options[selectEl.selectedIndex].text}</span>`;

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-options';

    Array.from(selectEl.options).forEach((option, index) => {
        const optDiv = document.createElement('div');
        optDiv.className = `custom-option ${index === selectEl.selectedIndex ? 'selected' : ''}`;
        optDiv.textContent = option.text;
        optDiv.dataset.value = option.value;

        optDiv.onclick = (e) => {
            e.stopPropagation();
            selectEl.value = option.value;
            trigger.querySelector('span').textContent = option.text;
            optionsContainer.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
            optDiv.classList.add('selected');
            wrapper.classList.remove('open');
            filterProducts();
        };
        optionsContainer.appendChild(optDiv);
    });

    trigger.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.custom-select').forEach(cs => {
            if (cs !== wrapper) cs.classList.remove('open');
        });
        wrapper.classList.toggle('open');
    };

    wrapper.appendChild(trigger);
    wrapper.appendChild(optionsContainer);
    parent.appendChild(wrapper);
}

document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select').forEach(cs => cs.classList.remove('open'));
});

// Switch Language Logic
function setupLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            const lang = btn.dataset.lang;
            if (lang === currentLang) return;

            currentLang = lang;
            localStorage.setItem('sospedra_lang', lang);

            initApp();
        };
    });
}

// Setup Event Listeners

menuToggle.onclick = () => {
    menuToggle.classList.toggle('active');
    navLinksContainer.classList.toggle('active');
};

navLinks.forEach(link => {
    link.onclick = () => {
        menuToggle.classList.remove('active');
        navLinksContainer.classList.remove('active');
    };
});

// Manejador para enlaces del footer y navegación que apuntan a secciones dentro del catálogo
document.querySelectorAll('a[href="#catalogo"], a[href="#historia"]').forEach(link => {
    link.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href').substring(1);

        // Si la vista de detalles está activa, primero cerrarla
        if (detailView.style.display === 'block') {
            e.preventDefault();
            detailView.style.display = 'none';
            catalogView.style.display = 'block';

            // Esperar un momento para que se muestre el catálogo y luego navegar
            setTimeout(() => {
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    });
});

setupLangButtons();

// Setup
window.onload = () => {
    captureOriginalTexts();
    initApp();
};