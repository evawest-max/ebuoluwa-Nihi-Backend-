import express from "express";
import {
  getUsers,
  suspendUser,
  liftSuspension,
  changeUserRole,
  getAllItems,
  approveItemAdmin,
  getAnalytics,
  generateReport,
  createPaymentLink,
  updatePaymentLink,
  getPaymentLinks,
  deleteUser,
  deleteItemAdmin,
  getUserKYCById,
  rejectItemAdmin,
  rejectVerificationRequest,
} from "../controllers/admin.controller.js";
import { approveVerification } from "../controllers/admin.controller.js";
import { auth, isAdmin } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";
import { getDashboardStats } from "../controllers/adminStats.controller.js";
import { approveProofOfPayment, getAllProofsOfPayment, rejectProofOfPayment } from "../controllers/user.controller.js";
import { approveTestimony, deleteTestimony, featureTestimony, getAllTestimonies } from "../controllers/testimony.controller.js";

const router = express.Router();

router.use(auth, roleCheck(["admin"]));
router.get("/users", getUsers);
router.get("/stats", getDashboardStats);
router.put("/users/:id/suspend", auth, isAdmin, suspendUser);
router.delete("/users/:id", auth, isAdmin, deleteUser);
router.put("/users/:id/lift", auth, isAdmin, liftSuspension);
router.put("/users/:id/role", auth, isAdmin, changeUserRole);
router.put("/users/:id/verify", auth, isAdmin, approveVerification); 
router.put("/users/:userId/reject-verification", auth, isAdmin, rejectVerificationRequest);

router.get("/items", auth, isAdmin, getAllItems);
router.put("/items/approve/:id", auth, isAdmin, approveItemAdmin);
router.put("/items/reject/:id", auth, isAdmin, rejectItemAdmin);
router.delete("/items/:id", auth, isAdmin, deleteItemAdmin);
router.get("/analytics", auth, isAdmin, getAnalytics);
router.post("/paymentLink", auth, isAdmin, createPaymentLink);
router.put("/paymentLink", updatePaymentLink);
router.get("/paymentLink", getPaymentLinks);
router.get("/report", auth, isAdmin, generateReport);
router.get("/users/:id/kyc", auth, isAdmin, getUserKYCById);
router.put("/proofs/approve/:proofId", auth, isAdmin,  approveProofOfPayment);
router.put("/proofs/reject/:proofId", auth, isAdmin,  rejectProofOfPayment);
router.get("/proofs", getAllProofsOfPayment);
router.get("/testimony/all", getAllTestimonies);
router.put("/testimony/feature/:id", featureTestimony);
router.put("/testimony/approve/:id", approveTestimony);
router.delete("/testimony/:id", auth, isAdmin, deleteTestimony);
export default router;
