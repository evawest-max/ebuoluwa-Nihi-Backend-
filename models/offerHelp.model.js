import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  itemTitle: { type: String, required: true },
  requesterId: { type: String,  },
  requesterName: { type: String, required: true },
  requesterEmail: { type: String},
  helperId: { type: String, },
  helperName: { type: String, required: true },
  helperEmail: { type: String, required: true },
  pickupLocation: { type: String, required: true },
  contactInfo: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "pending" },
});

const Offer = mongoose.model('Offer', offerSchema);

export default Offer;
