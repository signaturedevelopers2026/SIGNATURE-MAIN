// Signature Developers - Core Logic

// Global State
let currentUser = null;

// Init GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Custom Cursor
const cursor = document.getElementById('cursor');
const hoverables = document.querySelectorAll('a, button, .hoverable, .magnetic-text');

document.addEventListener('mousemove', (e) => {
    gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: "power2.out"
    });
});

hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

// Magnetic Effect
const magnetics = document.querySelectorAll('.magnetic');
magnetics.forEach(el => {
    el.addEventListener('mousemove', (e) => {
        const position = el.getBoundingClientRect();
        const x = e.clientX - position.left - position.width / 2;
        const y = e.clientY - position.top - position.height / 2;

        gsap.to(el, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.5,
            ease: "power3.out"
        });
    });

    el.addEventListener('mouseleave', () => {
        gsap.to(el, {
            x: 0,
            y: 0,
            duration: 0.7,
            ease: "elastic.out(1, 0.3)"
        });
    });
});

// Text Scramble Effect implementation for headings
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$*&%';
const scrambleElements = document.querySelectorAll('.scramble-title');

scrambleElements.forEach(el => {
    const originalText = el.innerText;
    el.originalText = originalText;

    ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        onEnter: () => scrambleText(el)
    });
});

function scrambleText(element) {
    let iteration = 0;
    const text = element.originalText;

    clearInterval(element.scrambleInterval);

    element.scrambleInterval = setInterval(() => {
        element.innerText = text
            .split('')
            .map((letter, index) => {
                if (index < iteration) return text[index];
                if (letter === ' ' || letter === '\n') return letter;
                return characters[Math.floor(Math.random() * characters.length)];
            })
            .join('');

        if (iteration >= text.length) {
            clearInterval(element.scrambleInterval);
        }

        iteration += 1 / 3;
    }, 30);
}

