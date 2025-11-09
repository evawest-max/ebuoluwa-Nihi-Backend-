import axios from "axios";
import dotenv from 'dotenv';
dotenv.config();
// import Payment from "../models/payment.model.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import payment from "../models/Payment.model.js";

//fetch all payment transactions
export const getAllPaymentTransactions = async (req, res) => {
  try {
    const payments = await payment.find().sort({ createdAt: -1 });
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
    const singlepayment = await payment.findByIdAndDelete(id);
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
    await payment.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Payment transactions deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting payment transactions' });
  }
};

export const deletePendingPaymentTransactions = async (req, res) => {
  try {
    const result = await payment.deleteMany({ status: 'pending' });
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