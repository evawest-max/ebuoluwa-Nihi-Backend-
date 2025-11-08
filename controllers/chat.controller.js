import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const sender = req.user._id;

    const chat = await Chat.create({ sender, receiver: receiverId, message });
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get chat messages between user and admin
export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const otherId = req.params.userId; // admin id or user id

    const chats = await Chat.find({
      $or: [
        { sender: userId, receiver: otherId },
        { sender: otherId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
