import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import { uploadID } from "../middleware/upload.middleware.js";
import {
  changePassword,
  getDashboard,
  submitVerification,
  checkVerificationStatus,
  addItem,
  getItems,
  getUserItems,
  countUserDonations,
  countUserSales,
  getInstitutionalUsers,
  uploadProofOfPayment,
  getUserProofCount,
  getUserDonatedAmount,
  getApprovedItems,
  updateUserProfile,
  updateProfilePicture,
  deleteItem,
} from "../controllers/user.controller.js";
import {
  createRequestItem,
  getAllRequests,
  getUserRequests,
} from "../controllers/request.controller.js";
import { getPaymentLinks } from "../controllers/admin.controller.js";
import {
  countUserTestimony,
  createTestimony,
  getFeaturedTestimonies,
} from "../controllers/testimony.controller.js";
import { createItem } from "../controllers/item.controller.js";

const router = express.Router();

router.post("/password", auth, changePassword);
router.get("/dashboard", auth, getDashboard);
router.post(
  "/verify",
  auth,
  uploadID.fields([
    { name: "idDocument", maxCount: 1 },
    { name: "selfieDocument", maxCount: 1 },
  ]),
  submitVerification
);
router.get("/verify/status", auth, checkVerificationStatus);
router.post(
  "/add-item",
  auth,
  uploadID.fields([{ name: "image", maxCount: 1 }]),
  addItem
);
router.delete("/delete-item/:id", auth, deleteItem);
router.put("/:id/logo", auth, uploadID.single("logo"), updateProfilePicture);
router.post("/upload", auth, uploadID.single("proof"), uploadProofOfPayment);
router.get("/get-items", getItems);
router.get("/institutional-users", getInstitutionalUsers);
router.get("/user-items/:userId", auth, getUserItems);
router.get("/items/:userId/donations/count", auth, countUserDonations);
router.get("/items/:userId/sales/count", auth, countUserSales);
router.post("/request", auth, createItem);
router.get("/request", auth, getAllRequests);
router.get("/request/:id", auth, getUserItems);
router.get("/my/request", auth, getUserRequests);
router.get("/paymentLink", auth, getPaymentLinks);
router.get("/proofs/count/:userId", auth, getUserProofCount);
router.get("/:userId/donated-amount", auth, getUserDonatedAmount);
router.get("/items/approved", getApprovedItems);
router.put("/:id", auth, updateUserProfile);
router.get("/testimony/:id", auth, countUserTestimony);
router.post("/testimony", auth, uploadID.single("image"), createTestimony);
// router.get("/testimony/featured", getFeaturedTestimonies);

export default router;
