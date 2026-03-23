// Multi-carousel implementation and reveal animations
document.addEventListener('DOMContentLoaded', () => {
    initCarousels();
    initReveal();
});

function initCarousels() {
    const containers = document.querySelectorAll('.carrossel-container');

    containers.forEach((container) => {
        const carousel = container.querySelector('.carrossel');
        const slides = Array.from(carousel.querySelectorAll('.slide'));
        const prevBtn = container.querySelector('.carrossel-btn.prev');
        const nextBtn = container.querySelector('.carrossel-btn.next');
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
            if (n >= slides.length) current = 0;
            else if (n < 0) current = slides.length - 1;
            else current = n;

            slides.forEach((s, i) => s.classList.toggle('active', i === current));
            const dots = indicatorsWrap.querySelectorAll('.indicator');
            dots.forEach((d, i) => d.classList.toggle('active', i === current));
        }

        function prev() { show(current - 1); }
        function next() { show(current + 1); }
        function goTo(i) { show(i); restartAutoplay(); }

        prevBtn.addEventListener('click', () => { prev(); restartAutoplay(); });
        nextBtn.addEventListener('click', () => { next(); restartAutoplay(); });

        container.addEventListener('mouseenter', stopAutoplay);
        container.addEventListener('mouseleave', startAutoplay);

        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) next(); else prev();
                restartAutoplay();
            }
        }, { passive: true });

        function startAutoplay() {
            stopAutoplay();
            autoplay = setInterval(() => { next(); }, 3500);
        }

        function stopAutoplay() {
            if (autoplay) { clearInterval(autoplay); autoplay = null; }
        }

        function restartAutoplay() { stopAutoplay(); startAutoplay(); }

        container.tabIndex = 0;
        container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') { prev(); restartAutoplay(); }
            if (e.key === 'ArrowRight') { next(); restartAutoplay(); }
        });

        show(0);
        startAutoplay();
    });
}

function initReveal() {
    const revealItems = document.querySelectorAll('[data-reveal]');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        revealItems.forEach((el) => el.classList.add('reveal', 'is-visible'));
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

    revealItems.forEach((el) => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

