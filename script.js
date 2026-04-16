// Mobile Menu Toggle
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    // toggle animation for hamburger bars
    const bars = hamburger.querySelectorAll('.bar');
    if(mobileMenu.classList.contains('active')) {
        bars[0].style.transform = 'translateY(7px) rotate(45deg)';
        bars[1].style.opacity = '0';
        bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
        bars[0].style.transform = 'none';
        bars[1].style.opacity = '1';
        bars[2].style.transform = 'none';
    }
});

mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        const bars = hamburger.querySelectorAll('.bar');
        bars[0].style.transform = 'none';
        bars[1].style.opacity = '1';
        bars[2].style.transform = 'none';
    });
});

// Scroll Effects (Navbar & Reveal)
const navbar = document.getElementById('navbar');
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // Trigger number animation if it's the stats section
            if(entry.target.classList.contains('trust') || entry.target.querySelector('.stats-grid')) {
                animateNumbers();
            }
            
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Number Counter Animation
let hasAnimated = false;
function animateNumbers() {
    if(hasAnimated) return;
    hasAnimated = true;
    
    const stats = document.querySelectorAll('.stat-number');
    
    stats.forEach(stat => {
        const target = +stat.getAttribute('data-target');
        const duration = 2000;
        const increment = target / (duration / 16);
        
        let current = 0;
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                stat.innerText = Math.ceil(current) + (target > 50 ? '+' : '');
                requestAnimationFrame(updateCounter);
            } else {
                stat.innerText = target + (target > 50 ? '+' : '');
            }
        };
        updateCounter();
    });
}

// Contact Form Submission — wired to /api/contact backend (Nodemailer)
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn        = e.target.querySelector('button');
    const statusEl   = document.getElementById('formStatus');
    const originalText = btn.innerText;

    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    btn.innerText = 'Transmitting...';
    btn.disabled  = true;
    if (statusEl) statusEl.textContent = '';

    try {
        const res  = await fetch('/api/booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service: 'Website Enquiry',
                name,
                company: 'N/A',
                vision: message,
                identifier: email
            })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            btn.innerText        = 'Enquiry Sent \u2713';
            btn.style.background = 'var(--text-color)';
            btn.style.color      = 'var(--bg-color)';
            if (statusEl) {
                statusEl.textContent = 'Enquiry sent successfully. We will be in touch shortly.';
                statusEl.style.color = '#aaffaa';
            }
            e.target.reset();
            setTimeout(() => {
                btn.innerText        = originalText;
                btn.style.background = '';
                btn.style.color      = '';
                if (statusEl) { statusEl.textContent = ''; statusEl.style.color = ''; }
            }, 4000);
        } else {
            throw new Error(data.error || 'Server responded with an error.');
        }
    } catch (err) {
        btn.innerText = 'Retry';
        if (statusEl) {
            statusEl.textContent = 'Enquiry transmission failed. Please try again or email us directly.';
            statusEl.style.color = '#ff8888';
        }
        console.error('Contact enquiry error:', err);
    } finally {
        btn.disabled = false;
        setTimeout(() => {
            if (btn.innerText === 'Retry') { btn.innerText = originalText; }
        }, 5000);
    }
});
