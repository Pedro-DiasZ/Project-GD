const SUPABASE_URL      = 'https://zzvlhykklszxssftdvfk.supabase.co';  
const SUPABASE_ANON_KEY = 'sb_publishable_EnQoDimil2YObqKn3ac3uQ_0MnvMjul'; 
const SUPABASE_ENABLED  = true;

async function supabaseFetch(path, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${path}`;
    const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        ...options.headers,
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Supabase error ${res.status}: ${err}`);
    }
    return res.json();
}

async function loadReviewsFromSupabase() {
    return supabaseFetch('reviews?order=created_at.desc&select=*');
}

async function saveReviewToSupabase(review) {
    return supabaseFetch('reviews', {
        method: 'POST',
        body: JSON.stringify(review),
    });
}

const LS_KEY = 'djpina_reviews';

function loadReviewsLocal() {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY)) || [];
    } catch {
        return [];
    }
}

function saveReviewLocal(review) {
    const reviews = loadReviewsLocal();
    reviews.unshift(review);
    localStorage.setItem(LS_KEY, JSON.stringify(reviews));
}

let reviews = [];

async function loadReviews() {
    if (SUPABASE_ENABLED) {
        reviews = await loadReviewsFromSupabase();
    } else {
        reviews = loadReviewsLocal();
    }
}

async function saveReview(review) {
    if (SUPABASE_ENABLED) {
        const [saved] = await saveReviewToSupabase(review);
        reviews.unshift(saved);
    } else {
        review.id = Date.now();
        review.created_at = new Date().toISOString();
        saveReviewLocal(review);
        reviews.unshift(review);
    }
}

const STAR_LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Ótimo', 'Excelente'];

function renderStars(count) {
    const filled = '★'.repeat(count);
    const empty  = '★'.repeat(5 - count);
    return `<span class="stars-inner">${filled}</span><span class="stars-outer" style="color: var(--star-empty)">${empty}</span>`;
}

function formatDate(iso) {
    try {
        return new Date(iso).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    } catch {
        return '';
    }
}

