// import { sendEmail } from "../utils/emailService.js";
import PaymentLink from "../models/paymentLink.model.js";
import User from "../models/user.model.js";
import Item from "../models/item.model.js";
import Payment from "../models/Payment.model.js";
import { sendEmail } from "../utils/sendEmail.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Delete User Controller
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(id);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error while deleting user" });
  }
};
export const suspendUser = async (req, res) => {
  //this fuction toggles suspension boolean
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.suspended = !user.suspended;
    if (user.suspended) {
      try {
        // Email setup
        await sendEmail({
          to: user.email,
          subject: '⚠️ Account Suspension Notice',
          html: `
         <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #f44336; border-radius: 8px;">
    <h2 style="color: #d32f2f;">Account Suspension Notice</h2>

    <p style="font-size: 16px;">
      Hi <strong>${user.name || "there"}</strong>,
    </p>

    <p style="font-size: 15px;">
      We regret to inform you that your NIHI account has been temporarily <strong>suspended</strong> due to a violation of our platform guidelines or pending administrative review.
    </p>

    <p style="font-size: 15px;">
      If you believe this action was taken in error or would like to understand more about the reason for the suspension, please contact our support team as soon as possible.
    </p>

    <div style="margin: 20px 0; padding: 15px; background-color: #fbe9e7; border-left: 5px solid #ef9a9a;">
    <p style="margin: 0; font-size: 14px;">
        Questions or feedback? Reach out to us anytime at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>.
    </p>
    </div>

    <p style="margin-top: 30px; font-size: 14px; color: #777;">
      Sincerely,<br><strong>The NIHI Team</strong>
    </p>
  </div>
      `
        });
      } catch (error) {
        console.log("cant send mail")
      }
    } else if (user.suspended == false) {
      try {
        // Email setup
        await sendEmail({
          to: user.email,
          subject: 'Your NIHI Account Has Been Reinstated',
          html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h2 style="color: #2e7d32;">Account Reinstated</h2>

    <p style="font-size: 16px;">
      Hi <strong>${user.name || "there"}</strong>,
    </p>

    <p style="font-size: 15px;">
      We’re pleased to inform you that your NIHI account has been <strong>reinstated</strong> and is now fully active.
    </p>

    <p style="font-size: 15px;">
      You can log in and resume using the platform as usual. We appreciate your patience and cooperation during the review process.
    </p>

    <p style="font-size: 15px;">
      We encourage you to reconnect with the NIHI community—whether by offering help, sharing your story, or engaging with others. Your presence makes a difference, and we’re excited to have you back.
    </p>

    <div style="margin: 20px 0; padding: 15px; background-color: #f1f8e9; border-left: 5px solid #81c784;">
        <p style="margin: 0; font-size: 15px;"><strong>Questions?</strong> Reach out to us anytime at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>.</p>
    </div>

    <p style="margin-top: 30px; font-size: 14px; color: #777;">
      Welcome back,<br><strong>The NIHI Team</strong>
    </p>
  </div>
      `
        });
      } catch (error) {
        console.log("cant send mail")
      }
    }

    await user.save();
    res.json({ message: "User suspended", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const liftSuspension = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.suspended = false;
    await user.save();



    res.json({ message: "User suspension lifted", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();
    res.json({ message: "User role updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const getAllItems = async (req, res) => {
  try {
    const items = await Item.find().populate("donor", "name email");
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const approveItemAdmin = async (req, res) => {
  try {
    // Fetch item and populate donor info
    const item = await Item.findById(req.params.id).populate("donor", "email username");
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Approve the item
    item.approved = true;
    await item.save();

    // Get donor info
    const donor = item.donor;
    if (!donor || !donor.email) {
      return res.status(400).json({ message: "Donor email not found" });
    }
    let donordetail = null
    try {
      const donorUser = await User.findById(item.donor);
      if (!donorUser) {
        return
      }
      donordetail = donorUser;
    } catch (err) {
      console.error("Error fetching donor:", err);
    }
    try {
      // Email setup
      await sendEmail({
        to: donor.email,
        subject: '🎉 Your Item Has Been Approved!',
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2e7d32;">Hi ${donordetail.name || "Dear"},</h2>

          <p style="font-size: 16px;">
            🎉 Great news! Your item <strong>"${item.title}"</strong> has been <span style="color: #2e7d32; font-weight: bold;">approved</span> by our admin team.
          </p>

          <p style="font-size: 15px;">
            It’s now live and visible in the <strong><a href="https://needithaveit.org/browse"></strong> NIHI Store </a>. We’re excited to help connect your generous contribution with someone in need.
          </p>

          <p style="font-size: 15px;">
            Thank you for being a valued part of the <strong>NIHI</strong> community. Your kindness is making a real difference.
          </p>

          <div style="margin: 20px 0; padding: 15px; background-color: #e3fde3ff; border-left: 5px solid #2e7d32">
            <p style="margin: 0; font-size: 14px;">
              Need help or have questions? Reach out to us anytime at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>.
            </p>
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #777;">
            With appreciation,<br><strong>The NIHI Team</strong>
          </p>
        </div>
      `
      });
    } catch (error) {
      console.log("cant send mail")
    }


    // Return success response
    res.status(200).json({
      message: "Item approved and email sent successfully",
      item,
    });
  } catch (err) {
    console.error("❌ Error approving item:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const rejectItemAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    console.log("item:" + item.donor)
    // ensure item.donor is a populated user object
    let donordetail = null
    try {
      const donorUser = await User.findById(item.donor);
      if (!donorUser) {
        return
      }
      donordetail = donorUser;
    } catch (err) {
      console.error("Error fetching donor:", err);
    }

    item.approved = false; // ✅ explicitly set approval to false
    await item.save();
    // const donor = item.donor;
    try {
      await sendEmail({
        to: donordetail.email,
        subject: 'Update on Your Item Submission',
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #d32f2f;">Hi ${donordetail.name || "Dear"},</h2>

        <p style="font-size: 16px;">
          Thank you for submitting <strong>"${item.title}"</strong> to NIHI. After careful review, we regret to inform you that your item was not approved for listing at this time.
        </p>

        <p style="font-size: 15px;">
          This decision may be due to item eligibility, condition, or current platform needs. We encourage you to review our guidelines and consider submitting again in the future.
        </p>

        <div style="margin: 20px 0; padding: 15px; background-color: #fbe9e7; border-left: 5px solid #ef9a9a;">
          <p style="margin: 0; font-size: 14px;">
            Have questions? Reach out to us at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>. We're here to help.
          </p>
        </div>

        <p style="font-size: 15px;">We appreciate your generosity and your willingness to support others through NIHI.</p>

        <p style="margin-top: 30px; font-size: 14px; color: #777;">Warm regards,<br><strong>The NIHI Team</strong></p>
      </div>
      `
      });
    } catch (error) {
      console.log("failed to send mail")
    }


    res.status(200).json({ message: "Item rejected successfully", item });
  } catch (err) {
    console.error("❌ Error rejecting item:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


export const deleteItemAdmin = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await item.deleteOne();

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting item:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalItems = await Item.countDocuments();
    const totalDonations = await Item.countDocuments({ category: "donation" });
    const totalRequests = await Item.countDocuments({ category: "request" });
    const totalSales = await Item.countDocuments({ category: "sale" });
    const totalPayments = await Payment.countDocuments({ status: "successful" });

    res.json({
      totalUsers,
      totalItems,
      totalDonations,
      totalRequests,
      totalSales,
      totalPayments,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const generateReport = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    const items = await Item.find();
    const payments = await Payment.find();

    const report = { users, items, payments, generatedAt: new Date() };
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Approve user verification
// export const approveVerification = async (req, res) => {
//     try {
//         const user = await User.findById(req.params.id);
//         if (!user) return res.status(404).json({ message: "User not found" });

//         user.verified = true;
//         await user.save();
//         res.json({ message: "User verified", user });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

export const approveVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Mark user as verified
    user.verified = true;
    await user.save();

    // ✅ Send verification email
    try {
      await sendEmail({
        to: user.email,
        subject: '🎉 Your NIHI Account Is Verified!',
        html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2e7d32;">Hi ${user.name},</h2>

          <p style="font-size: 16px;">
            We’re excited to let you know that your <strong>NIHI</strong> account has been <span style="color: #2e7d32; font-weight: bold;">successfully verified</span>!
          </p>

          <p style="font-size: 15px;">
            You now have full access to all features available to verified users, including posting items, offering help, and engaging with the community.
          </p>

          <div style="margin: 20px 0; padding: 15px; background-color: #f1f8e9; border-left: 5px solid #81c784;">
            <p style="margin: 0; font-size: 14px;">
              Need assistance or have questions? Reach out to us anytime at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>.
            </p>
          </div>

          <p style="font-size: 15px;">Thank you for joining NIHI. We’re thrilled to have you in our community!</p>

          <p style="margin-top: 30px; font-size: 14px; color: #777;">Warm regards,<br><strong>The NIHI Team</strong></p>
        </div>
      `
      })
      await sendEmail({
        to: 'contact.nihi@gmail.com',
        cc: 'info@needithaveit.org',
        subject: `User Verified: ${user.name}`,
        html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto;">
      <h2 style="color: #2e7d32;">User Verification Notice</h2>
      <p style="font-size: 16px;">
        This is to inform you that the following user has been successfully verified on the NIHI platform:
      </p>

      <ul style="font-size: 15px; line-height: 1.6;">
        <li><strong>Name:</strong> ${user.name}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>User ID:</strong> ${user._id}</li>
        <li><strong>Verified At:</strong> ${new Date().toLocaleString()}</li>
      </ul>

      <p style="font-size: 15px;">
        Please update your records accordingly or take any necessary follow-up actions.
      </p>

      <p style="margin-top: 30px; font-size: 14px; color: #777;">
        Regards,<br><strong>NIHI Verification System</strong>
      </p>
    </div>
        `
      });
    } catch (error) {
      console.error("❌ Email failed:", error);
    }


    res.json({
      message: "User verified successfully, and email sent.",
      user,
    });

    console.log(`✅ Verification email sent to: ${user.email}`);
  } catch (err) {
    console.error("❌ Error approving verification:", err.message);
    res.status(500).json({ message: err.message });
  }
};

export const rejectVerificationRequest = async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;
  console.log(`🔍 Rejecting verification for user: ${userId}`);
  console.log(`📝 Reason: ${reason}`);

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ error: 'Rejection reason is required.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    console.log(user)

    // Update verification status
    user.verified = false
    user.verificationStatus = 'rejected';
    user.verificationReason = reason;
    await user.save();

    // Send rejection email
    await sendEmail({
      to: user.email,
      subject: '❌ Verification Request Rejected',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #f44336; border-radius: 8px;">
  <h2 style="color: #d32f2f;">Verification Request Update</h2>

  <p style="font-size: 16px;">
    Hi <strong>${user.name || 'there'}</strong>,
  </p>

  <p style="font-size: 15px;">
    Thank you for submitting your verification request. After careful review, we regret to inform you that it has been <strong>declined</strong> at this time.
  </p>

  <p style="font-size: 15px;">
    <strong>Reason:</strong> ${reason}
  </p>

  <p style="font-size: 15px;">
    We understand this may be disappointing, but please know this decision does not reflect your value to the NIHI community. You’re welcome to reapply once the necessary updates have been made, and we’re here to support you through that process.
  </p>

  <p style="font-size: 15px;">
    If you believe this was a mistake or have questions about the next steps, feel free to reach out to our support team at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>.
  </p>

  <p style="margin-top: 30px; font-size: 14px; color: #777;">
    With appreciation,<br><strong>The NIHI Team</strong>
  </p>
</div>
      `,
    });

    res.status(200).json({ message: 'Verification request rejected and user notified.' });
  } catch (error) {
    console.error('❌ Error rejecting verification:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
};


export const createPaymentLink = async (req, res) => {
  try {
    const { paymentLink: link } = req.body;

    if (!link) {
      return res.status(400).json({ message: "Payment link is required" });
    }

    const newPaymentLink = await PaymentLink.create({
      paymentLink: link,
    });

    res.status(201).json({
      message: "Payment link created successfully",
      data: newPaymentLink,
    });
  } catch (err) {
    console.error("Error creating payment link:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const getPaymentLinks = async (req, res) => {
  try {
    const paymentLinks = await PaymentLink.find().sort({ createdAt: -1 });
    res.status(200).json({ data: paymentLinks });
  } catch (err) {
    console.error("Error fetching payment links:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const updatePaymentLink = async (req, res) => {
  try {
    const { paymentLink: link } = req.body;

    if (!link) {
      return res.status(400).json({ message: "Payment link is required" });
    }

    let existingLink = await PaymentLink.findOne();

    if (existingLink) {
      existingLink.paymentLink = link;
      existingLink.createdAt = new Date();
      await existingLink.save();
      return res.status(200).json({
        message: "Payment link updated successfully",
        data: existingLink,
      });
    }

    const newLink = await PaymentLink.create({ paymentLink: link });
    res.status(201).json({
      message: "Payment link created successfully",
      data: newLink,
    });
  } catch (err) {
    console.error("Error updating payment link:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const getUserKYCById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user and select only KYC-related fields
    const user = await User.findById(id).select(
      "name email idType idNumber bvn idDocument selfieDocument verificationStatus verified createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User KYC data fetched successfully",
      user,
    });
  } catch (err) {
    console.error("❌ Error fetching user KYC:", err);
    res.status(500).json({
      message: "Server error while fetching KYC",
      error: err.message,
    });
  }
};