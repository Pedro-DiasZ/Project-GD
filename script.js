// Multi-carousel implementation
document.addEventListener('DOMContentLoaded', () => {
    initCarousels();
});

function initCarousels() {
    const containers = document.querySelectorAll('.carrossel-container');
    const instances = [];

    containers.forEach((container, idx) => {
        const carousel = container.querySelector('.carrossel');
        const slides = Array.from(carousel.querySelectorAll('.slide'));
        const prevBtn = container.querySelector('.carrossel-btn.prev');
        const nextBtn = container.querySelector('.carrossel-btn.next');
        const indicatorsWrap = container.querySelector('.carrossel-indicators');

        if (slides.length === 0) return;

        // build indicators
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

        // touch support
        carousel.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, {passive:true});
        carousel.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) next(); else prev();
                restartAutoplay();
            }
        }, {passive:true});

        function startAutoplay() {
            stopAutoplay();
            autoplay = setInterval(() => { next(); }, 3500);
        }

        function stopAutoplay() {
            if (autoplay) { clearInterval(autoplay); autoplay = null; }
        }

        function restartAutoplay() { stopAutoplay(); startAutoplay(); }

        // keyboard navigation when container is focused (optional)
        container.tabIndex = 0;
        container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') { prev(); restartAutoplay(); }
            if (e.key === 'ArrowRight') { next(); restartAutoplay(); }
        });

        // start
        show(0);
        startAutoplay();

        instances.push({ container, carousel, slides });
    });
}