function getInitials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
        <div class="review-card-header">
            <div class="review-author">
                <div class="review-avatar">${getInitials(review.name)}</div>
                <div>
                    <div class="review-name">${escapeHtml(review.name)}</div>
                    <div class="review-date">${formatDate(review.created_at)}</div>
                </div>
            </div>
            <div class="review-stars">${renderStars(review.stars)}</div>
        </div>
        ${review.comment ? `<p class="review-comment">${escapeHtml(review.comment)}</p>` : ''}
    `;
    return card;
}

function updateRatingSummary() {
    const scoreEl = document.getElementById('ratingScore');
    const starsEl = document.getElementById('ratingStarsDisplay');
    const countEl = document.getElementById('ratingCount');
    if (!scoreEl) return;

    if (reviews.length === 0) {
        scoreEl.textContent = '—';
        starsEl.innerHTML = '<span style="color: var(--star-empty)">★★★★★</span>';
        countEl.textContent = 'Nenhuma avaliação ainda';
        return;
    }

    const avg = reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length;
    scoreEl.textContent = (Math.round(avg * 10) / 10).toFixed(1);
    starsEl.innerHTML = renderStars(Math.round(avg));
    countEl.textContent = reviews.length === 1 ? '1 avaliação' : `${reviews.length} avaliações`;
}

function renderAllReviews() {
    const list  = document.getElementById('reviewsList');
    const empty = document.getElementById('reviewsEmpty');
    if (!list) return;

    list.querySelectorAll('.review-card').forEach(el => el.remove());

    if (reviews.length === 0) {
        if (empty) empty.style.display = '';
        return;
    }

    if (empty) empty.style.display = 'none';
    reviews.forEach(r => list.appendChild(renderReviewCard(r)));
    updateRatingSummary();
}

function prependReviewCard(review) {
    const list  = document.getElementById('reviewsList');
    const empty = document.getElementById('reviewsEmpty');
    if (!list) return;
    if (empty) empty.style.display = 'none';
    list.insertBefore(renderReviewCard(review), list.firstChild);
    updateRatingSummary();
}

function initStarPicker() {
    const picker  = document.getElementById('starPicker');
    const label   = document.getElementById('starLabel');
    if (!picker) return;

    let selected = 0;
    const buttons = Array.from(picker.querySelectorAll('.star-btn'));

    function highlight(upTo) {
        buttons.forEach((btn, i) => {
            btn.classList.toggle('hovered', i < upTo);
            btn.classList.toggle('selected', i < selected);
        });
    }

    buttons.forEach((btn, i) => {
        btn.addEventListener('mouseenter', () => highlight(i + 1));
        btn.addEventListener('mouseleave', () => highlight(selected));
        btn.addEventListener('click', () => {
            selected = i + 1;
            highlight(selected);
            label.textContent = STAR_LABELS[selected];
            picker.dataset.value = selected;
        });
    });

    picker.reset = () => {
        selected = 0;
        highlight(0);
        label.textContent = 'Selecione uma nota';
        delete picker.dataset.value;
    };
}

function initReviewForm() {
    const submitBtn = document.getElementById('submitReview');
    const nameInput = document.getElementById('reviewName');
    const commentTA = document.getElementById('reviewComment');
    const charCount = document.getElementById('charCount');
    const feedback  = document.getElementById('formFeedback');
    const picker    = document.getElementById('starPicker');
    if (!submitBtn) return;

    commentTA.addEventListener('input', () => {
        charCount.textContent = commentTA.value.length;
    });

    submitBtn.addEventListener('click', async () => {
        const name    = nameInput.value.trim();
        const stars   = parseInt(picker.dataset.value || '0', 10);
        const comment = commentTA.value.trim();

        feedback.className = 'form-feedback';
        if (!name) {
            feedback.textContent = 'Por favor, informe seu nome.';
            feedback.classList.add('error');
            nameInput.focus();
            return;
        }
        if (!stars) {
            feedback.textContent = 'Por favor, selecione uma nota de 1 a 5 estrelas.';
            feedback.classList.add('error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando…';

        try {
            await saveReview({ name, stars, comment });
            prependReviewCard(reviews[0]);

            nameInput.value = '';
            commentTA.value = '';
            charCount.textContent = '0';
            picker.reset();

            feedback.textContent = '✓ Avaliação enviada! Obrigado pelo feedback.';
            feedback.classList.add('success');
            setTimeout(() => { feedback.textContent = ''; }, 5000);
        } catch (err) {
            console.error('Erro ao salvar avaliação:', err);
            feedback.textContent = 'Ocorreu um erro ao enviar. Tente novamente.';
            feedback.classList.add('error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar avaliação';
        }
    });
}

function initThemeToggle() {
    const btn  = document.getElementById('themeToggle');
    const html = document.documentElement;
    if (!btn) return;

    const saved = localStorage.getItem('djpina_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));

    btn.addEventListener('click', () => {
        const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('djpina_theme', next);
    });
}

function initCarousels() {
    document.querySelectorAll('.carrossel-container').forEach((container) => {
        const carousel       = container.querySelector('.carrossel');
        const slides         = Array.from(carousel.querySelectorAll('.slide'));
        const prevBtn        = container.querySelector('.carrossel-btn.prev');
        const nextBtn        = container.querySelector('.carrossel-btn.next');
        const indicatorsWrap = container.querySelector('.carrossel-indicators');
        if (slides.length === 0) return;

        indicatorsWrap.innerHTML = '';
        slides.forEach((s, i) => {
            const dot = document.createElement('span');
            dot.className = 'indicator' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', () => goTo(i));
            indicatorsWrap.appendChild(dot);
        });

        let current = 0;
        let autoplay = null;
        let touchStartX = 0;

        function show(n) {
            current = n >= slides.length ? 0 : n < 0 ? slides.length - 1 : n;
            slides.forEach((s, i) => s.classList.toggle('active', i === current));
            indicatorsWrap.querySelectorAll('.indicator').forEach((d, i) => d.classList.toggle('active', i === current));
        }

        function prev() { show(current - 1); }
        function next() { show(current + 1); }
        function goTo(i) { show(i); restartAutoplay(); }
        function startAutoplay() { stopAutoplay(); autoplay = setInterval(() => next(), 3500); }
        function stopAutoplay() { if (autoplay) { clearInterval(autoplay); autoplay = null; } }
        function restartAutoplay() { stopAutoplay(); startAutoplay(); }

        prevBtn.addEventListener('click', () => { prev(); restartAutoplay(); });
        nextBtn.addEventListener('click', () => { next(); restartAutoplay(); });
        container.addEventListener('mouseenter', stopAutoplay);
        container.addEventListener('mouseleave', startAutoplay);

        carousel.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
        carousel.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); restartAutoplay(); }
        }, { passive: true });

        container.tabIndex = 0;
        container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft')  { prev(); restartAutoplay(); }
            if (e.key === 'ArrowRight') { next(); restartAutoplay(); }
        });

        show(0);
        startAutoplay();
    });
}

function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach(el => el.classList.add('reveal', 'is-visible'));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal', 'is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    items.forEach(el => { el.classList.add('reveal'); observer.observe(el); });
}

document.addEventListener('DOMContentLoaded', async () => {
    initThemeToggle();
    initCarousels();
    initReveal();
    initStarPicker();
    initReviewForm();

    try {
        await loadReviews();
        renderAllReviews();
        updateRatingSummary();
    } catch (err) {
        console.error('Erro ao carregar avaliações:', err);
    }
});
