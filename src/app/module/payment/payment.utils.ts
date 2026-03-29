import PDFDocument from "pdfkit";

interface EventInvoiceData {
invoiceId: string;
  userName: string;
  userEmail: string;
  eventName: string;
  eventDate: string;
  amount: number;
  transactionId: string;
  paymentDate: string;
}


export const generateEventInvoicePdf = async (data: EventInvoiceData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc.fontSize(22).font("Helvetica-Bold").text("EVENT INVOICE", { align: "center" });
      doc.moveDown();

      doc.fontSize(10).text("Event Management System", { align: "center" });
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Invoice Info
      doc.fontSize(11).font("Helvetica-Bold").text("Invoice Details");
      doc.font("Helvetica").fontSize(10)
        .text(`Invoice ID: ${data.invoiceId}`)
        .text(`Transaction ID: ${data.transactionId}`)
        .text(`Payment Date: ${new Date(data.paymentDate).toLocaleDateString()}`);

      doc.moveDown();

      // User Info
      doc.fontSize(11).font("Helvetica-Bold").text("User Details");
      doc.font("Helvetica")
        .text(`Name: ${data.userName}`)
        .text(`Email: ${data.userEmail}`);

      doc.moveDown();

      // Event Info
      doc.fontSize(11).font("Helvetica-Bold").text("Event Details");
      doc.font("Helvetica")
        .text(`Event Name: ${data.eventName}`)
        .text(`Event Date: ${new Date(data.eventDate).toLocaleDateString()}`);

      doc.moveDown();

      // Payment Summary
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(11).font("Helvetica-Bold").text("Payment Summary");
      doc.font("Helvetica")
        .text(`Amount: ${data.amount.toFixed(2)} BDT`);

      doc.moveDown();

      doc.font("Helvetica-Bold").text(`Total: ${data.amount.toFixed(2)} BDT`);

      doc.moveDown(2);

      doc.fontSize(9).text("Thank you for your payment.", { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};