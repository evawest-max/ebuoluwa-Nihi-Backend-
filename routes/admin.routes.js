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
import { auth } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";
import { getDashboardStats } from "../controllers/adminStats.controller.js";
import { approveProofOfPayment, getAllProofsOfPayment, rejectProofOfPayment } from "../controllers/user.controller.js";
import { approveTestimony, deleteTestimony, featureTestimony, getAllTestimonies } from "../controllers/testimony.controller.js";

const router = express.Router();

router.use(auth, roleCheck(["admin"]));
router.get("/users", getUsers);
router.get("/stats", getDashboardStats);
router.put("/users/:id/suspend", suspendUser);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/lift", liftSuspension);
router.put("/users/:id/role", changeUserRole);
router.put("/users/:id/verify", approveVerification); 
router.put("/users/:userId/reject-verification", rejectVerificationRequest);

router.get("/items", getAllItems);
router.put("/items/approve/:id", approveItemAdmin);
router.put("/items/reject/:id", rejectItemAdmin);
router.delete("/items/:id", deleteItemAdmin);
router.get("/analytics", getAnalytics);
router.post("/paymentLink", createPaymentLink);
router.put("/paymentLink", updatePaymentLink);
router.get("/paymentLink", getPaymentLinks);
router.get("/report", generateReport);
router.get("/users/:id/kyc", getUserKYCById);
router.put("/proofs/approve/:proofId",  approveProofOfPayment);
router.put("/proofs/reject/:proofId",  rejectProofOfPayment);
router.get("/proofs", getAllProofsOfPayment);
router.get("/testimony/all", getAllTestimonies);
router.put("/testimony/feature/:id", featureTestimony);
router.put("/testimony/approve/:id", approveTestimony);
router.delete("/testimony/:id", deleteTestimony);
export default router;
