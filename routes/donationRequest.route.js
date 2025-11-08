
import express from 'express';
import { createDonationRequest, deleteDonationRequestStatus, getAllDonationRequests, updateDonationRequestStatus } from '../controllers/donationRequest.controller.js';
import { auth, isAdmin } from '../middleware/auth.middleware.js';



const router = express.Router();

// POST /api/donation-request
router.post('/donation-request', auth, createDonationRequest);
// GET /api/donation-requests
router.get('/all-donation-requests',  auth, isAdmin, getAllDonationRequests);
// PATCH /api/donation-request/:id/status
router.patch('/donation-request/:id/status', auth, isAdmin, updateDonationRequestStatus);
router.delete('/donation-request/:id', auth, isAdmin, deleteDonationRequestStatus);

export default router;
