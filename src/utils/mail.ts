import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendResetEmail = async (to: string, link: string) => {
  await transporter.sendMail({
    from: `"BMS Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Password Reset",

    text: "Click below to reset your password",

    html: `
      <h3>Password Reset</h3>

      <p>Click the button below to reset your password (expires in 1 hour):</p>

      <a href="${link}">
          Click to reset password
        </a>
    `,
  });
};