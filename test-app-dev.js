const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('c:\\Users\\JOEL\\SIGNATURE\\app-dev.html', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
dom.window.onerror = function(message, source, lineno, colno, error) {
    console.log("JSDOM Error:", message);
}

setTimeout(() => {
    try {
        const form = dom.window.document.getElementById('bookingForm');
        const inputs = form.querySelectorAll('input, textarea');
        console.log("Inputs found:", inputs.length);
        console.log("Input 0:", inputs[0]?.placeholder);
        console.log("Input 1:", inputs[1]?.placeholder);
        console.log("Input 2:", inputs[2]?.placeholder);
        
        // Simulate clicking open booking
        dom.window.document.getElementById('open-booking').click();
        console.log("Booking clicked. Modal opacity:", dom.window.document.getElementById('booking-modal').style.opacity);
        process.exit(0);
    } catch(e) {
        console.log("Runtime exception:", e);
        process.exit(1);
    }
}, 3000);
