model User {
    id            String  @id @default(cuid())
    name          String
    email         String  @unique
    emailVerified Boolean @default(false)

    role   Role       @default(USER)
    status UserStatus @default(ACTIVE)

    isDeleted Boolean   @default(false)
    deletedAt DateTime?

    image String?

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    // 🔐 Better Auth relations
    sessions Session[]
    accounts Account[]

    // 🎉 Planora relations
    events         Event[]         @relation("OrganizerEvents")
    participations Participation[]
    invitations    Invitation[]
    reviews        Review[]
    payments       Payment[]

    @@map("user")
}

model Session {
    id        String   @id
    expiresAt DateTime
    token     String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    ipAddress String?
    userAgent String?
    userId    String
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@unique([token])
    @@index([userId])
    @@map("session")
}

model Account {
    id                    String    @id
    accountId             String
    providerId            String
    userId                String
    user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    accessToken           String?
    refreshToken          String?
    idToken               String?
    accessTokenExpiresAt  DateTime?
    refreshTokenExpiresAt DateTime?
    scope                 String?
    password              String?
    createdAt             DateTime  @default(now())
    updatedAt             DateTime  @updatedAt

    @@index([userId])
    @@map("account")
}

model Verification {
    id         String   @id
    identifier String
    value      String
    expiresAt  DateTime
    createdAt  DateTime @default(now())
    updatedAt  DateTime @updatedAt

    @@index([identifier])
    @@map("verification")
}

enum Role {
    USER
    ADMIN
}

enum UserStatus {
    ACTIVE
    SUSPENDED
}

enum EventVisibility {
    PUBLIC
    PRIVATE
}

enum ParticipationStatus {
    PENDING
    APPROVED
    REJECTED
    BANNED
}

enum InvitationStatus {
    PENDING
    ACCEPTED
    DECLINED
}

enum PaymentStatus {
    PENDING
    SUCCESS
    FAILED
    REFUNDED
    CANCELED
    UNPAID
}

model Event {
     id          String          @id @default(cuid())
     title       String
     description String
     venue       String
     dateTime    DateTime
     visibility  EventVisibility
     fee         Float           @default(0)

     organizerId String
     organizer   User   @relation("OrganizerEvents", fields: [organizerId], references: [id])

     image String? // Add this field for event images

     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt

     participations Participation[]
     invitations    Invitation[]
     reviews        Review[]

     @@index([organizerId])
     @@index([visibility])
     @@index([dateTime])
     @@map("event")
}


model Invitation {
  id          String   @id @default(cuid())

  eventId     String
  userId      String

  status      InvitationStatus @default(PENDING)

  createdAt   DateTime @default(now())

  event       Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user        User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  payment     Payment[]

  @@unique([eventId, userId])   // prevent duplicate invites
  @@index([eventId])
  @@index([status])
  @@map("invitation")
}

model Participation {
  id          String   @id @default(cuid())

  userId      String
  eventId     String

  status      ParticipationStatus @default(PENDING)

  createdAt   DateTime @default(now())

  user        User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  event       Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  payment     Payment[]

  @@unique([userId, eventId])   // one join per user per event
  @@index([eventId])
  @@index([status])
  @@map("participation")
}
model Payment {
    id                 String        @id @default(uuid())
    amount             Float
    transactionId      String        @db.Uuid() @unique
    stripeEventId      String?       @unique
    status             PaymentStatus @default(PENDING)
    userId             String
    invoiceUrl         String?
    paymentGatewayData Json?
    createdAt          DateTime      @default(now())
    updatedAt          DateTime      @updatedAt

    // Payment for a Participation OR Invitation
    participationId    String?      
    participation      Participation? @relation(fields: [participationId], references: [id], onDelete: Cascade)

    invitationId       String?       
    invitation         Invitation?   @relation(fields: [invitationId], references: [id], onDelete: Cascade)

    user               User  @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([participationId])
    @@index([invitationId])
    @@index([transactionId])
    @@map("payments")
}


model Review {
  id        String   @id @default(cuid())

  rating    Int
  comment   String?

  userId    String
  eventId   String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  event     Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([userId, eventId])  // one review per user per event
  @@index([eventId])
  @@map("review")
}

// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client"
  output   = "../../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}




another project stripe webhook implement follow that to implement in my project :

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Payment Invoice - PH Healthcare</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }

        .container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: bold;
        }

        .header p {
            font-size: 14px;
            opacity: 0.9;
        }

        .content {
            padding: 40px 30px;
        }

        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
        }

        .info-box {
            background-color: #f9f9f9;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin-bottom: 25px;
            border-radius: 4px;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 14px;
        }

        .info-label {
            font-weight: 600;
            color: #333;
            min-width: 150px;
        }

        .info-value {
            color: #666;
            text-align: right;
        }

        .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-top: 30px;
            margin-bottom: 15px;
        }

        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
        }

        .details-box {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
        }

        .details-box p {
            margin-bottom: 8px;
            font-size: 14px;
        }

        .details-box .label {
            font-weight: 600;
            color: #333;
        }

        .amount-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 6px;
            margin: 25px 0;
            text-align: center;
        }

        .amount-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
        }

        .amount-value {
            font-size: 36px;
            font-weight: bold;
        }

        .payment-status {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            text-align: center;
            font-weight: 600;
        }

        .download-section {
            text-align: center;
            margin: 30px 0;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }

        .download-btn {
            display: inline-block;
            background-color: #667eea;
            color: white;
            padding: 12px 30px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: 600;
            transition: background-color 0.3s;
            font-size: 14px;
        }

        .download-btn:hover {
            background-color: #5568d3;
        }

        .footer {
            background-color: #f9f9f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #eee;
        }

        .footer p {
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
        }

        .footer a {
            color: #667eea;
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        .divider {
            height: 1px;
            background-color: #eee;
            margin: 25px 0;
        }

        @media (max-width: 600px) {
            .details-grid {
                grid-template-columns: 1fr;
            }

            .info-row {
                flex-direction: column;
            }

            .info-value {
                text-align: left;
                margin-top: 5px;
            }

            .amount-value {
                font-size: 28px;
            }

            .header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>INVOICE</h1>
            <p>Your Healthcare Payment Receipt</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Hello <%= patientName %>,
            </div>

            <p style="margin-bottom: 20px; color: #666; font-size: 14px;">
                Your payment for your consultation appointment has been successfully processed. Below is your payment invoice.
            </p>

            <!-- Invoice Details -->
            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Invoice ID:</span>
                    <span class="info-value"><strong><%= invoiceId %></strong></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Transaction ID:</span>
                    <span class="info-value"><%= transactionId %></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Payment Status:</span>
                    <span class="info-value" style="color: #28a745; font-weight: 600;">✓ PAID</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Payment Date:</span>
                    <span class="info-value"><%= paymentDate %></span>
                </div>
            </div>

            <!-- Doctor & Appointment Info -->
            <div class="section-title">Consultation Details</div>
            <div class="details-grid">
                <div class="details-box">
                    <p><span class="label">Doctor:</span></p>
                    <p><strong><%= doctorName %></strong></p>
                </div>
                <div class="details-box">
                    <p><span class="label">Appointment Date:</span></p>
                    <p><strong><%= appointmentDate %></strong></p>
                </div>
            </div>

            <!-- Amount Section -->
            <div class="section-title">Payment Summary</div>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
                <div class="info-row">
                    <span class="info-label">Consultation Fee:</span>
                    <span class="info-value"><strong><%= amount.toFixed(2) %> BDT</strong></span>
                </div>
            </div>

            <div class="amount-box">
                <div class="amount-label">Total Amount Paid</div>
                <div class="amount-value"><%= amount.toFixed(2) %> BDT</div>
            </div>

            <div class="payment-status">
                ✓ Payment Confirmed
            </div>

            <!-- Download Invoice -->
            <div class="download-section">
                <p style="margin-bottom: 15px; color: #666; font-size: 14px;">
                    Your invoice PDF is attached to this email for your records.
                </p>
                <% if (invoiceUrl) { %>
                    <a href="<%= invoiceUrl %>" class="download-btn">Download Invoice PDF</a>
                <% } %>
            </div>

            <div class="divider"></div>

            <!-- Additional Info -->
            <p style="font-size: 13px; color: #666; margin-bottom: 15px;">
                <strong>Next Steps:</strong><br>
                Your appointment has been confirmed. Please log in to your dashboard to view appointment details and prepare for your consultation.
            </p>

            <p style="font-size: 13px; color: #666;">
                If you have any questions regarding this payment or need assistance, please don't hesitate to contact our support team.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>PH Healthcare</strong></p>
            <p>Your Health, Our Priority</p>
            <p style="margin-top: 15px; font-size: 11px; color: #999;">
                &copy; 2026 PH Healthcare. All rights reserved.
            </p>
            <p style="margin-top: 10px;">
                <a href="https://ph-healthcare.com">Visit our website</a> | 
                <a href="mailto:support@ph-healthcare.com">Contact Support</a>
            </p>
            <p style="margin-top: 15px; font-size: 11px; color: #999;">
                This is an automatically generated email. Please do not reply directly to this email.
            </p>
        </div>
    </div>
</body>
</html>
import PDFDocument from 'pdfkit';

interface InvoiceData {
    invoiceId: string;
    patientName: string;
    patientEmail: string;
    doctorName: string;
    appointmentDate: string;
    amount: number;
    transactionId: string;
    paymentDate: string;
}

export const generateInvoicePdf = async (data: InvoiceData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
            });

            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => {
                chunks.push(chunk);
            });

            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });

            doc.on('error', (error) => {
                reject(error);
            });

            // Header
            doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', {
                align: 'center',
            });

            doc.moveDown(0.5);
            doc
                .fontSize(10)
                .font('Helvetica')
                .text('PH Healthcare Services', {
                    align: 'center',
                });
            doc.text('Your Health, Our Priority', { align: 'center' });

            doc.moveDown(1);

            // Horizontal line
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

            doc.moveDown(1);

            // Invoice Details - Left Column
            doc.fontSize(11).font('Helvetica-Bold').text('Invoice Information');
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Invoice ID: ${data.invoiceId}`)
                .text(`Payment Date: ${new Date(data.paymentDate).toLocaleDateString()}`)
                .text(`Transaction ID: ${data.transactionId}`);

            doc.moveDown(0.8);

            // Patient Information
            doc.fontSize(11).font('Helvetica-Bold').text('Patient Information');
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Name: ${data.patientName}`)
                .text(`Email: ${data.patientEmail}`);

            doc.moveDown(0.8);

            // Doctor Information
            doc.fontSize(11).font('Helvetica-Bold').text('Doctor Information');
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Name: ${data.doctorName}`);

            doc.moveDown(0.8);

            // Appointment Details
            doc.fontSize(11).font('Helvetica-Bold').text('Appointment Details');
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`Appointment Date: ${new Date(data.appointmentDate).toLocaleDateString()}`);

            doc.moveDown(1);

            // Horizontal line
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

            doc.moveDown(1);

            // Amount Table
            const tableTop = doc.y;
            const col1X = 50;
            const col2X = 450;

            doc.fontSize(11).font('Helvetica-Bold').text('Payment Summary', col1X, tableTop);

            doc.moveDown(0.8);

            // Table Header
            const headerY = doc.y;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Description', col1X, headerY);
            doc.text('Amount', col2X, headerY, { align: 'right' });

            // Separator line
            doc.moveTo(col1X, doc.y).lineTo(col2X + 80, doc.y).stroke();

            doc.moveDown(0.5);

            // Amount Row
            const amountY = doc.y;
            doc.fontSize(10).font('Helvetica');
            doc.text('Consultation Fee', col1X, amountY);
            doc.text(`${data.amount.toFixed(2)} BDT`, col2X, amountY, { align: 'right' });

            doc.moveDown(0.8);

            // Total Row
            const totalY = doc.y;
            doc.fontSize(11).font('Helvetica-Bold');
            doc.text('Total Amount', col1X, totalY);
            doc.text(`${data.amount.toFixed(2)} BDT`, col2X, totalY, { align: 'right' });

            // Separator line
            doc.moveTo(col1X, doc.y).lineTo(col2X + 80, doc.y).stroke();

            doc.moveDown(1.5);

            // Footer
            doc.fontSize(9).font('Helvetica').text(
                'Thank you for choosing PH Healthcare. This is an electronically generated invoice.',
                {
                    align: 'center',
                }
            );

            doc.text('If you have any questions, please contact us at support@ph-healthcare.com', {
                align: 'center',
            });

            doc.text('Payment processed securely through Stripe', {
                align: 'center',
            });

            // End the document
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

import { Router } from "express";

const router = Router();

export const PaymentRoutes = router;

 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import status from "http-status";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PaymentService } from "./payment.service";

const handleStripeWebhookEvent = catchAsync(async (req : Request, res : Response) => {
    const signature = req.headers['stripe-signature'] as string
    const webhookSecret = envVars.STRIPE.STRIPE_WEBHOOK_SECRET;

    if(!signature || !webhookSecret){
        console.error("Missing Stripe signature or webhook secret");
        return res.status(status.BAD_REQUEST).json({message : "Missing Stripe signature or webhook secret"})
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error : any) {
        console.error("Error processing Stripe webhook:", error);
        return res.status(status.BAD_REQUEST).json({message : "Error processing Stripe webhook"})
    }

    try {
        const result = await PaymentService.handlerStripeWebhookEvent(event);

        sendResponse(res, {
            httpStatusCode : status.OK,
            success : true,
            message : "Stripe webhook event processed successfully",
            data : result
        })
    } catch (error) {
        console.error("Error handling Stripe webhook event:", error);
        sendResponse(res, {
            httpStatusCode : status.INTERNAL_SERVER_ERROR,
            success : false,
            message : "Error handling Stripe webhook event"
        })
    }
})

export const PaymentController = {
    handleStripeWebhookEvent
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { PaymentStatus } from "../../../generated/prisma/enums";
import { uploadFileToCloudinary } from "../../config/cloudinary.config";
import { prisma } from "../../lib/prisma";
import { sendEmail } from "../../utils/email";
import { generateInvoicePdf } from "./payment.utils";


const handlerStripeWebhookEvent = async (event : Stripe.Event) =>{

    const existingPayment = await prisma.payment.findFirst({
        where:{
            stripeEventId : event.id
        }
    })

    if(existingPayment){
        console.log(`Event ${event.id} already processed. Skipping`);
        return {message : `Event ${event.id} already processed. Skipping`}
    }

    switch(event.type){
        case "checkout.session.completed": {
            const session = event.data.object as any;

            const appointmentId = session.metadata?.appointmentId;
            const paymentId = session.metadata?.paymentId;

            if (!appointmentId || !paymentId) {
                console.error("⚠️ Missing metadata in webhook event");
                return { message: "Missing metadata" };
            }

            // Verify appointment exists with related data
            const appointment = await prisma.appointment.findUnique({
                where: { id: appointmentId },
                include: {
                    patient: true,
                    doctor: true,
                    schedule: true,
                    payment: true
                }
            });

            if (!appointment) {
                console.error(`⚠️ Appointment ${appointmentId} not found. Payment may be for expired appointment.`);
                return { message: "Appointment not found" };
            }
            let pdfBuffer: Buffer | null = null;

            // Update both appointment and payment in a transaction
            const result = await prisma.$transaction(async (tx) => {
                const updatedAppointment = await tx.appointment.update({
                    where: {
                        id: appointmentId
                    },
                    data: {
                        paymentStatus: session.payment_status === "paid" ? PaymentStatus.PAID : PaymentStatus.UNPAID
                    }
                });

                let invoiceUrl = null;
                

                // If payment is successful, generate and upload invoice
                if (session.payment_status === "paid") {
                    try {
                        // Generate invoice PDF
                        pdfBuffer = await generateInvoicePdf({
                            invoiceId: appointment.payment?.id || paymentId,
                            patientName: appointment.patient.name,
                            patientEmail: appointment.patient.email,
                            doctorName: appointment.doctor.name,
                            appointmentDate: appointment.schedule.startDateTime.toString(),
                            amount: appointment.payment?.amount || 0,
                            transactionId: appointment.payment?.transactionId || "",
                            paymentDate: new Date().toISOString()
                        });

                        // Upload PDF to Cloudinary
                        const cloudinaryResponse = await uploadFileToCloudinary(
                            pdfBuffer,
                            `ph-healthcare/invoices/invoice-${paymentId}-${Date.now()}.pdf`
                        );

                        invoiceUrl = cloudinaryResponse?.secure_url;

                        console.log(`✅ Invoice PDF generated and uploaded for payment ${paymentId}`);
                    } catch (pdfError) {
                        console.error("❌ Error generating/uploading invoice PDF:", pdfError);
                        // Continue with payment update even if PDF generation fails
                    }
                }

                const updatedPayment = await tx.payment.update({
                    where: {
                        id: paymentId
                    },
                    data: {
                        status: session.payment_status === "paid" ? PaymentStatus.PAID : PaymentStatus.UNPAID,
                        paymentGatewayData: session,
                        invoiceUrl: invoiceUrl, // Store invoice URL
                        stripeEventId: event.id // Store event ID for idempotency
                    }
                });

                return { updatedAppointment, updatedPayment, invoiceUrl };
            });

            // Send invoice email to patient (outside transaction to avoid blocking payment update)
            if (session.payment_status === "paid" && result.invoiceUrl) {
                try {
                    await sendEmail({
                        to: appointment.patient.email,
                        subject: `Payment Confirmation & Invoice - Appointment with ${appointment.doctor.name}`,
                        templateName: "invoice",
                        templateData: {
                            patientName: appointment.patient.name,
                            invoiceId: appointment.payment?.id || paymentId,
                            transactionId: appointment.payment?.transactionId || "",
                            paymentDate: new Date().toLocaleDateString(),
                            doctorName: appointment.doctor.name,
                            appointmentDate: new Date(appointment.schedule.startDateTime).toLocaleDateString(),
                            amount: appointment.payment?.amount || 0,
                            invoiceUrl: result.invoiceUrl
                        },
                        attachments: [
                            {
                                filename: `Invoice-${paymentId}.pdf`,
                                content: pdfBuffer || Buffer.from(""), // Attach PDF if generated, else empty buffer
                                contentType: 'application/pdf'
                            }
                        ]
                    });

                    console.log(`✅ Invoice email sent to ${appointment.patient.email}`);
                } catch (emailError) {
                    console.error("❌ Error sending invoice email:", emailError);
                    // Log but don't fail the payment if email fails
                }
            }

            console.log(`✅ Payment ${session.payment_status} for appointment ${appointmentId}`);
            break;
        }

        case "checkout.session.expired" : {
                const session = event.data.object

                console.log(`Checkout session ${session.id} expired. Marking associated payment as failed.`);
                break;

        }
        case "payment_intent.payment_failed" : {
            const session = event.data.object

            console.log(`Payment intent ${session.id} failed. Marking associated payment as failed.`);
            break;
        }
        default :
            console.log(`Unhandled event type ${event.type}`);
    }

    return {message : `Webhook Event ${event.id} processed successfully`}
}

export const PaymentService = {
    handlerStripeWebhookEvent
}


import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { AppointmentController } from "./appointment.controller";

const router = Router();

router.post("/book-appointment", checkAuth(Role.PATIENT), AppointmentController.bookAppointment);
router.get("/my-appointments", checkAuth(Role.PATIENT, Role.DOCTOR), AppointmentController.getMyAppointments);
router.patch("/change-appointment-status/:id", checkAuth(Role.PATIENT, Role.DOCTOR, Role.ADMIN, Role.SUPER_ADMIN),AppointmentController.changeAppointmentStatus);
router.get("/my-single-appointment/:id", checkAuth(Role.PATIENT, Role.DOCTOR), AppointmentController.getMySingleAppointment);
router.get("/all-appointments", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), AppointmentController.getAllAppointments);
router.post("/book-appointment-with-pay-later", checkAuth(Role.PATIENT), AppointmentController.bookAppointmentWithPayLater);
router.post("/initiate-payment/:id", checkAuth(Role.PATIENT), AppointmentController.initiatePayment);

export const AppointmentRoutes = router;

import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AppointmentService } from "./appointment.service";

const bookAppointment = catchAsync( async (req : Request, res : Response) => {
    const payload = req.body;
    const user = req.user;
    const appointment = await AppointmentService.bookAppointment(payload, user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.CREATED, 
        message: 'Appointment booked successfully',
        data: appointment
    });
});

const getMyAppointments = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const appointments = await AppointmentService.getMyAppointments(user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Appointments retrieved successfully',
        data: appointments
    });
});

const changeAppointmentStatus = catchAsync(async (req: Request, res: Response) => {
    const appointmentId = req.params.id;
    const payload = req.body;
    const user = req.user;

    const updatedAppointment = await AppointmentService.changeAppointmentStatus(appointmentId as string, payload, user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Appointment status updated successfully',
        data: updatedAppointment
    });
});

const getMySingleAppointment = catchAsync(async (req: Request, res: Response) => {
    const appointmentId = req.params.id;
    const user = req.user;

    const appointment = await AppointmentService.getMySingleAppointment(appointmentId as string, user);
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Appointment retrieved successfully',
        data: appointment
    });
});

const getAllAppointments = catchAsync(async (req: Request, res: Response) => {
    const appointments = await AppointmentService.getAllAppointments();
    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'All appointments retrieved successfully',
        data: appointments
    });
});

const bookAppointmentWithPayLater = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;
    const appointment = await AppointmentService.bookAppointmentWithPayLater(payload, user);
    sendResponse(res, {
        success: true,  
        httpStatusCode: status.CREATED,
        message: 'Appointment booked successfully with Pay Later option',
        data: appointment
    });
});

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
    const appointmentId = req.params.id;
    const user = req.user;
    const paymentInfo = await AppointmentService.initiatePayment(appointmentId as string, user);

    sendResponse(res, {
        success: true,
        httpStatusCode: status.OK,
        message: 'Payment initiated successfully',
        data: paymentInfo
    });
});

export const AppointmentController = {
    bookAppointment,
    getMyAppointments,
    changeAppointmentStatus,
    getMySingleAppointment,
    getAllAppointments,
    bookAppointmentWithPayLater,
    initiatePayment,
}import status from "http-status";
// import { uuidv7 } from "zod/mini";
import { v7 as uuidv7 } from "uuid";
import { PaymentStatus, Role } from "../../../generated/prisma/enums";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { AppointmentStatus } from './../../../generated/prisma/enums';
import { IBookAppointmentPayload } from "./appointment.interface";

// Pay Now Book Appointment
const bookAppointment = async (payload : IBookAppointmentPayload, user : IRequestUser) => {
   const patientData = await prisma.patient.findUniqueOrThrow({
    where : {
        email : user.email,
    }
   });

   const doctorData = await prisma.doctor.findUniqueOrThrow({
    where : {
        id : payload.doctorId,
        isDeleted : false,
    }
   });

   const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where : {
        id : payload.scheduleId,
    }
   });

   const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
    where : {
        doctorId_scheduleId:{
            doctorId : doctorData.id,
            scheduleId : scheduleData.id,   
        }
    }
   });
   
    const videoCallingId = String(uuidv7());

    const result = await prisma.$transaction(async (tx) => {
        const appointmentData = await tx.appointment.create({
            data : {
                doctorId : payload.doctorId,
                patientId : patientData.id,
                scheduleId : doctorSchedule.scheduleId,
                videoCallingId,
            }
        });

        await tx.doctorSchedules.update({
            where : {
                doctorId_scheduleId:{
                    doctorId : payload.doctorId,
                    scheduleId : payload.scheduleId,
                }
            },
            data : {
                isBooked : true,
            }
        });

        //TODO : Payment Integration will be here

        const transactionId = String(uuidv7());

        const paymentData = await tx.payment.create({
            data : {
                appointmentId : appointmentData.id,
                amount : doctorData.appointmentFee,
                transactionId
            }
        });
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items :[
                {
                    price_data:{
                        currency:"bdt",
                        product_data:{
                            name : `Appointment with Dr. ${doctorData.name}`,
                        },
                        unit_amount : doctorData.appointmentFee * 100,
                    },
                    quantity : 1,
                }
            ],
            metadata:{
                appointmentId : appointmentData.id,
                paymentId : paymentData.id,
            },

            success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success`,

            // cancel_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-failed`,
            cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments`,
        })

        return {
            appointmentData,
            paymentData,
            paymentUrl : session.url,
        };
    });

    return {
        appointment : result.appointmentData,
        payment : result.paymentData,
        paymentUrl : result.paymentUrl,
    };
}

const getMyAppointments = async (user: IRequestUser) => {
    //user can be patient or doctor, so we need to check both
    const patientData = await prisma.patient.findUnique({
        where: {
            email: user?.email
        }
    });

    const doctorData = await prisma.doctor.findUnique({
        where: {
            email: user?.email
        }
    });

    let appointments = [];

    if (patientData) {
        appointments = await prisma.appointment.findMany({
            where: {
                patientId: patientData.id
            },
            include: {
                doctor: true,
                schedule: true
            }
        });
    } else if (doctorData) {
        appointments = await prisma.appointment.findMany({
            where: {
                doctorId: doctorData.id
            },
            include: {
                patient: true,
                schedule: true
            }
        });
    } else {
        throw new Error("User not found");
    }

    return appointments;

}

// 1. Completed Or Cancelled Appointments should not be allowed to update status
// 2. Doctors can only update Appoinment status from schedule to inprogress or inprogress to complted or schedule to cancelled.
// 3. Patients can only cancel the scheduled appointment if it scheduled not completed or cancelled or inprogress. 
// 4. Admin and Super admin can update to any status.

const changeAppointmentStatus = async (appointmentId: string, appointmentStatus: AppointmentStatus, user: IRequestUser) => {
    const appointmentData = await prisma.appointment.findUniqueOrThrow({
        where: {
            id: appointmentId,
            // status: AppointmentStatus.SCHEDULED
        },
        include: {
            doctor: true
        }
    });

    // if (!appointmentData) {
    //     throw new AppError(status.NOT_FOUND, "Appointment not found or already completed/cancelled");
    // }

    if (user?.role === Role.DOCTOR) {
        if (!(user?.email === appointmentData.doctor.email))
            throw new AppError(status.BAD_REQUEST, "This is not your appointment")
    }

    return await prisma.appointment.update({
        where: {
            id: appointmentId
        },
        data: {
            status: appointmentStatus
        }
    })

}

// refactoring on include of doctor and patient data in appointment details, we can use query builder to get the data in single query instead of multiple queries in case of doctor and patient both
const getMySingleAppointment = async (appointmentId: string, user: IRequestUser) => {

    const patientData = await prisma.patient.findUnique({
        where: {
            email: user?.email
        }
    });

    const doctorData = await prisma.doctor.findUnique({
        where: {
            email: user?.email
        }
    });

    let appointment;

    if (patientData) {
        appointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                patientId: patientData.id
            },
            include: {
                doctor: true,
                schedule: true
            }
        });
    } else if (doctorData) {
        appointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                doctorId: doctorData.id
            },
            include: {
                patient: true,
                schedule: true
            }
        });
    }

    if (!appointment) {
        throw new AppError(status.NOT_FOUND, "Appointment not found");
    }

    return appointment;
}

// integrate query builder
const getAllAppointments = async () => {
    const appointments = await prisma.appointment.findMany({
        include: {
            doctor: true,
            patient: true,
            schedule: true
        }
    });
    return appointments;
}

const bookAppointmentWithPayLater = async (payload : IBookAppointmentPayload, user : IRequestUser) => {
    const patientData = await prisma.patient.findUniqueOrThrow({
        where: {
            email: user.email,
        }
    });

    const doctorData = await prisma.doctor.findUniqueOrThrow({
        where: {
            id: payload.doctorId,
            isDeleted: false,
        }
    });

    const scheduleData = await prisma.schedule.findUniqueOrThrow({
        where: {
            id: payload.scheduleId,
        }
    });

    const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
        where: {
            doctorId_scheduleId: {
                doctorId: doctorData.id,
                scheduleId: scheduleData.id,
            }
        }
    });

    const videoCallingId = String(uuidv7());

    const result = await prisma.$transaction(async (tx) => {
        const appointmentData = await tx.appointment.create({
            data: {
                doctorId: payload.doctorId,
                patientId: patientData.id,
                scheduleId: doctorSchedule.scheduleId,
                videoCallingId,
            }
        });

        await tx.doctorSchedules.update({
            where: {
                doctorId_scheduleId: {
                    doctorId: payload.doctorId,
                    scheduleId: payload.scheduleId,
                }
            },
            data: {
                isBooked: true,
            }
        });

        const transactionId = String(uuidv7());

        const paymentData = await tx.payment.create({
            data: {
                appointmentId: appointmentData.id,
                amount: doctorData.appointmentFee,
                transactionId,
             }
        });

        return {
            appointment: appointmentData,
            payment: paymentData
        };

    });

    return result;
}  

const initiatePayment = async (appointmentId: string, user : IRequestUser) => {
    const patientData = await prisma.patient.findUniqueOrThrow({
        where: {
            email: user.email,
        }
    });

    const appointmentData = await prisma.appointment.findUniqueOrThrow({
        where: {
            id: appointmentId,
            patientId: patientData.id,
        },
        include: {
            doctor: true,
            payment : true,
        }
    });

    if(!appointmentData){
        throw new AppError(status.NOT_FOUND, "Appointment not found");
    }

    if(!appointmentData.payment){
        throw new AppError(status.NOT_FOUND, "Payment data not found for this appointment");
    }

    if(appointmentData.payment?.status === PaymentStatus.PAID){
        throw new AppError(status.BAD_REQUEST, "Payment already completed for this appointment");
    };

    if(appointmentData.status === AppointmentStatus.CANCELED){
        throw new AppError(status.BAD_REQUEST, "Appointment is canceled");
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: 'payment',
        line_items: [
            {
                price_data: {
                    currency: "bdt",
                    product_data: {
                        name: `Appointment with Dr. ${appointmentData.doctor.name}`,
                    },
                    unit_amount: appointmentData.doctor.appointmentFee * 100,
                },
                quantity: 1,
            }
        ],
        metadata: {
            appointmentId: appointmentData.id,
            paymentId: appointmentData.payment.id,
        },

        success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success?appointment_id=${appointmentData.id}&payment_id=${appointmentData.payment.id}`,

        // cancel_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-failed`,
        cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments?error=payment_cancelled`,
    })

    return {
        paymentUrl: session.url,
    }
}

const cancelUnpaidAppointments = async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const unpaidAppointments = await prisma.appointment.findMany({
        where: {
            // status: AppointmentStatus.SCHEDULED,
            createdAt: {
                lte: thirtyMinutesAgo,
            },
            paymentStatus: PaymentStatus.UNPAID,
        },
    });

    const appointmentToCancel = unpaidAppointments.map(appointment => appointment.id);

    await prisma.$transaction(async (tx) => {

        await tx.appointment.updateMany({
            where: {
                id: {
                    in: appointmentToCancel,
                },
            },
            data: {
                status: AppointmentStatus.CANCELED,
            },
        });

        await tx.payment.deleteMany({
            where: {
                appointmentId: {
                    in: appointmentToCancel,
                },
            },
        });

        for(const unpaidAppointment of unpaidAppointments){
            await tx.doctorSchedules.update({
                where: {
                    doctorId_scheduleId: {
                        doctorId: unpaidAppointment.doctorId,
                        scheduleId: unpaidAppointment.scheduleId,
                    },
                },
                data: {
                    isBooked: false,
                },
            });
        }
    });
}



export const AppointmentService = {
    bookAppointment,
    getMyAppointments,
    changeAppointmentStatus,
    getMySingleAppointment,
    getAllAppointments,
    bookAppointmentWithPayLater,
    initiatePayment,
    cancelUnpaidAppointments,
}