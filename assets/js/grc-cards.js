const cards = document.querySelectorAll('.grc-card-large');

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

cards.forEach(card => observer.observe(card));

const images = document.querySelectorAll('.grc-image');

const observerImages = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observerImages.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

images.forEach(img => observerImages.observe(img));