import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import Request from '../models/request.model.js';
import Product from '../models/product.model.js';
import { addImageToQueue } from '../workers/image.worker.js';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

const uploadCsv = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Please upload a CSV file' });
    }

    const request = new Request();
    await request.save();

    const products = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (row) => {
          products.push({
            serialNumber: row['S. No.'],
            productName: row['Product Name'],
            inputImageUrls: row['Input Image Urls'].split(','),
            requestId: request.requestId,
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    await Product.insertMany(products);
    await addImageToQueue(request.requestId);

    // Delete previous CSV files
    const uploadsDir = 'uploads/';
    const files = fs.readdirSync(uploadsDir);
    for (const oldFile of files) {
      if (oldFile !== file.filename && oldFile.endsWith('.csv')) {
        fs.unlinkSync(path.join(uploadsDir, oldFile));
      }
    }

    const host = req.get('host');
    const protocol = req.protocol;

    res.status(200).json({
      requestId: request.requestId,
      statusUrl: `${protocol}://${host}/api/status/${request.requestId}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
};

export { upload, uploadCsv };
