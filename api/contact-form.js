// /api/contact-form.js
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Email validation - strict regex to prevent header injection
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Input length limits
    if (firstName.length > 100 || lastName.length > 100 || (subject && subject.length > 200) || message.length > 5000 || (phone && phone.length > 30)) {
      return res.status(400).json({ error: "One or more fields exceed maximum length" });
    }

    // Escape HTML for safe email display
    const escapeHtml = (str) => {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const safeFirstName = escapeHtml(firstName.trim());
    const safeLastName = escapeHtml(lastName.trim());
    const safeEmail = escapeHtml(email.trim());
    const safePhone = escapeHtml((phone || "Not provided").trim());
    const safeSubject = escapeHtml((subject || "No subject").trim());
    const safeMessage = escapeHtml(message.trim()).replace(/\n/g, "<br>");

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return res.status(500).json({ error: "Email service not configured" });
    }

    // Send email to owner via Resend REST API
    const ownerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Lukemanbnb Contact <onboarding@resend.dev>",
        to: ["info@lukemanbnb.com"],
        subject: `New Contact Form: ${safeSubject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${safeFirstName} ${safeLastName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Phone:</strong> ${safePhone}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <p><strong>Message:</strong></p>
          <p>${safeMessage}</p>
        `,
      }),
    });

    if (!ownerResponse.ok) {
      const ownerError = await ownerResponse.json();
      console.error("Failed to send owner email:", ownerError);
      return res.status(500).json({ error: "Failed to send email" });
    }

    // Send confirmation email to user
    const userResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Lukemanbnb <onboarding@resend.dev>",
        to: [safeEmail],
        subject: "We received your message!",
        html: `
          <h1>Thank you for contacting us, ${safeFirstName}!</h1>
          <p>We have received your message and will get back to you as soon as possible.</p>
          <p><strong>Your message:</strong></p>
          <p>${safeMessage}</p>
          <br>
          <p>Best regards,<br>The Lukemanbnb Team</p>
        `,
      }),
    });

    if (!userResponse.ok) {
      const userError = await userResponse.json();
      console.error("Failed to send confirmation email:", userError);
      // Don't fail the request if confirmation email fails
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully!",
    });
  } catch (error) {
    console.error("Error in contact-form API:", error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({
      error: "Failed to send message. Please try again later.",
    });
  }
}
