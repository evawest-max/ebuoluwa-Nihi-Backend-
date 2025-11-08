import express from "express";
// import { auth } from "../middlewares/auth.middleware.js";
// import { roleCheck } from "../middlewares/role.middleware.js";
import {
  createItem,
  getItems,
  getItem,
  approveItem,
  deleteItem,
  getNearbyItems,
} from "../controllers/item.controller.js";
import multer from "multer";
import { auth } from "../middleware/auth.middleware.js";
import { roleCheck } from "../middleware/role.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // simple storage

router.post("/", auth, upload.array("images", 5), createItem); // user creates item
router.get("/", getItems); // anyone can view
router.get("/:id", getItem); 
router.put("/:id/approve", auth, roleCheck(["admin"]), approveItem); // admin approves
router.delete("/:id", auth, deleteItem); // donor or admin deletes
router.get("/nearby", getNearbyItems); // public or auth optional

export default router;
