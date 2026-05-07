import '../config/env';
import { emailService } from '../services/email.service';

const testEmail = async () => {
    const complaintRegistererEmail = "prathameshmalode.2@gmail.com";
    const officeReceiverEmail = "prathameshmalode.2@gmail.com";
    
    console.log(`Sending Citizen email to: ${complaintRegistererEmail}`);
    console.log(`Sending Office email to: ${officeReceiverEmail}`);

    const complaint = {
        full_name: "Test Citizen",
        phone_number: "+91 9876543210",
        subject: "Street Light Not Working",
        category: "Electricity",
        description: "The street light near the main intersection has been broken for 3 days. Please fix it.",
        location: "Main Intersection",
        ward: "Ward 5"
    };

    // 1. Citizen Email
    try {
        const citizenHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
                    <h2 style="margin: 0; color: #333;">Complaint Registered Successfully</h2>
                </div>
                <div style="padding: 20px; color: #555; line-height: 1.6;">
                    <p>Dear <strong>${complaint.full_name}</strong>,</p>
                    <p>Thank you for reaching out. Your complaint has been registered successfully. Our team will look into it shortly.</p>
                    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Subject:</strong> ${complaint.subject}</p>
                        <p style="margin: 5px 0;"><strong>Category:</strong> ${complaint.category}</p>
                        <p style="margin: 5px 0;"><strong>Description:</strong> ${complaint.description}</p>
                    </div>
                    <p>For more updates and information about our initiatives, please visit our official website:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="https://omprakashkhursade.in" style="background-color: #0056b3; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; font-weight: bold;">Visit omprakashkhursade.in</a>
                    </div>
                    <p style="margin-bottom: 0;">Best regards,<br><strong>Omprakash Khursade Office</strong></p>
                </div>
            </div>
        `;
        
        console.log("\n[1] Dispatching Citizen Email...");
        await emailService.sendEmail({
            to: complaintRegistererEmail,
            subject: `Complaint Registered Successfully - ${complaint.subject}`,
            html: citizenHtml
        });
        console.log("✅ Citizen Email sent successfully.");
    } catch (e) {
        console.error("❌ Failed to send Citizen email:", e);
    }

    // 2. Office Email
    try {
        const officeHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #fff3cd; padding: 20px; text-align: center; border-bottom: 1px solid #ffeeba;">
                    <h2 style="margin: 0; color: #856404;">New Complaint Alert</h2>
                </div>
                <div style="padding: 20px; color: #555; line-height: 1.6;">
                    <p>A new complaint has been registered on the portal.</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #e0e0e0;">
                        <p style="margin: 5px 0;"><strong>Citizen:</strong> ${complaint.full_name}</p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> ${complaint.phone_number}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${complaintRegistererEmail}</p>
                        <p style="margin: 5px 0;"><strong>Subject:</strong> ${complaint.subject}</p>
                        <p style="margin: 5px 0;"><strong>Category:</strong> ${complaint.category}</p>
                        <p style="margin: 5px 0;"><strong>Location:</strong> ${complaint.location}</p>
                        <p style="margin: 5px 0;"><strong>Ward:</strong> ${complaint.ward}</p>
                        <p style="margin: 15px 0 5px 0;"><strong>Description:</strong></p>
                        <p style="margin: 0; padding: 10px; background-color: #ffffff; border: 1px solid #ddd; border-radius: 4px;">${complaint.description}</p>
                    </div>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="https://dash.omprakashkhursade.in" style="background-color: #28a745; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block; font-weight: bold;">View in Dashboard</a>
                    </div>
                </div>
            </div>
        `;
        
        console.log("\n[2] Dispatching Office Email...");
        await emailService.sendEmail({
            to: officeReceiverEmail,
            subject: `New Complaint Registered - ${complaint.subject}`,
            html: officeHtml
        });
        console.log("✅ Office Email sent successfully.");
    } catch (e) {
        console.error("❌ Failed to send Office email:", e);
    }
};

testEmail().then(() => {
    console.log("\nAll test emails processed. Exiting...");
    process.exit(0);
}).catch(err => {
    console.error("Fatal error during test:", err);
    process.exit(1);
});
