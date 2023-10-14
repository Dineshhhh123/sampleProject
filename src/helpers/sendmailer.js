const mailTransporter = require("../configs/sendmailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

const sendMail = (from, to, subject, templatePath, dynamicdata) => {
  const temPath = path.resolve(__dirname, templatePath);
  const emailTemplateSource = fs.readFileSync(temPath, "utf8");

  // Create a Handlebars template function
  const emailTemplate = handlebars.compile(emailTemplateSource);

  // Create the email message
  const mailOptions = {
    from: from,
    to: to,
    subject: subject,
    html: emailTemplate(dynamicdata),
  };

  // Send the email
  mailTransporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

module.exports = sendMail;
