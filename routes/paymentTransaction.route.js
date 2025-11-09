import express from 'express';
import { getAllPaymentTransactions, deleteMultiplePaymentTransactions, deletePaymentTransaction, deletePendingPaymentTransactions } from '../controllers/paymentTransactions.controller.js';
import { auth, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/paymentTransactions', auth, isAdmin,  getAllPaymentTransactions);
router.post('/payments/delete', auth, isAdmin, deleteMultiplePaymentTransactions);
router.delete('/payments/delete-pending', auth, isAdmin,  deletePendingPaymentTransactions);
router.delete('/payments/:id', auth, isAdmin, deletePaymentTransaction);


export default router;