require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Multer: Store employee photos in /uploads/employees
const employeePhotoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'uploads', 'employees');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `emp_${Date.now()}${ext}`);
    }
});
const uploadEmployeePhoto = multer({ storage: employeePhotoStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

const EMPLOYEES_FILE = path.join(__dirname, 'employees.json');

// Helper to read employees
const getEmployees = () => {
    try {
        const data = fs.readFileSync(EMPLOYEES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// Helper to save employees
const saveEmployees = (employees) => {
    fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(employees, null, 4));
};

const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// Helper to read messages
const getMessages = () => {
    try {
        const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// Helper to save messages
const saveMessages = (messages) => {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 4));
};

const CUSTOMERS_FILE = path.join(__dirname, 'customers.json');
const getCustomers = () => {
    try {
        const data = fs.readFileSync(CUSTOMERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};
const saveCustomers = (customers) => {
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 4));
};

const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');
const getBookings = () => {
    try {
        const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};
const saveBookings = (bookings) => {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 4));
};

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper to send emails
const sendEmail = async (options) => {
    try {
        await transporter.sendMail(options);
        return { success: true };
    } catch (error) {
        console.error('EMAIL DISPATCH ERROR:', error);
        return { success: false, error };
    }
};

// OTP Forge (In-memory)
const pendingOtps = {};
const pendingSignUps = {}; // { identifier: { name, password, expires } } 

// Serve static frontend files (the index.html)
app.use(express.static(path.join(__dirname)));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Contact Form Endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    // Validate inputs
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    const mailOptions = {
        // Gmail SMTP requires 'from' to be the authenticated account.
        // Use replyTo so you can reply directly to the visitor.
        from: `"Signature Developers" <${process.env.EMAIL_USER}>`,
        replyTo: `"${name}" <${email}>`,
        to: process.env.CONTACT_EMAIL || 'signaturedevelopersofficial@gmail.com',
        subject: `[ENQUIRY] New message from ${name}`,
        text: `
NEW ENQUIRY — SIGNATURE DEVELOPERS WEBSITE

Name    : ${name}
Email   : ${email}

Message:
${message}

---
Reply to this email to respond directly to ${name}.
`
    };

    // Await the send so failures are caught and returned to the frontend
    const result = await sendEmail(mailOptions);

    if (result.success) {
        res.status(200).json({ success: true, message: 'Message sequence initiated successfully!' });
    } else {
        console.error('Contact email dispatch failed:', result.error);
        res.status(500).json({ success: false, error: 'Email dispatch failed. Please try again.' });
    }
});

// Employee/CEO Login Endpoint
app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;

    // 1. CEO Check (Level 0)
    if (user === process.env.CEO_USER && pass === process.env.CEO_PASS) {
        return res.status(200).json({ success: true, role: 'ceo', message: 'Mission Control Access Granted' });
    }

    // 2. Dynamic Employee Check (Level 1)
    const employees = getEmployees();
    const employee = employees.find(e => e.user === user && e.pass === pass);

    if (employee) {
        return res.status(200).json({ success: true, role: 'employee', message: 'Access granted' });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid sequence' });
    }
});

// Employee Management API (CEO ONLY)
app.get('/api/employees', (req, res) => {
    // In a real app, verify CEO token/session here
    res.status(200).json(getEmployees());
});

app.post('/api/employees', (req, res) => {
    const { user, pass, name, role, position, photo } = req.body;
    const employees = getEmployees();

    const index = employees.findIndex(e => e.user === user);
    if (index > -1) {
        employees[index] = {
            ...employees[index], pass, name,
            role: role || employees[index].role,
            position: position || employees[index].position,
            photo: photo || employees[index].photo
        };
    } else {
        employees.push({
            id: Date.now(), user, pass, name,
            role: role || 'employee',
            position: position || 'Team Member',
            photo: photo || null,
            status: 'Online',
            joined: new Date().toISOString().split('T')[0]
        });
    }

    saveEmployees(employees);
    res.status(200).json({ success: true, message: 'Workforce records updated.' });
});

// Employee Photo Upload
app.post('/api/employees/upload-photo', uploadEmployeePhoto.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const photoUrl = `/uploads/employees/${req.file.filename}`;
    res.status(200).json({ success: true, photoUrl });
});

