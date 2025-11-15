import Item from "../models/item.model.js";
import userModel from "../models/user.model.js";

// Create item
export const createItem = async (req, res) => {
  console.log("✅ Hit createItem route");
  console.log("✅ Raw request body:", req.body);
  console.log("✅ Uploaded files:", req.files);
  try {
    const { title, description, category, price, location, urgency, contactInfo, transactionType } = req.body;
    const donor = req.user._id;
    const user = await userModel.findById(donor);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.suspended === true) {
      return res.status(403).json({ message: 'Your account has been suspended, please contact support' });
    }

    const images = req.files?.map(file => file.filename) || [];

    const item = await Item.create({
      title,
      description,
      itemCategory: category,
      price: price || 0,
      donor,
      images: images.length>0? images: ["https://media.istockphoto.com/id/2149167948/photo/word-request-on-speech-bubble.jpg?s=612x612&w=0&k=20&c=ovOOjZhT47nvYhdz43mEUAAHwzTZDI0IunYDZFc67nU="],
      location: location || ["84848"], 
      urgency: urgency || "low",
      contactInfo: contactInfo || "Not provided",
      transactionType: transactionType || "donation",
      status: "pending",
    });

    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all items (with optional filters)
export const getItems = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;

    const filters = { approved: true };

    if (category) filters.category = category;
    if (minPrice) filters.price = { ...filters.price, $gte: parseFloat(minPrice) };
    if (maxPrice) filters.price = { ...filters.price, $lte: parseFloat(maxPrice) };
    if (search) filters.title = { $regex: search, $options: "i" };

    const items = await Item.find(filters).populate("donor", "name email");

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export const getItems = async (req, res) => {
//   try {
//     const filters = {};
//     if (req.query.category) filters.category = req.query.category;
//     if (req.query.approved) filters.approved = req.query.approved === "true";

//     const items = await Item.find(filters).populate("donor", "name email");
//     res.json({ items });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// Get single item
export const getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate("donor", "name email");
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin approves item
export const approveItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.approved = true;
    await item.save();

    res.json({ message: "Item approved", item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete item
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Only donor or admin can delete
    if (!req.user._id.equals(item.donor) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await item.deleteOne();
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get nearby items
export const getNearbyItems = async (req, res) => {
  try {
    const { lat, lng, radius = 5, category } = req.query; // radius in km

    if (!lat || !lng) return res.status(400).json({ message: "Latitude and longitude required" });

    const filters = { approved: true };
    if (category) filters.category = category;

    const items = await Item.find({
      ...filters,
      location: {
        $geoWithin: {
          $centerSphere: [[parseFloat(lng), parseFloat(lat)], radius / 6378.1], // radius in radians
        },
      },
    }).populate("donor", "name email");

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


