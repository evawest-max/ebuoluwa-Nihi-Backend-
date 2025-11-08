import RequestItem from "../models/request.model.js";

export const createRequestItem = async (req, res) => {
  try {
    const userId = req.user?._id; 
    const {
      title,
      description,
      category,
      urgency,
      location,
      contactInfo,
      // reason,
      // image,
    } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    const request = await RequestItem.create({
      user: userId,
      title,
      description,
      category,
      urgency: urgency || "low",
      location,
      contactInfo,
      // reason,
      // image: image || null,
      status: "pending",
    });

    res.status(201).json({
      message: "Request created successfully.",
      request,
    });
  } catch (err) {
    console.error("Error creating request:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAllRequests = async (req, res) => {
  try {
    const requests = await RequestItem.find().populate("user", "name email");
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch requests", error: err.message });
  }
};

// Optional: get single user requests
export const getUserRequests = async (req, res) => {
  try {
    const requests = await RequestItem.find({ user: req.user._id });
    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user requests", error: err.message });
  }
};
