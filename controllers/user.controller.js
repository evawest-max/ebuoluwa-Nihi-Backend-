import Item from "../models/item.model.js";
import Payment from "../models/Payment.model.js";
import User from "../models/user.model.js";
// import { encrypt } from "../utils/encrypt.js";
import bcrypt from "bcryptjs";
import { uploadToPinata } from "../utils/pinata.js";
import ProofOfPayment from "../models/proof.model.js";
import { sendEmail } from "../utils/email.js";
import userModel from "../models/user.model.js";


// 🔹 Change Password
export const changePassword = async (req, res) => {
  try {
    const user = req.user; // comes from auth middleware
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old and new password are required" });
    }

    // Check old password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Items posted by user
    const myItems = await Item.find({ donor: userId });

    // Items bought by user
    const myPurchases = await Payment.find({
      user: userId,
      status: "successful",
    }).populate("item");

    // Donations made
    const myDonations = myItems.filter((item) => item.category === "donation");

    // Requests
    const myRequests = myItems.filter((item) => item.category === "request");

    res.json({
      myItems,
      myPurchases,
      myDonations,
      myRequests,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const submitVerification = async (req, res) => {
  try {
    const user = req.user;
    const { idType, idNumber, bvn } = req.body;

    // Validate required fields
    if (!idType || !idNumber || !bvn) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.files || !req.files.idDocument || !req.files.selfieDocument) {
      return res
        .status(400)
        .json({ message: "Both ID and Selfie documents are required" });
    }

    // Upload to Pinata
    const idDocFile = req.files.idDocument[0];
    const selfieFile = req.files.selfieDocument[0];

    const idDocUrl = await uploadToPinata(idDocFile);
    const selfieUrl = await uploadToPinata(selfieFile);

    // Save to DB
    user.idType = idType;
    user.idNumber = idNumber;
    user.bvn = bvn;
    user.idDocument = idDocUrl;
    user.selfieDocument = selfieUrl;
    user.verificationStatus = "pending";
    user.verified = false; // admin will approve

    await user.save();

    res.json({
      message: "Verification submitted, pending approval",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export const checkVerificationStatus = async (req, res) => {
//   try {
//     const user = req.user;

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json({
//       message: "Verification status retrieved successfully",
//       status: user.verificationStatus,
//       verified: user.verified,
//       details: {
//         idType: user.idType || null,
//         idNumber: user.idNumber ? "****" : null,
//         bvn: user.bvn ? "****" : null,
//         idDocument: user.idDocument || null,
//         selfieDocument: user.selfieDocument || null,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


export const checkVerificationStatus = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hasSubmitted =
      user.idType || user.idNumber || user.bvn || user.idDocument || user.selfieDocument;

    res.json({
      message: "Verification status retrieved successfully",
      status: hasSubmitted ? user.verificationStatus : "unverified",
      verified: user.verified, // only true if admin sets it
      details: hasSubmitted
        ? {
          idType: user.idType || null,
          idNumber: user.idNumber ? "****" : null,
          bvn: user.bvn ? "****" : null,
          idDocument: user.idDocument || null,
          selfieDocument: user.selfieDocument || null,
        }
        : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export const addItem = async (req, res) => {
//   try {
//     const user = req.user;
//     const { title, description, category, type, price } = req.body;

//     if (!title || !description || !category || !type) {
//       return res.status(400).json({ 
//         message: "All fields are required" 
//       });
//     }

//     const validTypes = ["donation", "sale"];
//     if (!validTypes.includes(type)) {
//       return res.status(400).json({ 
//         message: "Invalid type. Must be one of: donation, sale" 
//       });
//     }

//     if (type === "sale" && (!price || Number(price) <= 0)) {
//       return res.status(400).json({ 
//         message: "Please enter a valid price for items being sold" 
//       });
//     }

//     if (!user.state) {
//       return res.status(400).json({ 
//         message: "User location (state) is required" 
//       });
//     }

//     let imageUrl = null;
//     if (req.files && req.files.image) {
//       const imageFile = req.files.image[0];
//       imageUrl = await uploadToPinata(imageFile);
//     }

//     const coordinates = await geocodeLocation(user.state);

//     const newItem = new Item({
//       title,
//       description,
//       itemCategory: category, // clothing, electronics, etc.
//       transactionType: type, // donation or sale
//       images: imageUrl ? [imageUrl] : [],
//       price: type === "sale" ? Number(price) : 0,
//       donor: user._id,
//       approved: false,
//       location: {
//         type: "Point",
//         coordinates: coordinates
//       }
//     });

//     await newItem.save();
//     await newItem.populate('donor', 'name email state');

//     res.status(201).json({
//       message: "Item created successfully and pending approval",
//       item: newItem
//     });

//   } catch (err) {
//     console.error("Error creating item:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

export const addItem = async (req, res) => {
  try {
    const user = req.user;
    const { title, description, category, type, price } = req.body;
    const logedinUser = await userModel.findById(user._id);
    if (!logedinUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (logedinUser.suspended === true) {
      return res.status(403).json({ message: 'This user can not sell or donate items at the moment they have been suspended, please contact support' });
    }

    if (!title || !description || !category || !type) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const validTypes = ["donation", "sale"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid type. Must be one of: donation, sale" });
    }

    // Both types now require a valid price
    if (!price || Number(price) <= 0) {
      return res.status(400).json({ message: "Please enter a valid price" });
    }

    if (!user.state) {
      return res.status(400).json({ message: "User location (state) is required" });
    }

    let imageUrl = null;
    if (req.files && req.files.image) {
      const imageFile = req.files.image[0];
      imageUrl = await uploadToPinata(imageFile);
    }

    const coordinates = await geocodeLocation(user.state);

    // Add 20% platform fee
    const basePrice = Number(price);
    const totalPrice = basePrice + basePrice * 0.2;

    const newItem = new Item({
      title,
      description,
      itemCategory: category,
      transactionType: type,
      images: imageUrl ? [imageUrl] : [],
      price: totalPrice,
      donor: user._id,
      approved: false,
      location: {
        type: "Point",
        coordinates: coordinates,
      },
    });

    await newItem.save();
    await newItem.populate("donor", "name email state");

    res.status(201).json({
      message: `Item created successfully. 20% has been added for platform support.`,
      item: newItem,
    });
  } catch (err) {
    console.error("Error creating item:", err);
    res.status(500).json({ message: err.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Item ID is required" });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.donor.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this item" });
    }

    await Item.findByIdAndDelete(id);

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).json({ message: err.message });
  }
};


const geocodeLocation = async (state) => {
  // State to coordinates mapping for Nigeria (example)
  const stateCoordinates = {
    "lagos": [3.3792, 6.5244],
    "abuja": [7.3986, 9.0765],
    "kano": [8.5167, 12.0000],
    "port harcourt": [7.0100, 4.8400],
    "ibadan": [3.8964, 7.3964],
    "benin": [5.6186, 6.3400],
    "kaduna": [7.4400, 10.5200],
    "abia": [7.4860, 5.5320],
    "adamawa": [13.2700, 9.2700],
    "akwa ibom": [7.8500, 4.9000],
    "anambra": [7.0000, 6.2000],
    "bauchi": [10.3100, 9.8400],
    "bayelsa": [6.0700, 4.7400],
    "cross river": [8.3300, 5.7500],
    "delta": [6.2000, 5.5000],
    "ebonyi": [8.0800, 6.2500],
    "edo": [6.3400, 5.6200],
    "ekiti": [5.2200, 7.6300],
    "enugu": [7.5100, 6.4500],
    "gombe": [11.1700, 10.2900],
    "imo": [7.0300, 5.4900],
    "jigawa": [9.7500, 11.0000],
    "kebbi": [4.2000, 12.4500],
    "kogi": [6.7400, 7.8000],
    "kwara": [4.5500, 8.5000],
    "nasarawa": [7.7100, 8.5400],
    "niger": [6.0000, 9.6000],
    "ogun": [3.3500, 7.0000],
    "ondo": [4.8400, 7.0900],
    "osun": [4.5200, 7.6300],
    "oyo": [3.9300, 7.8400],
    "plateau": [8.8900, 9.9300],
    "rivers": [6.8000, 4.7500],
    "sokoto": [5.2400, 13.0600],
    "taraba": [9.7800, 11.1500],
    "yobe": [11.9600, 12.0000],
    "zamfara": [6.2200, 12.1700]
  };

  const normalizedState = state.toLowerCase().trim();

  if (stateCoordinates[normalizedState]) {
    return stateCoordinates[normalizedState];
  }

  // Default to Lagos coordinates if state not found
  console.warn(`State "${state}" not found in coordinates mapping, using default`);
  return [3.3792, 6.5244]; // Default to Lagos coordinates
};


export const getItems = async (req, res) => {
  try {
    const items = await Item.find()
      .populate('donor', 'name email')
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export const getItem = async (req, res) => {
//   try {
//     const item = await Item.findById(req.params.id)
//       .populate('donor', 'name email');

//     if (!item) {
//       return res.status(404).json({ message: "Item not found" });
//     }

//     res.json(item);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


export const getUserItems = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the authenticated user is requesting their own items
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const items = await Item.find({ donor: userId })
      .populate('donor', 'name email state')
      .sort({ createdAt: -1 });

    res.json({
      message: "Items retrieved successfully",
      items: items
    });
  } catch (err) {
    console.error("Error fetching user items:", err);
    res.status(500).json({ message: err.message });
  }
};


export const countUserSales = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const saleCount = await Item.countDocuments({
      donor: userId,
      transactionType: "sale",
    });

    return res.json({
      message: "Sale items count retrieved successfully",
      count: saleCount,
    });
  } catch (err) {
    console.error("❌ Error counting sales:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const countUserDonations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const donationCount = await Item.countDocuments({
      donor: userId,
      transactionType: "donation",
    });

    return res.json({
      message: "Donation items count retrieved successfully",
      count: donationCount,
    });
  } catch (err) {
    console.error("❌ Error counting donations:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getInstitutionalUsers = async (req, res) => {
  try {
    const users = await User.find(
      {
        accountType: { $in: ["government", "organisation"] },
        logo: { $exists: true, $ne: "" }, // Only include if logo is set
      },
      "name logo accountType" // Only return these fields
    );

    res.json({
      message: "Institutional users fetched successfully",
      users,
    });
  } catch (err) {
    console.error("❌ Error fetching institutional users:", err);
    res.status(500).json({ message: err.message });
  }
};

export const uploadProofOfPayment = async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Proof of payment is required" });
    }
    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }


    const pinataUrl = await uploadToPinata(req.file);

    const proof = await ProofOfPayment.create({
      user: req.user?._id || null, // optional auth — can adjust
      amount,
      description,
      proofUrl: pinataUrl,
    });

    return res.status(201).json({
      message: "Proof of payment uploaded successfully",
      proof,
    });
  } catch (err) {
    console.error("❌ Error uploading proof:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const getUserProofCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await ProofOfPayment.countDocuments({ user: userId });

    res.status(200).json({
      message: "Proof count fetched successfully",
      totalProofs: count,
    });
  } catch (err) {
    console.error("❌ Error fetching proof count:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// export const approveProofOfPayment = async (req, res) => {
//   try {
//     const { proofId } = req.params;

//     // Find the proof
//     const proof = await ProofOfPayment.findById(proofId);
//     if (!proof) return res.status(404).json({ message: "Proof not found" });

//     if (proof.status === "approved") {
//       return res.status(400).json({ message: "Proof already approved" });
//     }

//     // Find associated user
//     const user = await User.findById(proof.user);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Update user's total donated amount
//     user.amountDonated += proof.amount;
//     await user.save();

//     // Update proof status
//     proof.status = "approved";
//     await proof.save();

//     res.status(200).json({
//       message: "Proof approved successfully",
//       user: {
//         id: user._id,
//         name: user.name,
//         totalAmountDonated: user.amountDonated,
//       },
//       proof,
//     });
//   } catch (err) {
//     console.error("❌ Error approving proof:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

export const approveProofOfPayment = async (req, res) => {
  try {
    const { proofId } = req.params;

    // Find proof
    const proof = await ProofOfPayment.findById(proofId);
    if (!proof) return res.status(404).json({ message: "Proof not found" });

    // Prevent re-approval
    if (proof.status === "approved") {
      return res.status(400).json({ message: "Proof already approved" });
    }

    // Find associated user
    const user = await User.findById(proof.user);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update user donated amount
    user.amountDonated += proof.amount;
    await user.save();

    // Update proof status
    proof.status = "approved";
    await proof.save();

    // Send email notification to the user

    try {
      await sendEmail({
        to: user.email,
        subject: '✅ Your Proof of Payment Has Been Approved',
        html: `
               <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #2e7d32;">Payment Confirmation</h2>

              <p style="font-size: 16px;">
                Hi <strong>${user.name || "there"}</strong>,
              </p>

              <p style="font-size: 15px;">
                We're pleased to inform you that your proof of payment has been <strong>successfully approved</strong>.
              </p>

              <p style="font-size: 15px;">
                <strong>Amount Paid:</strong> ₦${proof.amount.toLocaleString()}
              </p>

              <p style="font-size: 15px;">
                Thank you for your continued support and contribution to <strong>NIHI</strong>. Your commitment helps us grow and serve our community better.
              </p>

              <div style="margin: 20px 0; padding: 15px; background-color: #f1f8e9; border-left: 5px solid #81c784;">
                <p style="margin: 0; font-size: 14px;">
                  If you have any questions or need assistance, feel free to contact us at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>.
                </p>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #777;">
                Best regards,<br><strong>The NIHI Team</strong>
              </p>
            </div>

            `,
      });
    } catch (error) {
      console.log("failed to send mail")
    }

    res.status(200).json({
      message: "Proof approved and email sent successfully",
      user: {
        id: user._id,
        name: user.name,
        totalAmountDonated: user.amountDonated,
      },
      proof,
    });
  } catch (err) {
    console.error("❌ Error approving proof:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const rejectProofOfPayment = async (req, res) => {
  try {
    const { proofId } = req.params;

    const proof = await ProofOfPayment.findById(proofId);
    if (!proof) return res.status(404).json({ message: "Proof not found" });

    if (proof.status === "approved") {
      return res.status(400).json({ message: "Cannot reject an approved proof" });
    }

    proof.status = "rejected";
    await proof.save();

    res.status(200).json({
      message: "Proof rejected successfully",
      proof,
    });
  } catch (err) {
    console.error("❌ Error rejecting proof:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const getAllProofsOfPayment = async (req, res) => {
  try {
    // Optional query filters
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) filter.status = status; // e.g. ?status=pending

    const skip = (page - 1) * limit;

    // Fetch proofs with user details
    const proofs = await ProofOfPayment.find(filter)
      .populate("user", "name email amountDonated")
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    // Get total count for pagination
    const totalProofs = await ProofOfPayment.countDocuments(filter);

    res.status(200).json({
      message: "Proofs of payment fetched successfully",
      currentPage: Number(page),
      totalPages: Math.ceil(totalProofs / limit),
      totalProofs,
      data: proofs,
    });
  } catch (err) {
    console.error("❌ Error fetching proofs of payment:", err);
    res.status(500).json({
      message: "Server error while fetching proofs of payment",
      error: err.message,
    });
  }
};

export const getUserDonatedAmount = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("name email amountDonated");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User donated amount fetched successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        amountDonated: user.amountDonated,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching user donated amount:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getApprovedItems = async (req, res) => {
  try {
    const items = await Item.find({ approved: true })
      .populate("donor", "name email") // populate donor details
      .sort({ createdAt: -1 }); // show newest first

    // Transform data for UI clarity (optional but useful)
    const formattedItems = items.map((item) => ({
      id: item._id,
      title: item.title,
      description: item.description,
      category: item.itemCategory,
      type: item.transactionType,
      image: item.images?.[0] || "",
      price: item.price || 0,
      location: "Lagos, Nigeria", // or derive from geo data if available
      userId: item.donor?._id,
      userName: item.donor?.name || "Anonymous",
      createdAt: item.createdAt.toISOString().split("T")[0],
      status: item.approved ? "available" : "pending",
    }));

    res.status(200).json({
      success: true,
      count: formattedItems.length,
      items: formattedItems,
    });
  } catch (error) {
    console.error("❌ Error fetching approved items:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, location, bio, logo } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update allowed fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (location) user.state = location;
    if (bio) user.bio = bio;
    if (logo) user.logo = logo;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Failed to update profile", error });
  }
};
export const updateProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate file presence
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    // ✅ Upload to Pinata using your utility
    const imageUrl = await uploadToPinata(req.file);

    if (!imageUrl) {
      return res.status(500).json({ message: "Failed to upload image to Pinata" });
    }

    // ✅ Update the user’s logo field
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { logo: imageUrl },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile picture updated successfully",
      logo: updatedUser.logo,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
