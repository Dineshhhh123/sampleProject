const nodemailer = require("nodemailer");

// Create a transporter object with your email service configuration

const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_ACCOUNT,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

module.exports = mailTransporter;
