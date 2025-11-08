import Testimony from "../models/testimony.model.js";
import User from "../models/user.model.js";
import { uploadToPinata } from "../utils/pinata.js";
import { sendEmail } from "../utils/sendEmail.js";

export const createTestimony = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id || req.body.sender;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: Missing user ID" });
    }
    if (!message) {
      return res.status(400).json({ message: "message are required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }
    const imageURL = await uploadToPinata(req.file);
    const newTestimony = new Testimony({
      sender: userId,
      imageURL,
      message,
    });
    await newTestimony.save();

    try {
      await sendEmail({
        to: helper.email,
        subject: '🙏 Thank You for Sharing Your Testimony',
        html: `
                <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #2e7d32;">Thank You for Your Testimony</h2>

              <p style="font-size: 16px;">
                Hi <strong>${req.user.name || "Dear"}</strong>,
              </p>

              <p style="font-size: 15px;">
                We sincerely appreciate you taking the time to share your testimony with us. Your story is a powerful reflection of the impact our community can have.
              </p>

              <p style="font-size: 15px;">
                Your submission is currently under review by our admin team. If approved, it will be proudly featured on our <strong>Testimony Page</strong> to inspire others.
              </p>

              <p style="font-size: 15px;">
                Thank you for being a valued part of NIHI. Your voice matters, and we’re honored to share it.
              </p>

              <div style="margin: 20px 0; padding: 15px; background-color: #f1f8e9; border-left: 5px solid #81c784;">
                <p style="margin: 0; font-size: 14px;">
                  Questions or updates? Reach out to us anytime at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>.
                </p>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #777;">
                Warm regards,<br><strong>The NIHI Team</strong>
              </p>
            </div>
            `,
      });
    } catch (error) {
      console.log("failed to send testimony")
    }

    res.status(201).json({
      message: "Testimony submitted successfully. Awaiting admin approval.",
      testimony: newTestimony,
    });
  } catch (error) {
    console.error("Error creating testimony:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const countUserTestimony = async (req, res) => {
  try {
    const { userId } = req.params;

    const tesitmonyCount = await Testimony.countDocuments({ user: userId });
    return res.json({
      message: "Testimony retrieved successfully",
      testimony: tesitmonyCount,
    });
  } catch (err) {
    console.error("❌Error counting testimony:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getFeaturedTestimonies = async (req, res) => {
  try {
    console.log("✅ Hit getFeaturedTestimonies route");

    const testimonies = await Testimony.find({ featured: true })
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    console.log("✅ Found testimonies:", testimonies);

    res.status(200).json(testimonies);
  } catch (error) {
    console.error("❌ Error fetching featured testimonies:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getapprovedTestimonies = async (req, res) => {
  try {
    console.log("✅ Hit getapprovedTestimonies route");

    const testimonies = await Testimony.find({ approved: true })
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    console.log("✅ Found testimonies:", testimonies);

    res.status(200).json(testimonies);
  } catch (error) {
    console.error("❌ Error fetching featured testimonies:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const approveTestimony = async (req, res) => {
  try {
    const { id } = req.params;

    const testimony = await Testimony.findById(id);
    if (!testimony) {
      return res.status(404).json({ message: "Testimony not found" });
    }

    testimony.approved = true;
    await testimony.save();

    res.status(200).json({ message: "Testimony approved successfully", testimony });
  } catch (error) {
    console.error("Error approving testimony:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const featureTestimony = async (req, res) => {
  try {
    const { id } = req.params;

    const featured = await Testimony.findById(id);
    if (!featured) {
      return res.status(404).json({ message: "Featured Testimony not found" });
    }

    featured.featured = !featured.featured;
    await featured.save();

    res.status(200).json({ message: "Features Testimony approved successfully", featured });
  } catch (error) {
    console.error("Error featuring testimony:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteTestimony = async (req, res) => {
  try {
    const { id } = req.params;

    const testimony = await Testimony.findByIdAndDelete(id);
    if (!testimony) {
      return res.status(404).json({ message: "Testimony not found" });
    }

    res.status(200).json({ message: "Testimony deleted successfully" });
  } catch (error) {
    console.error("Error deleting testimony:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// ✅ Get all testimonies (Admin)
export const getAllTestimonies = async (req, res) => {
  try {
    const testimonies = await Testimony.find()
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(testimonies);
  } catch (error) {
    console.error("Error fetching testimonies:", error);
    res.status(500).json({ message: "Server error" });
  }
};