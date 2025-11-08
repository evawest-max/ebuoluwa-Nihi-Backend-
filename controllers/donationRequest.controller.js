import donationRequest from "../models/donationrequest.model.js";
import userModel from "../models/user.model.js";
import { sendEmail } from "../utils/sendEmail.js";


export const createDonationRequest = async (req, res) => {
    console.log("✅ Hit createDonationRequest route");
    console.log("✅ Raw request body:", req.body);

    try {
        const {
            id,
            title,
            description,
            reason,
            category,
            image,
            location,
            price,
            userId,
            userName,
            useremail,
            donorname,
            createdAt,
        } = req.body;

        const requester = await userModel.findById(userId);

        console.log("❌ Requester " + requester);
        if (!requester) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (requester.suspended === true) {
            return res.status(403).json({ message: 'This user can not request for donations at the moment they, have been suspended, please try again later' });
        }
        if (requester._id == id) {
            console.log("❌ User ID mismatch for requester ID:", userId);
            return res.status(403).json({ message: '❌ Sorry you can not request for your own item' });
        }

        // Basic validation
        if (!id || !title || !description || !reason || !category || !location || !price || !userId || !userName || !useremail) {
            return res.status(400).json({
                message: 'Missing required fields',
            });
        }

        // Check if request with same ID already exists
        const existingRequest = await donationRequest.findOne({ id });
        if (existingRequest) {
            return res.status(409).json({
                message: 'You have already requested for this item.',
            });
        }

        const newRequest = new donationRequest({
            id,
            title,
            description,
            reason,
            type: 'request',
            category,
            image,
            location,
            price,
            userId,
            userName,
            useremail,
            donorname: donorname || 'anonymous',
            createdAt: createdAt || new Date(),
        });

        const savedRequest = await newRequest.save();
        try {   
            await sendEmail({
                to: requester.email,
                subject: '🎉 Your Request Has Been Sent to Admin',
                html: `
                            <div style="font-family: 'Segoe UI', sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                            <h1 style="color: #2e7d32;">🎉 Thank You for Your Request!</h1>
                            <p style="font-size: 16px;">We're excited to let you know that your request for <strong>${title}</strong> has been successfully submitted to our admin team for review.</p>
    
                            <p style="font-size: 15px;">Our team will carefully evaluate your request to ensure fair and thoughtful distribution of resources. You’ll receive updates as soon as your request progresses to the next stage.</p>
    
                            <div style="margin: 20px 0; padding: 15px; background-color: #f1f8e9; border-left: 5px solid #81c784;">
                                <p style="margin: 0; font-size: 15px;"><strong>Need assistance?</strong> Reach out to our support team anytime at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>.</p>
                            </div>
    
                            <p style="font-size: 15px;">Thank you for being part of the Nihi community. Your participation helps us build a more generous and connected world.</p>
    
                            <p style="margin-top: 30px; font-size: 14px; color: #777;">Warm regards,<br><strong>The Nihi Team</strong></p>
                            </div>
                        `,
            });
        } catch (error) {
            console.log(error)
        }

        res.status(201).json({
            message: 'Donation request created successfully, admin will review it shortly.',
            item: savedRequest,
        });
    } catch (error) {
        console.error('Error creating request for donation:', error);
        res.status(500).json({
            message: 'Failed to create request for donation',
            error: error.message,
        });
    }
};

export const getAllDonationRequests = async (req, res) => {
    try {
        const requests = await donationRequest.find().sort({ createdAt: -1 }); // newest first
        res.status(200).json({
            message: 'All donation requests fetched successfully',
            items: requests,
        });
    } catch (error) {
        console.error('Error fetching donation requests:', error);
        res.status(500).json({
            message: 'Failed to fetch donation requests',
            error: error.message,
        });
    }
};



export const updateDonationRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['approved', 'disapproved'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        const request = await donationRequest.findOne({ id });
        if (!request) {
            return res.status(404).json({ message: 'Donation request not found' });
        }

        request.status = status;
        await request.save();

        let subject = null
        let html = null
        if (status === 'approved') {
            await sendEmail({
                to: request.useremail,
                subject: 'Your Donation Request Has Been Approved',
                html: `
                <div style="font-family: 'Segoe UI', sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h1 style="color: #2e7d32;">🎉 Congratulations!</h1>
                <p style="font-size: 16px;">We're thrilled to let you know that your donation request for <strong>${itemTitle}</strong> has been <span style="color: #2e7d32; font-weight: bold;">approved</span>!</p>
                
                <p style="font-size: 15px;">Our team is preparing the next steps to ensure a smooth and timely delivery. You’ll receive further updates shortly with pickup details and contact information.</p>
                
                <div style="margin: 20px 0; padding: 15px; background-color: #f1f8e9; border-left: 5px solid #81c784;">
                    <p style="margin: 0; font-size: 15px;"><strong>Need help?</strong> Feel free to reach out to our support team anytime at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>.</p>
                </div>

                <p style="font-size: 15px;">Thank you for being part of the Nihi community. Together, we’re making generosity go further.</p>
                
                <p style="margin-top: 30px; font-size: 14px; color: #777;">Warm regards,<br><strong>The Nihi Team</strong></p>
                </div>
            `,
            });
        } else if (status === 'disapproved') {
            await sendEmail({
                to: request.useremail,
                subject: 'Update on Your Donation Request',
                html: `
                <div style="font-family: 'Segoe UI', sans-serif; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #d32f2f;">Thank You for Your Submission</h2>
                    <p style="font-size: 16px;">We truly appreciate your request for <strong>${request.title}</strong> and your trust in our platform.</p>

                    <p style="font-size: 15px;">After a careful review, we regret to inform you that your request was not approved at this time. This decision may be based on current availability, eligibility criteria, or other program guidelines.</p>

                    <p style="font-size: 15px;">Please know that this outcome does not reflect the value of your request or your worth to our community. We encourage you to stay engaged and feel free to submit another request in the future. Your participation helps us grow a more generous and connected network.</p>

                    <div style="margin: 20px 0; padding: 15px; background-color: #fbe9e7; border-left: 5px solid #ef9a9a;">
                    <p style="margin: 0; font-size: 15px;"><strong>Need support?</strong> Reach out to us anytime at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>. We’re here to help.</p>
                    </div>

                    <p style="font-size: 15px;">Thank you for being part of the Nihi community. Together, we’re building something truly meaningful.</p>

                    <p style="margin-top: 30px; font-size: 14px; color: #777;">Warm regards,<br><strong>The Nihi Team</strong></p>
                </div>
            `,
            });
        }

        try {
            await sendEmail(user.email, subject, html);
            console.log(`✅ Approval email sent to ${user.email}`);
        } catch (emailError) {
            console.error("❌ Error sending approval email:", emailError.message);
        }



        res.status(200).json({
            message: `Donation request ${status} successfully`,
            item: request,
        });
    } catch (error) {
        console.error('Error updating donation request status:', error);
        res.status(500).json({
            message: 'Failed to update donation request status',
            error: error.message,
        });
    }
};

export const deleteDonationRequestStatus = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await donationRequest.findOneAndDelete({ id });

        if (!deleted) {
            return res.status(404).json({ message: 'Donation request not found' });
        }

        res.status(200).json({
            message: 'Donation request deleted successfully',
            item: deleted,
        });
    } catch (error) {
        console.error('Error deleting donation request:', error);
        res.status(500).json({
            message: 'Failed to delete donation request',
            error: error.message,
        });
    }
};
