
import Offer from "../models/offerHelp.model.js";
import userModel from "../models/user.model.js";
import { sendEmail } from "../utils/sendEmail.js";

export const createOffer = async (req, res) => {
    console.log("✅ Hit createOffer route");
    console.log("✅ Raw request body:", req.body);  
    try {

        const {
            itemId,
            itemTitle,
            requesterId,
            requesterName,
            requesterEmail,
            helperId,
            helperName,
            helperEmail,
            pickupLocation,
            contactInfo,
            createdAt,
        } = req.body;

        // Check both requester and helper for suspension
        const requester = await userModel.findById(requesterId);
        const helper = await userModel.findById(helperId);

        // console.log("❌ Requester " + requester + " Helper " + helper   );
        if (!requester || !helper) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (helper.suspended === true) {
            return res.status(403).json({ message: 'your Account is suspended, please contact support' });
        }
        if (requester.suspended === true) {
            return res.status(403).json({ message: 'This user can not recieve help at the moment they have been suspended, please try again later' });
        }
        if (requester._id === helper._id) {
            // console.log("❌ Self-help attempt detected for user ID:", helperId);
            return res.status(403).json({ message: '❌ Self-help attempt detected, Sorry you can not provide help to your self' });
        }

        // Basic validation
        if (
            !itemId || !itemTitle || !requesterId || !requesterName ||
            !helperId || !helperName || !helperEmail || !pickupLocation || !contactInfo
        ) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newOffer = new Offer({
            itemId,
            itemTitle,
            requesterId,
            requesterName,
            requesterEmail: requester.email,
            helperId,
            helperName,
            helperEmail,
            pickupLocation,
            contactInfo,
            createdAt: createdAt || new Date(),
        });
        console.log(helper.email, "✅ New offer data:", requester.email,  );
        const savedOffer = await newOffer.save();
        
        try {
            await sendEmail({
                to: helper.email,
                subject: '🙏 Thank You for Your Generous Offer to Help',
                html: `
                <div style="font-family: 'Segoe UI', sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2e7d32;">Thank You for Stepping Up!</h2>
                <p style="font-size: 16px;">We truly appreciate your generous offer to help with <strong>${itemTitle}</strong>. Your willingness to support someone in need reflects the heart of our community.</p>

                <p style="font-size: 15px;">Our team is reviewing the details and will coordinate next steps shortly. You’ll receive updates as soon as your offer is matched and confirmed.</p>

                <div style="margin: 20px 0; padding: 15px; background-color: #f1f8e9; border-left: 5px solid #81c784;">
                    <p style="margin: 0; font-size: 15px;"><strong>Questions?</strong> Reach out to us anytime at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>.</p>
                </div>

                <p style="font-size: 15px;">Thank you for being a beacon of kindness. Together, we’re building a more compassionate world—one act of help at a time.</p>

                <p style="margin-top: 30px; font-size: 14px; color: #777;">With gratitude,<br><strong>The Nihi Team</strong></p>
                </div>
            `,
            });
        } catch (error) {
            console.log("✅failed to send mail"+ error)
        }


        res.status(201).json({
            message: 'Offer created successfully',
            offer: savedOffer,
        });
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({
            message: 'Failed to create offer',
            error: error.message,
        });
    }
};

export const getAllOffers = async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 }); // newest first
        res.status(200).json({
            message: 'All offers fetched successfully',
            items: offers,
        });
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({
            message: 'Failed to fetch offers',
            error: error.message,
        });
    }
};

export const updateOfferStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    console.log("✅ Hit updateOfferStatus route with ID:", id, "and status:", status);

    // Optional: define allowed status values
    const allowedStatuses = ['pending', 'accepted', 'rejected', 'cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid or missing status value' });
    }

    try {
        const offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        offer.status = status;
        await offer.save();

        res.status(200).json({
            message: `Offer status updated to "${status}"`,
            offer,
        });
        try {
            if (status == "rejected") {
                await sendEmail({
                    to: offer.helperEmail,
                    subject: '🙏 Thank You for Your Generous Offer to Help',
                    html: `
                <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #d32f2f;">Thank You for Your Generous Offer</h2>

                    <p style="font-size: 16px;">
                    Hi <strong>${offer.helperName || "Dear"}</strong>,
                    </p>

                    <p style="font-size: 15px;">
                    We truly appreciate your willingness to offer help in response to a recent request. Your generosity reflects the spirit of the NIHI community.
                    </p>

                    <p style="font-size: 15px;">
                    After review, we regret to inform you that your offer was not accepted for this particular request. This decision may be based on timing, availability, or other matching criteria.
                    </p>

                    <p style="font-size: 15px;">
                    Please don’t be discouraged—your support is valued, and we encourage you to continue offering help where you can. Every act of kindness makes a difference.
                    </p>

                    <div style="margin: 20px 0; padding: 15px; background-color: #fbe9e7; border-left: 5px solid #ef9a9a;">
                    <p style="margin: 0; font-size: 14px;">
                        Questions or feedback? Reach out to us anytime at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>.
                    </p>
                    </div>

                    <p style="margin-top: 30px; font-size: 14px; color: #777;">
                    With gratitude,<br><strong>The NIHI Team</strong>
                    </p>
                </div>
            `,
                });
            } else if (status === "approved") {
                await sendEmail({
                    to: offer.helperEmail,
                    subject: '🎉 Your Offer to Help Has Been Accepted!',
                    html: `
                <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2e7d32;">Thank You for Your Generosity</h2>

                <p style="font-size: 16px;">
                Hi <strong>${user.name || "there"}</strong>,
                </p>

                <p style="font-size: 15px;">
                We’re excited to let you know that your offer to help with <strong>${request.title}</strong> has been <span style="color: #2e7d32; font-weight: bold;">accepted</span>!
                </p>

                <p style="font-size: 15px;">
                Our team will coordinate the next steps to ensure a smooth and meaningful connection. You’ll receive further details shortly.
                </p>

                <p style="font-size: 15px;">
                Thank you for being a vital part of the NIHI community. Your kindness is making a real difference.
                </p>

                <div style="margin: 20px 0; padding: 15px; background-color: #f1f8e9; border-left: 5px solid #81c784;">
                <p style="margin: 0; font-size: 14px;">
                    Questions or need assistance? Reach out to us anytime at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>.
                </p>
                </div>

                <p style="margin-top: 30px; font-size: 14px; color: #777;">
                With gratitude,<br><strong>The NIHI Team</strong>
                </p>
            `,
                });
            }

        } catch (error) {
            console.log("failed to send mail")
        }
    } catch (error) {
        console.error('Error updating offer status:', error);
        res.status(500).json({
            message: 'Failed to update offer status',
            error: error.message,
        });
    }
};

export const deleteOffer = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedOffer = await Offer.findByIdAndDelete(id);

        if (!deletedOffer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        res.status(200).json({
            message: 'Offer deleted successfully',
            offer: deletedOffer,
        });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({
            message: 'Failed to delete offer',
            error: error.message,
        });
    }
};