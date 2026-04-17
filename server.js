require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Multer Config
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

// File Paths
const EMPLOYEES_FILE = path.join(__dirname, 'employees.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
const CUSTOMERS_FILE = path.join(__dirname, 'customers.json');
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');

// Helper functions for data persistence
const getEmployees = () => {
    try { return JSON.parse(fs.readFileSync(EMPLOYEES_FILE, 'utf8')); }
    catch (err) { return []; }
};
const saveEmployees = (employees) => {
    fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(employees, null, 4));
};

const getMessages = () => {
    try { return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8')); }
    catch (err) { return []; }
};
const saveMessages = (messages) => {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 4));
};

const getCustomers = () => {
    try { return JSON.parse(fs.readFileSync(CUSTOMERS_FILE, 'utf8')); }
    catch (err) { return []; }
};
const saveCustomers = (customers) => {
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 4));
};

const getBookings = () => {
    try { return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8')); }
    catch (err) { return []; }
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

const sendEmail = async (options) => {
    try {
        await transporter.sendMail(options);
        return { success: true };
    } catch (error) {
        console.error('EMAIL DISPATCH ERROR:', error);
        return { success: false, error };
    }
};

// OTP Forge
const pendingOtps = {};
const pendingSignUps = {}; 

// Serve static frontend files
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });
    const mailOptions = {
        from: `"Signature Developers" <${process.env.EMAIL_USER}>`,
        replyTo: `"${name}" <${email}>`,
        to: process.env.CONTACT_EMAIL || 'signaturedevelopersofficial@gmail.com',
        subject: `[ENQUIRY] New message from ${name}`,
        text: `NEW ENQUIRY FROM ${name}\n\nEmail: ${email}\n\nMessage:\n${message}`
    };
    const result = await sendEmail(mailOptions);
    if (result.success) res.status(200).json({ success: true, message: 'Message sent!' });
    else res.status(500).json({ success: false, error: 'Email failed' });
});

app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === process.env.CEO_USER && pass === process.env.CEO_PASS) {
        return res.status(200).json({ success: true, role: 'ceo', message: 'Granted' });
    }
    const employees = getEmployees();
    const employee = employees.find(e => e.user === user && e.pass === pass);
    if (employee) return res.status(200).json({ success: true, role: 'employee' });
    else return res.status(401).json({ success: false });
});

app.get('/api/employees', (req, res) => res.status(200).json(getEmployees()));

app.post('/api/employees', (req, res) => {
    const { user, pass, name, role, position, photo } = req.body;
    const employees = getEmployees();
    const index = employees.findIndex(e => e.user === user);
    if (index > -1) {
        employees[index] = { ...employees[index], pass, name, role, position, photo };
    } else {
        employees.push({ id: Date.now(), user, pass, name, role: role || 'employee', position: position || 'Team', photo: photo || null, status: 'Online', joined: new Date().toISOString().split('T')[0] });
    }
    saveEmployees(employees);
    res.status(200).json({ success: true });
});

app.post('/api/employees/upload-photo', uploadEmployeePhoto.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    res.status(200).json({ success: true, photoUrl: `/uploads/employees/${req.file.filename}` });
});

app.delete('/api/employees/:user', (req, res) => {
    let employees = getEmployees();
    employees = employees.filter(e => e.user !== req.params.user);
    saveEmployees(employees);
    res.status(200).json({ success: true });
});

app.get('/api/messages', (req, res) => {
    const { user, role } = req.query;
    const messages = getMessages();
    if (role === 'ceo') return res.status(200).json(messages);
    const filtered = messages.filter(m => m.isPublic || m.to === user || m.from === user);
    res.status(200).json(filtered);
});

app.post('/api/messages', (req, res) => {
    const { from, to, content, isPublic } = req.body;
    const messages = getMessages();
    messages.push({ id: Date.now(), from, to: isPublic ? 'Global' : to, content, timestamp: new Date().toISOString(), isPublic: !!isPublic });
    saveMessages(messages);
    res.status(200).json({ success: true });
});