// Section Reveal Animations
gsap.utils.toArray('.reveal-item').forEach((item, i) => {
    gsap.from(item, {
        scrollTrigger: {
            trigger: item,
            start: "top 85%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    });
});

// Preloader & Hero initial animations
const tl = gsap.timeline();

let preloaderCount = { val: 0 };
tl.to(preloaderCount, {
    val: 100,
    duration: 1.5,
    ease: "power2.inOut",
    onUpdate: function () {
        const counterEl = document.querySelector('.preloader-count');
        if (counterEl) counterEl.innerText = Math.floor(preloaderCount.val) + "%";
    }
})
    .to('.preloader-count, .preloader-brand', { opacity: 0, duration: 0.3, stagger: 0.1, ease: "power2.inOut" }, "+=0.2")
    .to('#preloader', { y: "-100%", duration: 1.2, ease: "power4.inOut" })
    .from('.reveal-up', {
        y: 30,
        opacity: 0,
        duration: 1.5,
        stagger: 0.2,
        ease: "power3.out"
    }, "-=0.6");

// Three.js Antigravity Particle Field
const canvas = document.getElementById('three-canvas');
if (canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 700;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const material = new THREE.PointsMaterial({
        size: 0.015,
        color: 0xE5E4E2,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    camera.position.z = 3;

    // Mouse interaction for particles
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = event.clientX / window.innerWidth - 0.5;
        mouseY = event.clientY / window.innerHeight - 0.5;
    });

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Antigravity upward drift
        const positions = particlesGeometry.attributes.position.array;
        for (let i = 1; i < particlesCount * 3; i += 3) {
            positions[i] += 0.002;
            if (positions[i] > 5) {
                positions[i] = -5;
            }
        }
        particlesGeometry.attributes.position.needsUpdate = true;

        // Subtle rotation and mouse interaction
        particlesMesh.rotation.y = elapsedTime * 0.05 + mouseX * 0.5;
        particlesMesh.rotation.x = mouseY * 0.5;

        renderer.render(scene, camera);
    }

    animate();

    // Responsive Three.js
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Portal Logic
const loginOverlay = document.getElementById('login-overlay');
const loginClose = document.getElementById('login-close');

let authMode = 'signin';
function switchAuthMode(mode) {
    authMode = mode;
    const nameField = document.getElementById('clientName');
    const signinLinks = document.getElementById('signin-only-links');
    const submitBtn = document.getElementById('authSubmitBtn');
    const tabSignin = document.getElementById('tab-signin');
    const tabSignup = document.getElementById('tab-signup');

    // Reset visibility of other forms
    const clientForm = document.getElementById('customerLoginForm');
    const forgotForm = document.getElementById('forgotPassForm');
    const resetForm = document.getElementById('resetPassForm');
    const verifyForm = document.getElementById('otpVerifyForm');

    if (clientForm) clientForm.style.display = 'block';
    if (forgotForm) forgotForm.style.display = 'none';
    if (resetForm) resetForm.style.display = 'none';
    if (verifyForm) verifyForm.style.display = 'none';

    if (mode === 'signup' && nameField) {
        nameField.style.display = 'block';
        nameField.required = true;
        if (signinLinks) signinLinks.style.display = 'none';
        if (submitBtn) submitBtn.textContent = 'CREATE ACCOUNT';
        if (tabSignup) tabSignup.classList.add('active-tab');
        if (tabSignin) tabSignin.classList.remove('active-tab');
    } else if (nameField) {
        nameField.style.display = 'none';
        nameField.required = false;
        if (signinLinks) signinLinks.style.display = 'block';
        if (submitBtn) submitBtn.textContent = 'ACCESS HUB';
        if (tabSignin) tabSignin.classList.add('active-tab');
        if (tabSignup) tabSignup.classList.remove('active-tab');
    }
}

function showForgotPass() {
    gsap.to('#customerLoginForm', {
        opacity: 0, y: -20, onComplete: () => {
            const clientForm = document.getElementById('customerLoginForm');
            const forgot = document.getElementById('forgotPassForm');
            if (clientForm) clientForm.style.display = 'none';
            if (forgot) {
                forgot.style.display = 'block';
                gsap.fromTo(forgot, { opacity: 0, y: 20 }, { opacity: 1, y: 0 });
            }
        }
    });
}

function openPortal(mode) {
    const overlay = document.getElementById('login-overlay');
    const title = document.getElementById('portal-title');
    const empForm = document.getElementById('employeeLoginForm');
    const clientForms = document.getElementById('customerLoginForm');
    const forgotForm = document.getElementById('forgotPassForm');
    const resetForm = document.getElementById('resetPassForm');
    const verifyForm = document.getElementById('otpVerifyForm');
    const hubPlaceholder = document.querySelector('.dashboard-placeholder');

    if (!overlay) return;

    gsap.set(overlay, { visibility: 'visible' });
    gsap.to(overlay, { y: 0, duration: 1, ease: 'power4.inOut' });

    // Reset visibility
    if (empForm) empForm.style.display = 'none';
    if (clientForms) clientForms.style.display = 'none';
    if (forgotForm) forgotForm.style.display = 'none';
    if (resetForm) resetForm.style.display = 'none';
    if (verifyForm) verifyForm.style.display = 'none';
    if (hubPlaceholder) hubPlaceholder.style.display = 'none';
    
    const statusEl = document.getElementById('login-status');
    if (statusEl) statusEl.textContent = '';

    if (mode === 'client') {
        if (title) title.textContent = 'CLIENT HUB';
        if (clientForms) clientForms.style.display = 'block';
        switchAuthMode('signin');
    } else {
        if (title) title.textContent = 'COMMAND CENTER';
        if (empForm) empForm.style.display = 'block';
    }
}

const closePortal = () => {
    if (loginOverlay) {
        gsap.to(loginOverlay, { autoAlpha: 0, y: "100%", duration: 1, ease: "power4.inOut" });
    }
};

if (loginClose) loginClose.addEventListener('click', closePortal);

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape" && loginOverlay && loginOverlay.style.visibility !== "hidden") closePortal();
});

// Expanded Client Auth Logic
const clientAuthForm = document.getElementById('clientAuthForm');
if (clientAuthForm) {
    clientAuthForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('clientIdentifier').value;
        const password = document.getElementById('clientPass').value;
        const nameField = document.getElementById('clientName');
        const name = nameField ? nameField.value : '';
        const status = document.getElementById('login-status');

        if (status) status.textContent = 'INITIATING AUTHENTICATION SEQUENCE...';

        try {
            const endpoint = authMode === 'signup' ? '/api/customer/signup-initiate' : '/api/customer/login';
            const body = authMode === 'signup'
                ? { identifier, password, name }
                : { identifier, password };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (res.ok) {
                if (data.requiresReverification || authMode === 'signup') {
                    gsap.to('#customerLoginForm', {
                        opacity: 0, y: -20, onComplete: () => {
                            const clientForm = document.getElementById('customerLoginForm');
                            const verify = document.getElementById('otpVerifyForm');
                            if (clientForm) clientForm.style.display = 'none';
                            if (verify) {
                                verify.style.display = 'block';
                                gsap.fromTo(verify, { opacity: 0, y: 20 }, { opacity: 1, y: 0 });
                            }
                        }
                    });
                    if (status) status.textContent = data.message;
                } else {
                    enterClientHub(data.customer);
                }
            } else {
                if (status) status.textContent = data.message;
            }
        } catch (err) {
            if (status) status.textContent = 'AUTHENTICATION ARRAY FAILURE.';
        }
    });
}

