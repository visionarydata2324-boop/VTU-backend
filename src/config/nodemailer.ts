// import { createTransport, Transporter } from "nodemailer";
// import { configDotenv } from "dotenv";
// import { logger } from "../utils/logger";
// import { AppError } from "../utils/HandleErrors";

// configDotenv();

// export const transporter: Transporter = createTransport({
//   host: process.env.EMAIL_HOST,
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.BREVO_PASS, // Consider OAuth2
//   },
//   debug: process.env.NODE_ENV === "developement", // Enable debug in development
//   logger: process.env.NODE_ENV === "development", // Enable logger in development
//    tls: {
//     rejectUnauthorized: true // Only use this in testing environments
//   },
// });

// async function verifyTransporterConnection() {
//   try {
//     await transporter.verify();
//     logger.info("Email service connection established");
//   } catch (error: unknown) {
//     let errorMessage = "Email service connection failed";
//     if (error instanceof Error) {
//       errorMessage += `: ${error.message}`;
//     }
//     logger.error(errorMessage, error);
//     throw new AppError(errorMessage, 200);
//   }
// }

// // Immediately test the connection
// verifyTransporterConnection();

// export interface MailOptions {
//   from: string;
//   to: string;
//   subject: string;
//   text: string;
// }