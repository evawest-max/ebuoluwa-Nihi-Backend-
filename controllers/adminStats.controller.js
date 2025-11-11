// controllers/adminStats.controller.js
import User from "../models/user.model.js";
import Item from "../models/item.model.js";
import Payment from "../models/Payment.model.js";
import ProofOfPayment from "../models/financialDonationsTransactions.model.js";
import testimonyModel from "../models/testimony.model.js";



export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalItems = await Item.countDocuments();
    const totalDonations = await Item.countDocuments({ transactionType: "donation" });
    const totalSales = await Item.countDocuments({ transactionType: "sale" });
    const totalRequests = await Item.countDocuments({ transactionType: "request" });
    const totalPayments = await Payment.countDocuments({ status: "pending" });
    const totalTestimony = await testimonyModel.countDocuments();

    // ✅ Sum all approved proof of payments
    const proofAggregation = await ProofOfPayment.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalProofs: { $sum: 1 },
        },
      },
    ]);
    // ✅ Sum all approved proof of payments
    const transactionAggregation = await Payment.aggregate([
      { $match: { status: "success" } },
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
    const totalTransaction = transactionAggregation.length > 0 ? transactionAggregation[0].totalAmount : 0;


    res.json({
      totalUsers,
      totalItems,
      totalDonations,
      totalSales,
      totalRequests,
      totalPayments,
      totalProofs,
      totalProofAmount,
      totalTestimony,
      totalTransaction
    });
  } catch (error) {
    console.error("❌ Dashboard stats error:", error);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
  }
};
