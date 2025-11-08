// controllers/adminStats.controller.js
import User from "../models/user.model.js";
import Item from "../models/item.model.js";
import Payment from "../models/Payment.model.js";
import ProofOfPayment from "../models/proof.model.js";
import testimonyModel from "../models/testimony.model.js";

// export const getDashboardStats = async (req, res) => {
//   try {
//     const totalUsers = await User.countDocuments();
//     const totalItems = await Item.countDocuments();
//     const totalDonations = await Item.countDocuments({ transactionType: "donation" });
//     const totalSales = await Item.countDocuments({ transactionType: "sale" });
//     const totalPayments = await Payment.countDocuments({ status: "successful" });

//     res.json({
//       totalUsers,
//       totalItems,
//       totalDonations,
//       totalSales,
//       totalPayments,
//     });
//   } catch (error) {
//     console.error("❌ Dashboard stats error:", error);
//     res.status(500).json({ message: "Server error fetching dashboard stats" });
//   }
// };


export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalItems = await Item.countDocuments();
    const totalDonations = await Item.countDocuments({ transactionType: "donation" });
    const totalSales = await Item.countDocuments({ transactionType: "sale" });
    const totalRequests = await Item.countDocuments({ transactionType: "request" });
    const totalPayments = await Payment.countDocuments({ status: "successful" });
    const totalTestimony = await testimonyModel.countDocuments();

    // ✅ Sum all approved proof of payments
    const proofAggregation = await ProofOfPayment.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalProofs: { $sum: 1 },
        },
      },
    ]);

    const totalProofs = proofAggregation.length > 0 ? proofAggregation[0].totalProofs : 0;
    const totalProofAmount = proofAggregation.length > 0 ? proofAggregation[0].totalAmount : 0;

    res.json({
      totalUsers,
      totalItems,
      totalDonations,
      totalSales,
      totalRequests,
      totalPayments,
      totalProofs,
      totalProofAmount,
      totalTestimony
    });
  } catch (error) {
    console.error("❌ Dashboard stats error:", error);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
  }
};