app.delete('/api/employees/:user', (req, res) => {
    const target = req.params.user;
    let employees = getEmployees();
    employees = employees.filter(e => e.user !== target);
    saveEmployees(employees);
    res.status(200).json({ success: true, message: 'Member decommissioned.' });
});

// Messaging API
app.get('/api/messages', (req, res) => {
    const { user, role } = req.query;
    const messages = getMessages();

    if (role === 'ceo') {
        return res.status(200).json(messages);
    }

    // Employees see public messages OR messages to/from them
    const filtered = messages.filter(m =>
        m.isPublic || m.to === user || m.from === user
    );
    res.status(200).json(filtered);
});

app.post('/api/messages', (req, res) => {
    const { from, to, content, isPublic } = req.body;
    const messages = getMessages();

    const newMessage = {
        id: Date.now(),
        from,
        to: isPublic ? 'Global' : to,
        content,
        timestamp: new Date().toISOString(),
        isPublic: !!isPublic
    };

    messages.push(newMessage);
    saveMessages(messages);
    res.status(200).json({ success: true, message: 'Message transmitted.' });
});

// Customer Authentication Protocol
app.post('/api/customer/signup-initiate', async (req, res) => {
    const { identifier, name, password } = req.body;
    if (!identifier || !name || !password) return res.status(400).json({ message: 'Missing metadata.' });

    const customers = getCustomers();
    if (customers.find(c => c.identifier === identifier)) {
        return res.status(400).json({ success: false, message: 'Identity node already exists.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    pendingSignUps[identifier] = { name, password, otp, expires: Date.now() + 600000 };

    const mailOptions = {
        from: `"SIGNATURE HUB" <${process.env.EMAIL_USER}>`,
        to: identifier,
        subject: "WELCOMING: CLIENT PORTAL INITIALIZATION",
        text: `WELCOME TO SIGNATURE DEVELOPERS\n\nGreetings ${name},\n\nWe are initializing your access to the Signature Developers Client Hub.\nUse the following 6-digit pulse to verify your identity and finalize your registration:\n\nVERIFICATION SEQUENCE: ${otp}\n\nWelcome to the future by design.`
    };

    const result = await sendEmail(mailOptions);
    console.log(`[ONBOARDING PULSE] OTP for ${identifier}: ${otp}`);
    res.status(200).json({ success: true, message: 'ONBOARDING SEQUENCE DISPATCHED. VERIFY OTP.' });
});

// Legacy endpoint removed - consolidated into /api/customer/verify

app.post('/api/customer/login', async (req, res) => {
    const { identifier, password } = req.body;
    const customers = getCustomers();
    const customer = customers.find(c => c.identifier === identifier && c.password === password);

    if (!customer) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const lastVerified = new Date(customer.lastVerified || 0);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - lastVerified) / (1000 * 60 * 60 * 24));

    if (diffDays > 60) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        pendingOtps[identifier] = { otp, expires: Date.now() + 300000 };

        await sendEmail({
            from: `"SIGNATURE SECURITY" <${process.env.EMAIL_USER}>`,
            to: identifier,
            subject: "SECURITY: HUB ACCESS RE-VERIFICATION",
            text: `SECURITY PROTOCOL ACTIVATED\n\nYour session requires re-verification. Use the following sequence:\n\nSEQUENCE: ${otp}`
        });

        console.log(`[RE-VERIFICATION PULSE] OTP for ${identifier}: ${otp}`);
        return res.status(200).json({ success: true, requiresReverification: true, message: 'Security threshold reached. Verification pulse dispatched.' });
    }

    res.status(200).json({ success: true, customer, message: 'Session established.' });
});

