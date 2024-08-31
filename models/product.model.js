import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  serialNumber: Number,
  productName: String,
  inputImageUrls: [String],
  outputImageUrls: [String],
  requestId: { type: String, required: true, ref: 'Request' },
});

const Product = mongoose.model('Product', productSchema);

export default Product;