app.post('/api/customer/signup-initiate', async (req, res) => {
    const { identifier, name, password } = req.body;
    const customers = getCustomers();
    if (customers.find(c => c.identifier === identifier)) return res.status(400).json({ message: 'Exists' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    pendingSignUps[identifier] = { name, password, otp, expires: Date.now() + 600000 };
    await sendEmail({ from: `"SIGNATURE HUB" <${process.env.EMAIL_USER}>`, to: identifier, subject: "OTP", text: `OTP: ${otp}` });
    res.status(200).json({ success: true });
});

app.post('/api/customer/login', async (req, res) => {
    const { identifier, password } = req.body;
    const customers = getCustomers();
    const customer = customers.find(c => c.identifier === identifier && c.password === password);
    if (!customer) return res.status(401).json({ success: false });
    res.status(200).json({ success: true, customer });
});

app.post('/api/customer/forgot-password', async (req, res) => {
    const { identifier } = req.body;
    const customers = getCustomers();
    const customer = customers.find(c => c.identifier === identifier);
    if (!customer) return res.status(404).json({ message: 'Not found' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    pendingOtps[identifier] = { otp, expires: Date.now() + 300000 };
    await sendEmail({ from: `"SIGNATURE SECURITY" <${process.env.EMAIL_USER}>`, to: identifier, subject: "Recovery", text: `OTP: ${otp}` });
    res.status(200).json({ message: 'Sent' });
});

app.post('/api/customer/reset-password', (req, res) => {
    const { identifier, otp, newPassword } = req.body;
    const record = pendingOtps[identifier];
    if (record && record.otp === otp && Date.now() < record.expires) {
        let customers = getCustomers();
        const index = customers.findIndex(c => c.identifier === identifier);
        if (index !== -1) {
            customers[index].password = newPassword;
            saveCustomers(customers);
            delete pendingOtps[identifier];
            return res.json({ success: true });
        }
    }
    res.status(400).json({ success: false });
});

app.post('/api/customer/verify', (req, res) => {
    const { identifier, otp } = req.body;
    const signupData = pendingSignUps[identifier];
    if (signupData && signupData.otp === otp && Date.now() < signupData.expires) {
        const customers = getCustomers();
        const customer = { id: Date.now(), identifier, name: signupData.name, password: signupData.password, joined: new Date().toISOString().split('T')[0], status: 'Verified' };
        customers.push(customer);
        saveCustomers(customers);
        delete pendingSignUps[identifier];
        return res.status(200).json({ success: true, customer });
    }
    res.status(401).json({ success: false });
});

app.get('/api/customer/bookings', (req, res) => {
    const bookings = getBookings();
    res.status(200).json(bookings.filter(b => b.identifier === req.query.identifier));
});

app.get('/api/admin/customers', (req, res) => res.status(200).json(getCustomers()));

app.post('/api/booking', async (req, res) => {
    const { service, name, company, vision, identifier } = req.body;
    const bookings = getBookings();
    const newBooking = { id: Date.now(), service, name, company: company || 'N/A', vision, identifier: identifier || null, status: 'Initiated', progress: 10, timestamp: new Date().toISOString() };
    bookings.push(newBooking);
    saveBookings(bookings);
    await sendEmail({ from: `"SIGNATURE" <${process.env.EMAIL_USER}>`, to: process.env.CONTACT_EMAIL || 'signaturedevelopersofficial@gmail.com', subject: "NEW BOOKING", text: `Client: ${name}\nService: ${service}\nVision: ${vision}` });
    res.status(200).json({ success: true, bookingId: newBooking.id });
});

// Direct Page Routes
app.get('/web-dev.html', (req, res) => res.sendFile('web-dev.html', { root: __dirname }));
app.get('/app-dev.html', (req, res) => res.sendFile('app-dev.html', { root: __dirname }));
app.get('/marketing.html', (req, res) => res.sendFile('marketing.html', { root: __dirname }));
app.get('/c-dashboard.html', (req, res) => res.sendFile('c-dashboard.html', { root: __dirname }));
app.get('/', (req, res) => res.sendFile('index.html', { root: __dirname }));

// Start Server locally
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
