const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('c:\\Users\\JOEL\\SIGNATURE\\web-dev.html', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
dom.window.onerror = function(message, source, lineno, colno, error) {
    console.log("JSDOM Error:", message);
}
dom.window.requestAnimationFrame = function(cb) {
    // mock RAF so three.js doesn't crash jsdom
    return setTimeout(cb, 16);
};
dom.window.cancelAnimationFrame = function(id) {
    clearTimeout(id);
};

setTimeout(() => {
    try {
        console.log("Looking for open-booking element...");
        const btn = dom.window.document.getElementById('open-booking');
        if (!btn) {
            console.log("open-booking button NOT FOUND in DOM");
        } else {
            console.log("Button exists. Triggering click...");
            btn.click();
            const modal = dom.window.document.getElementById('booking-modal');
            console.log("Modal opacity after click:", modal.style.opacity);
            console.log("Modal visibility:", modal.style.visibility);
            
            // Check GSAP timeline
            setTimeout(() => {
                console.log("Modal opacity later:", dom.window.document.getElementById('booking-modal').style.opacity);
                process.exit(0);
            }, 1000);
        }
    } catch(e) {
        console.log("Runtime exception:", e);
        process.exit(1);
    }
}, 2000);
