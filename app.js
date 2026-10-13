
import "dotenv/config";
import express, { json, urlencoded } from "express";
import { createTransport } from "nodemailer";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = process.env.PORT || 3000;

// ES Modules equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse JSON and form data
app.use(json());
app.use(urlencoded({ extended: true }));

// Configure EJS
app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));

// Configure Gmail SMTP
const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify SMTP configuration when the server starts
transporter
  .verify()
  .then(() => {
    console.log("Gmail SMTP connection is ready");
  })
  .catch((error) => {
    console.error("Gmail SMTP configuration error:", error.message);
  });

// Health check
app.get("/", (req, res) => {
  res.send("Email server is running");
});

// Send email endpoint

app.post("/send-email", async (req, res) => {
  try {
    console.log("Received request body:", req.body);

    // Check whether the request body exists
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Request body is missing. Send JSON data.",
      });
    }

    const { to, name } = req.body;

    if (
      typeof to !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) ||
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email and name.",
      });
    }

    // Keep your existing EJS rendering and Nodemailer code here.
    // Example:
    const emailData = {
      companyName: "My Company",
      user: {
        name: name.trim(),
        email: to,
      },
      dashboardUrl: "https://example.com/dashboard",
      year: new Date().getFullYear(),
    };

    const html = await new Promise((resolve, reject) => {
      res.app.render(
        "email",
        emailData,
        (error, renderedHtml) => {
          if (error) return reject(error);
          resolve(renderedHtml);
        }
      );
    });

    const info = await transporter.sendMail({
      from: {
        name: "My Company",
        address: process.env.GMAIL_USER,
      },
      to,
      subject: "Welcome to My Company",
      html,
      text: `Hello ${name.trim()}, your account has been created successfully.`,
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Email sending failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send email",
    });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
