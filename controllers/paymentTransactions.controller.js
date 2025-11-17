import dotenv from 'dotenv';
dotenv.config();
import Payment from "../models/Payment.model.js";
import donationPayment from "../models/financialDonationsTransactions.model.js";

//fetch all payment transactions
export const getAllPaymentTransactions = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching payment transactions' });
  }
};

//delete single payment transaction.
export const deletePaymentTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("item:"+ id)
    const singlepayment = await Payment.findByIdAndDelete(id);
    if (!singlepayment) {
      return res.status(404).json({ message: 'Payment transaction not found' });
    }
    res.json({ message: 'Payment transaction deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting payment transaction' });
  }
};

//delete multiple transactions at a time
export const deleteMultiplePaymentTransactions = async (req, res) => {
  try {
    const { ids } = req.body;
    await Payment.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Payment transactions deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting payment transactions' });
  }
};

export const deletePendingPaymentTransactions = async (req, res) => {
  try {
    const result = await Payment.deleteMany({ status: 'pending' });
    res.json({
      message: 'Pending payment transactions deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting pending payment transactions' });
  }
};



//fetch all financial Donation payment transactions
export const getAllDonationPaymentTransactions = async (req, res) => {
    console.log("it is hiting backend")
  try {
    const payments = await donationPayment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching payment transactions' });
  }
};

//delete single financial Donation payment transaction.
export const deleteSingleDonationPaymentTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("item:"+ id)
    const singlepayment = await donationPayment.findByIdAndDelete(id);
    if (!singlepayment) {
      return res.status(404).json({ message: 'Payment transaction not found' });
    }
    res.json({ message: 'Payment transaction deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting payment transaction' });
  }
};

//delete multiple financial Donation transactions at a time
export const deleteDonationMultiplePaymentTransactions = async (req, res) => {
  try {
    const { ids } = req.body;
    await donationPayment.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Payment transactions deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting payment transactions' });
  }
};

//delete all financial Donation transactions at a time
export const deleteAllDonationPendingPaymentTransactions = async (req, res) => {
  try {
    const result = await donationPayment.deleteMany({ status: 'pending' });
    res.json({
      message: 'Pending payment transactions deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting pending payment transactions' });
  }
};


//paginated controller

// const getAllPaymentTransactions = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const payments = await Payment.find()
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);
//     const total = await Payment.countDocuments();

//     res.json({
//       payments,
//       pagination: {
//         page,
//         limit,
//         total,
//         pages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error fetching payment transactions' });
//   }
// };

// export { getAllPaymentTransactions };