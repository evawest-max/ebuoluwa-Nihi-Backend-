import express from 'express';
import { getAllPaymentTransactions, deleteMultiplePaymentTransactions, deletePaymentTransaction, deletePendingPaymentTransactions, getAllDonationPaymentTransactions, deleteSingleDonationPaymentTransaction, deleteDonationMultiplePaymentTransactions, deleteAllDonationPendingPaymentTransactions } from '../controllers/paymentTransactions.controller.js';
import { auth, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/payment/all-Transactions', auth, isAdmin,  getAllPaymentTransactions);
router.post('/payments/delete-transaction//multiple', auth, isAdmin, deleteMultiplePaymentTransactions);
router.delete('/payments/delete-transaction/pending', auth, isAdmin,  deletePendingPaymentTransactions);
router.delete('/payments-transaction/:id', auth, isAdmin, deletePaymentTransaction);

router.get('/payments/all-financial-donation/transactions', auth, isAdmin,  getAllDonationPaymentTransactions);
router.post('/payments/delete-financial-donation/multiple', auth, isAdmin, deleteDonationMultiplePaymentTransactions);
router.delete('/payments/delete-financial-donation/pending', auth, isAdmin,  deleteAllDonationPendingPaymentTransactions);
router.delete('/payments/delete-financial-donation/:id', auth, isAdmin, deleteSingleDonationPaymentTransaction);


export default router;