const otpVerifyForm = document.getElementById('otpVerifyForm');
if (otpVerifyForm) {
    otpVerifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otpInput = document.getElementById('otpInput');
        const otp = otpInput ? otpInput.value : '';
        const identifier = document.getElementById('clientIdentifier').value;
        const status = document.getElementById('login-status');

        if (status) status.textContent = 'VALIDATING PULSE...';

        try {
            const res = await fetch('/api/customer/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, otp })
            });

            const data = await res.json();
            if (data.success) {
                enterClientHub(data.customer);
            } else {
                if (status) status.textContent = data.message;
            }
        } catch (err) {
            if (status) status.textContent = 'VERIFICATION ARRAY FAILURE.';
        }
    });
}

// Forgot Password Logic
const forgotPassForm = document.getElementById('forgotPassForm');
if (forgotPassForm) {
    forgotPassForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const forgotId = document.getElementById('forgotIdentifier');
        const identifier = forgotId ? forgotId.value : '';
        const status = document.getElementById('login-status');
        if (status) status.textContent = 'INITIATING RECOVERY PULSE...';

        try {
            const res = await fetch('/api/customer/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier })
            });
            const data = await res.json();
            if (res.ok) {
                gsap.to('#forgotPassForm', {
                    opacity: 0, y: -20, onComplete: () => {
                        const forgotForm = document.getElementById('forgotPassForm');
                        const reset = document.getElementById('resetPassForm');
                        if (forgotForm) forgotForm.style.display = 'none';
                        if (reset) {
                            reset.style.display = 'block';
                            gsap.fromTo(reset, { opacity: 0, y: 20 }, { opacity: 1, y: 0 });
                        }
                    }
                });
                if (status) status.textContent = data.message;
            } else {
                if (status) status.textContent = data.message;
            }
        } catch (err) {
            if (status) status.textContent = 'RECOVERY ARRAY FAILURE.';
        }
    });
}

const resetPassForm = document.getElementById('resetPassForm');
if (resetPassForm) {
    resetPassForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const forgotId = document.getElementById('forgotIdentifier');
        const identifier = forgotId ? forgotId.value : '';
        const otp = document.getElementById('resetOtp').value;
        const newPassword = document.getElementById('resetNewPass').value;
        const status = document.getElementById('login-status');

        if (status) status.textContent = 'RECONFIGURING CREDENTIALS...';

        try {
            const res = await fetch('/api/customer/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, otp, newPassword })
            });
            const data = await res.json();
            if (data.success) {
                if (status) status.textContent = data.message;
                setTimeout(() => switchAuthMode('signin'), 1500);
            } else {
                if (status) status.textContent = data.message;
            }
        } catch (err) {
            if (status) status.textContent = 'RESET ARRAY FAILURE.';
        }
    });
}

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const form = e.target;
        const btn = form.querySelector('button');
        const statusEl = document.getElementById('formStatus');
        const originalText = btn.innerText;

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();

        btn.innerText = 'Sending...';
        btn.disabled = true;
        if (statusEl) {
            statusEl.textContent = '';
            statusEl.style.color = '';
        }

        try {
            const res = await fetch('/api/booking', {
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

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Enquiry send failed.');
            }

            btn.innerText = 'Enquiry Sent';
            if (statusEl) {
                statusEl.textContent = 'Enquiry sent successfully. We will be in touch shortly.';
                statusEl.style.color = '#aaffaa';
            }
            form.reset();
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
                btn.innerText = originalText;
            }, 4000);
        }
    });
}

function simulateGoogleLogin() {
    const status = document.getElementById('login-status');
    if (status) status.innerText = "CONNECTING TO GOOGLE...";
    setTimeout(() => {
        enterClientHub({ name: "Google User", identifier: "user@gmail.com" });
    }, 1000);
}

