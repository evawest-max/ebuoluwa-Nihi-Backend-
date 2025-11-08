export const createItem = async (req, res) => {
  try {
    const {
      id,
      title,
      description,
      category,
      type,
      image,
      location,
      price,
      status,
      userId,
      userName,
    } = req.body;

    // Create new item
    const newItem = new Item({
      id,
      title,
      description,
      category,
      type,
      image,
      location,
      price,
      status,
      userId,
      userName,
    });

    // Save to database
    const savedItem = await newItem.save();

    res.status(201).json({
      message: 'Item created successfully',
      item: savedItem,
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({
      message: 'Failed to create item',
      error: error.message,
    });
  }
};