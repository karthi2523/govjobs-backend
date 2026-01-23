import express from "express";
import { Resend } from "resend";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/contact
 */
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      message: "Missing required fields",
    });
  }

  try {
    await resend.emails.send({
      from: "All Government Alerts <onboarding@resend.dev>",
      to: ["all.government.alerts@gmail.com"],
      reply_to: email,
      subject: subject || "New Contact Message",
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || "-"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    return res.status(200).json({
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("❌ Resend error:", error);
    return res.status(500).json({
      message: "Failed to send message",
    });
  }
});

export default router;