// Customer Forgot Password
app.post('/api/customer/forgot-password', async (req, res) => {
    const { identifier } = req.body;
    const customers = getCustomers();
    const customer = customers.find(c => c.identifier === identifier);

    if (!customer) {
        return res.status(404).json({ message: 'IDENTIFIER NOT FOUND IN ECOSYSTEM.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    pendingOtps[identifier] = {
        otp,
        expires: Date.now() + 300000 // 5 minutes for recovery
    };

    // Automated Recovery Email
    const mailOptions = {
        from: `"SIGNATURE SECURITY" <${process.env.EMAIL_USER}>`,
        to: identifier,
        subject: "SECURITY: CREDENTIAL RECOVERY PULSE",
        text: `
SECURITY ALERT / SIGNATURE DEVELOPERS

A credential recovery sequence has been initiated for your account.
Use the following 6-digit pulse to reconfigure your security credentials:

SEQUENCE: ${otp}

If you did not initiate this request, please contact our security array immediately.
`
    };

    const result = await sendEmail(mailOptions);
    if (result.success) {
        console.log(`[RECOVERY PULSE] OTP for ${identifier}: ${otp}`);
        res.status(200).json({ message: 'RECOVERY SEQUENCE DISPATCHED.' });
    } else {
        res.status(500).json({ message: 'DISPATCH FAILURE. ATTEMPT RECOVERY LATER.' });
    }
});

// Customer Reset Password
app.post('/api/customer/reset-password', (req, res) => {
    const { identifier, otp, newPassword } = req.body;
    const record = pendingOtps[identifier];

    if (record && record.otp === otp && Date.now() < record.expires) {
        let customers = getCustomers();
        const index = customers.findIndex(c => c.identifier === identifier);

        if (index !== -1) {
            customers[index].password = newPassword;
            customers[index].lastVerified = new Date().toISOString();
            saveCustomers(customers);

            delete pendingOtps[identifier];
            return res.json({ success: true, message: 'CREDENTIALS RECONFIGURED.', customer: customers[index] });
        }
    }

    res.status(400).json({ success: false, message: 'INVALID OR EXPIRED RECOVERY SEQUENCE.' });
});

app.post('/api/customer/verify', (req, res) => {
    const { identifier, otp } = req.body;

    // Check Signup Queue
    const signupData = pendingSignUps[identifier];
    if (signupData && signupData.otp === otp && Date.now() < signupData.expires) {
        const customers = getCustomers();
        const customer = {
            id: Date.now(),
            identifier,
            name: signupData.name,
            password: signupData.password,
            joined: new Date().toISOString().split('T')[0],
            lastVerified: new Date().toISOString(),
            status: 'Verified'
        };
        customers.push(customer);
        saveCustomers(customers);
        delete pendingSignUps[identifier];
        return res.status(200).json({ success: true, customer, message: 'IDENTITY VERIFIED. HUB SYNC COMPLETE.' });
    }

    // Check Re-verification/OTP Queue
    const record = pendingOtps[identifier];
    if (record && record.otp === otp && Date.now() < record.expires) {
        const customers = getCustomers();
        const index = customers.findIndex(c => c.identifier === identifier);
        if (index > -1) {
            customers[index].lastVerified = new Date().toISOString();
            customers[index].status = 'Verified';
            saveCustomers(customers);
            delete pendingOtps[identifier];
            return res.status(200).json({ success: true, customer: customers[index], message: 'IDENTITY CONFIRMED.' });
        }
    }

    res.status(401).json({ success: false, message: 'INVALID OR EXPIRED VERIFICATION SEQUENCE.' });
});

// Client Lifecycle: Bookings & Projects
app.get('/api/customer/bookings', (req, res) => {
    const { identifier } = req.query;
    if (!identifier) return res.status(400).json({ error: 'Identifier required.' });

    const bookings = getBookings();
    const clientBookings = bookings.filter(b => b.identifier === identifier);
    res.status(200).json(clientBookings);
});

// Admin: Client Relations Management (CRM)
app.get('/api/admin/customers', (req, res) => {
    const { user, role } = req.query;

    if (role === 'ceo') {
        return res.status(200).json(getCustomers());
    }

    // Check employee permissions
    const employees = getEmployees();
    const emp = employees.find(e => e.user === user);

    if (emp && emp.canAccessClients) {
        return res.status(200).json(getCustomers());
    }

    res.status(403).json({ success: false, message: 'Access Denied: High Clearance Required' });
});

app.post('/api/admin/permissions', (req, res) => {
    const { targetUser, canAccessClients } = req.body;
    let employees = getEmployees();
    const index = employees.findIndex(e => e.user === targetUser);

    if (index > -1) {
        employees[index].canAccessClients = !!canAccessClients;
        saveEmployees(employees);
        return res.status(200).json({ success: true, message: 'Clearance level updated.' });
    }
    res.status(404).json({ success: false, message: 'Node not found.' });
});

app.delete('/api/admin/customers/:id', (req, res) => {
    const { id } = req.params;
    let customers = getCustomers();
    const initialLength = customers.length;
    customers = customers.filter(c => c.id !== parseInt(id));

    if (customers.length < initialLength) {
        saveCustomers(customers);
        return res.status(200).json({ success: true, message: 'Client node decommissioned.' });
    }
    res.status(404).json({ success: false, message: 'Client node not found.' });
});

app.patch('/api/admin/customers/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    let customers = getCustomers();
    const index = customers.findIndex(c => c.id === parseInt(id));

    if (index > -1) {
        customers[index] = { ...customers[index], ...updates };
        saveCustomers(customers);
        return res.status(200).json({ success: true, customer: customers[index] });
    }
    res.status(404).json({ success: false, message: 'Client node not found.' });
});

app.get('/api/admin/bookings', (req, res) => {
    res.status(200).json(getBookings());
});

app.patch('/api/admin/bookings/:id', (req, res) => {
    const { id } = req.params;
    const { status, progress } = req.body;
    let bookings = getBookings();
    const index = bookings.findIndex(b => b.id === parseInt(id));

    if (index > -1) {
        if (status) bookings[index].status = status;
        if (progress !== undefined) bookings[index].progress = progress;
        saveBookings(bookings);
        return res.status(200).json({ success: true, booking: bookings[index] });
    }
    res.status(404).json({ success: false, message: 'Booking entry not found.' });
});

// Service Booking Endpoint
app.post('/api/booking', async (req, res) => {
    const { service, name, company, vision, identifier } = req.body;

    if (!service || !name || !vision) {
        return res.status(400).json({ error: 'Missing critical metadata.' });
    }

    // Persist Booking
    const bookings = getBookings();
    const newBooking = {
        id: Date.now(),
        service,
        name,
        company: company || 'N/A',
        vision,
        identifier: identifier || null, // Link to client if logged in
        status: 'Initiated',
        progress: 10,
        timestamp: new Date().toISOString()
    };
    bookings.push(newBooking);
    saveBookings(bookings);

    const replyTarget = typeof identifier === 'string' && identifier.includes('@')
        ? `"${name}" <${identifier}>`
        : undefined;

    const isEnquiry = service === 'Website Enquiry';

    const mailOptions = {
        from: `"SIGNATURE BOOKING" <${process.env.EMAIL_USER}>`,
        to: process.env.CONTACT_EMAIL || 'signaturedevelopersofficial@gmail.com',
        subject: isEnquiry ? `[ENQUIRY] New enquiry from ${name}` : `[BOOKING] ${service} Request from ${name}`,
        ...(replyTarget ? { replyTo: replyTarget } : {}),
        text: `
${isEnquiry ? 'NEW WEBSITE ENQUIRY RECEIVED' : 'NEW BOOKING REQUEST RECEIVED'}

Service: ${service}
Client: ${name}
Company: ${company || 'N/A'}
Contact: ${identifier || 'N/A'}

${isEnquiry ? 'Enquiry:' : 'Vision:'}
${vision}

${isEnquiry
            ? 'This enquiry has been received from the website contact section.'
            : 'This request has been persisted in the ecosystem and is awaiting node assignment.'}
`
    };

    const emailResult = await sendEmail(mailOptions);

    if (!emailResult.success) {
        console.error('Booking email dispatch failed:', emailResult.error);
        return res.status(500).json({ success: false, error: 'Email dispatch failed. Please try again.' });
    }

    res.status(200).json({ success: true, message: 'Booking request transmitted and persisted.', bookingId: newBooking.id });
});

// Explicit routes for detail pages
app.get('/web-dev.html', (req, res) => {
    res.sendFile('web-dev.html', { root: __dirname });
});

app.get('/app-dev.html', (req, res) => {
    res.sendFile('app-dev.html', { root: __dirname });
});

app.get('/marketing.html', (req, res) => {
    res.sendFile('marketing.html', { root: __dirname });
});

app.get('/c-dashboard.html', (req, res) => {
    res.sendFile('c-dashboard.html', { root: __dirname });
});

// Fallback to serving the single-page application
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

// Wildcard fallback removed to fix Express 5 path-to-regexp anomaly
// app.get('(.*)', (req, res) => {
//     res.redirect('/');
// });

// Start Server
app.listen(PORT, () => {
    console.log(`Signature Developers Backend running on http://localhost:${PORT}`);
});
