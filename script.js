let indiceSlideAtual = 0;
let autoplayInterval;

// Iniciar autoplay ao carregar a página
document.addEventListener('DOMContentLoaded', iniciarAutoplay);

// Parar autoplay quando o mouse entra no carrossel
document.querySelector('.carrossel-container').addEventListener('mouseenter', pararAutoplay);

// Reiniciar autoplay quando o mouse sai do carrossel
document.querySelector('.carrossel-container').addEventListener('mouseleave', iniciarAutoplay);

function mudarSlide(n) {
    mostrarSlide(indiceSlideAtual += n);
    pararAutoplay();
    iniciarAutoplay();
}

function irParaSlide(n) {
    mostrarSlide(indiceSlideAtual = n);
    pararAutoplay();
    iniciarAutoplay();
}

function mostrarSlide(n) {
    const slides = document.querySelectorAll('.slide');
    const indicators = document.querySelectorAll('.indicator');

    // Voltar ao primeiro slide se passar do último
    if (n >= slides.length) {
        indiceSlideAtual = 0;
    }
    // Voltar ao último slide se for para trás do primeiro
    if (n < 0) {
        indiceSlideAtual = slides.length - 1;
    }

    // Remover classe active de todos
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));

    // Adicionar classe active ao slide e indicador atuais
    slides[indiceSlideAtual].classList.add('active');
    indicators[indiceSlideAtual].classList.add('active');
}

function pararAutoplay() {
    clearInterval(autoplayInterval);
}

// Suporte a teclado (setas esquerda e direita)
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        mudarSlide(-1);
    } else if (e.key === 'ArrowRight') {
        mudarSlide(1);
    }
});

// Suporte a swipe em mobile
let touchStartX = 0;
let touchEndX = 0;

const carrossel = document.querySelector('.carrossel');

carrossel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

carrossel.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const diferenca = touchStartX - touchEndX;
    
    if (Math.abs(diferenca) > 50) { // Mínimo de 50px para considerar swipe
        if (diferenca > 0) {
            mudarSlide(1); // Swipe para esquerda = próximo slide
        } else {
            mudarSlide(-1); // Swipe para direita = slide anterior
        }
    }
}
