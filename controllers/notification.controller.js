import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { sendEmail } from "../utils/email.js";

// Create a notification & optionally send email
export const createNotification = async ({ userId, type, message, sendMail = false }) => {
  const notification = await Notification.create({ user: userId, type, message });

  if (sendMail) {
    const user = await User.findById(userId);
    if (user) {
      await sendEmail({ to: user.email, subject: "Donation Marketplace Notification", text: message });
    }
  }

  return notification;
};

// Get notifications for user
export const getNotifications = async (req, res) => {
  const userId = req.user._id;
  const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
  res.json(notifications);
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  notification.read = true;
  await notification.save();
  res.json(notification);
};
