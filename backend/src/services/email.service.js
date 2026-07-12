require("dotenv").config();
const nodemailer = require("nodemailer");

const requiredEmailEnvVars = [
    "EMAIL_USER",
    "EMAIL_CLIENT_ID",
    "EMAIL_CLIENT_SECRET",
    "EMAIL_REFRESH_TOKEN",
];

const isEmailConfigured = () =>
    requiredEmailEnvVars.every((key) => {
        const value = process.env[key];
        return value && !value.startsWith("your_");
    });

let transporter;

const getTransporter = () => {
    if (!isEmailConfigured()) {
        return null;
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.EMAIL_USER,
                clientId: process.env.EMAIL_CLIENT_ID,
                clientSecret: process.env.EMAIL_CLIENT_SECRET,
                refreshToken: process.env.EMAIL_REFRESH_TOKEN,
            },
        });
    }

    return transporter;
};

const sendEmail = async (to, subject, text, html) => {
    const mailer = getTransporter();

    if (!mailer) {
        console.info("Email service is not configured; skipping email notification.");
        return;
    }

    try {
        await mailer.sendMail({
            from: `"transitOps" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
    } catch (error) {
        console.error("Error sending email:", error.message);
    }
};

async function sendRegistrationEmail(email, name) {
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const subject = "Welcome to transitOps 🚛";
    const text = `Hello ${name}, welcome to transitOps! Your account was created on ${now}.`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #2563eb;">Welcome to transitOps 🚛</h2>
            <p>Hello <b>${name}</b>,</p>
            <p>Your transitOps account has been created successfully.</p>
            <p><strong>Registration Date:</strong> ${now}</p>
            <hr style="border: 1px solid #e5e7eb;" />
            <p style="color: #6b7280; font-size: 12px;">transitOps - Modular Fleet & Logistics Management System</p>
        </div>
    `;
    await sendEmail(email, subject, text, html);
}

async function sendLoginEmail(email, name) {
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const subject = "Login Alert - transitOps";
    const text = `Hello ${name}, a login to your transitOps account was detected on ${now}.`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #2563eb;">Login Alert 🔐</h2>
            <p>Hello <b>${name}</b>,</p>
            <p>A login to your transitOps account was detected.</p>
            <p><strong>Login Date & Time:</strong> ${now}</p>
            <p>If this wasn't you, please contact your administrator immediately.</p>
            <hr style="border: 1px solid #e5e7eb;" />
            <p style="color: #6b7280; font-size: 12px;">transitOps - Modular Fleet & Logistics Management System</p>
        </div>
    `;
    await sendEmail(email, subject, text, html);
}

async function sendForgotPasswordEmail(email, name) {
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const subject = "Password Reset - transitOps";
    const text = `Hello ${name}, a password reset was requested for your transitOps account on ${now}.`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #2563eb;">Password Reset Request 🔑</h2>
            <p>Hello <b>${name}</b>,</p>
            <p>A password reset was requested for your account.</p>
            <p><strong>Requested at:</strong> ${now}</p>
            <p>If you did not request this, please ignore this email.</p>
            <hr style="border: 1px solid #e5e7eb;" />
            <p style="color: #6b7280; font-size: 12px;">transitOps - Modular Fleet & Logistics Management System</p>
        </div>
    `;
    await sendEmail(email, subject, text, html);
}

module.exports = {
    sendRegistrationEmail,
    sendLoginEmail,
    sendForgotPasswordEmail,
};