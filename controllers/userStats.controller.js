
import Item from "../models/item.model.js";
import donations from "../models/financialDonationsTransactions.model.js";
import userModel from "../models/user.model.js";
import financialDonationsTransactionsModel from "../models/financialDonationsTransactions.model.js";
import mongoose from "mongoose";


export const getUserDashboardStats = async (req, res) => {
  const { userId } = req.params;
    console.log("my id:"+ userId)
  try {
    //find user with this id
    const user = await userModel.find({ _id: userId })
    console.log("my account:"+user)
    // Count all items created by the user
    const totalItems = await Item.countDocuments({donor: userId });

    // Count items by transaction type
    const totalDonations = await Item.countDocuments({ transactionType: "donation", donor: userId });
    const totalSales = await Item.countDocuments({ transactionType: "sale", donor: userId });
    const totalRequests = await Item.countDocuments({ transactionType: "request", donor: userId });

const donationStats = await financialDonationsTransactionsModel.aggregate([
  {
    $match: {
      status: "success",
      userId: new mongoose.Types.ObjectId(userId)
    }
  },
  {
    $group: {
      _id: "$userId",
      totalAmount: { $sum: "$amount" },
    },
  },
]);

    const totalDonationTransactions =
      donationStats.length > 0 ? donationStats[0].totalAmount : 0;
    // const totalProofs =
    //   donationAggregation.length > 0 ? donationAggregation[0].totalProofs : 0;

    res.json({
      totalItems,
      totalDonations,
      totalSales,
      totalRequests,
      totalDonationTransactions,
    //   totalProofs,
    });
  } catch (error) {
    console.error("❌ Dashboard stats error:", error);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
  }
};