async function enterClientHub(customer) {
    currentUser = customer.identifier;
    const status = document.getElementById('login-status');
    if (status) status.textContent = 'ACCESS GRANTED. INITIALIZING HUB...';

    // Fetch Initiatives
    let bookings = [];
    try {
        const res = await fetch(`/api/customer/bookings?identifier=${encodeURIComponent(currentUser)}`);
        bookings = await res.json();
    } catch (err) {
        console.error("Hub data sync failure.");
    }

    gsap.to('#login-form-container', {
        opacity: 0, y: -20, onComplete: () => {
            const clientForms = document.getElementById('customerLoginForm');
            const verifyForm = document.getElementById('otpVerifyForm');
            const empForm = document.getElementById('employeeLoginForm');
            const forgotForm = document.getElementById('forgotPassForm');
            const resetForm = document.getElementById('resetPassForm');
            
            if (clientForms) clientForms.style.display = 'none';
            if (verifyForm) verifyForm.style.display = 'none';
            if (empForm) empForm.style.display = 'none';
            if (forgotForm) forgotForm.style.display = 'none';
            if (resetForm) resetForm.style.display = 'none';

            const placeholder = document.querySelector('.dashboard-placeholder');
            if (placeholder) {
                const bookingCards = bookings.length > 0 ? bookings.map(b => `
                    <div style="border: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; background: rgba(255,255,255,0.02); margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <div style="font-size: 0.8rem; letter-spacing: 2px;">${b.service ? b.service.toUpperCase() : 'INITIATIVE'}</div>
                            <div style="font-size: 0.6rem; color: #E5E4E2; opacity: 0.6;">ID: ${b.id}</div>
                        </div>
                        <div style="height: 2px; width: 100%; background: rgba(255,255,255,0.1); margin-bottom: 1rem; position: relative;">
                            <div style="height: 100%; width: ${b.progress}%; background: #E5E4E2; box-shadow: 0 0 10px #E5E4E2;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.6rem; opacity: 0.5;">
                            <span>STATUS: ${b.status ? b.status.toUpperCase() : 'PENDING'}</span>
                            <span>PROGRESS: ${b.progress}%</span>
                        </div>
                    </div>
                `).join('') : '<div style="opacity: 0.4; font-size: 0.8rem;">NO ACTIVE INITIATIVES DETECTED.</div>';

                placeholder.innerHTML = `
                    <div style="font-family: var(--font-display); font-size: 2rem; margin-bottom: 2rem; letter-spacing: 4px;">SYSTEM ACCESS: ${customer.name.toUpperCase()}</div>
                    
                    <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 3rem; text-align: left;">
                        <div>
                            <div style="font-size: 0.6rem; letter-spacing: 3px; opacity: 0.4; margin-bottom: 2rem;">ONGOING INITIATIVES</div>
                            ${bookingCards}
                        </div>
                        <div>
                            <div style="font-size: 0.6rem; letter-spacing: 3px; opacity: 0.4; margin-bottom: 2rem;">SECURITY ARRAY</div>
                            <div style="border: 1px solid rgba(255,255,255,0.1); padding: 1.5rem; margin-bottom: 1rem;">
                                <div style="font-size: 0.6rem; opacity: 0.4; margin-bottom: 0.5rem;">CONNECTION</div>
                                <div style="font-size: 0.9rem; color: #00FF00;">ENCRYPTED / STABLE</div>
                            </div>
                            <div style="border: 1px solid rgba(255,255,255,0.1); padding: 1.5rem;">
                                <div style="font-size: 0.6rem; opacity: 0.4; margin-bottom: 0.5rem;">NEXT AUDIT</div>
                                <div style="font-size: 0.9rem;">60 DAYS REMAINING</div>
                            </div>
                        </div>
                    </div>
                `;
                placeholder.style.display = 'block';
                gsap.fromTo(placeholder, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: 'power4.out' });
            }
        }
    });
}

// Updated Login Logic
const empLoginForm = document.getElementById('employeeLoginForm');
if (empLoginForm) {
    empLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('loginUser').value;
        const pass = document.getElementById('loginPass').value;
        const status = document.getElementById('login-status');
        if (status) status.innerText = "AUTHENTICATING...";

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, pass })
            });
            const data = await res.json();
            if (data.success) {
                if (data.role === 'ceo') {
                    sessionStorage.setItem('employeeUser', user);
                    window.location.href = 'c-dashboard.html';
                    return;
                }

                sessionStorage.setItem('employeeUser', user);
                if (status) status.innerText = "ACCESS GRANTED. INITIALIZING WORK HUB...";
                setTimeout(() => {
                    window.location.href = 'e-dashboard.html';
                }, 500);
            } else {
                if (status) status.innerText = "INVALID SEQUENCE";
                gsap.fromTo('#employeeLoginForm', { x: -5 }, { x: 5, repeat: 5, yoyo: true, duration: 0.05 });
            }
        } catch (err) {
            if (status) status.innerText = "SYSTEM FAILURE";
        }
    });
}
