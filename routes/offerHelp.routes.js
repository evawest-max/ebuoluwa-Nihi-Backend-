import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { createOffer, deleteOffer, getAllOffers, updateOfferStatus } from '../controllers/offerHelp.controller.js';

const router = express.Router();

// POST /api/offer
router.post('/offer', auth, createOffer);
// GET /api/offers
router.get('/all-offers', auth, getAllOffers);
// PATCH /api/offer/:id/status
router.patch('/offer/:id/status', auth, updateOfferStatus);
// DELETE /api/offer/:id
router.delete('/offer/:id', auth, deleteOffer);

export default router;
