import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Create transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or use SMTP settings
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Email options
    const mailOptions = {
        from: `SafarNama <${process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        html: options.html
    };

    // Send email
    await transporter.sendMail(mailOptions);
};

export default sendEmail;