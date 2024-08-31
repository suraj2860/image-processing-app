import axios from 'axios';
import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/product.model.js';
import Request from '../models/request.model.js';
import Queue from 'bull';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Redis client 
const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

redisClient.on('error', (error) => {
    console.error('Redis connection error:', error);
});

// Create Bull queue with the custom Redis client
const imageQueue = new Queue('image processing', {
    redis: redisClient
});

const processImages = async () => {
    const pendingRequests = await Request.find({ status: 'pending' });

    for (const request of pendingRequests) {
        try {
            const products = await Product.find({ requestId: request.requestId });

            for (const product of products) {
                const outputImageUrls = await Promise.all(product.inputImageUrls.map(async (url) => {
                    // Fetch and compress image
                    const imageBuffer = await fetchImage(url);
                    const compressedImage = await compressImage(imageBuffer);

                    // Upload to Cloudinary
                    const result = await uploadToCloudinary(compressedImage);

                    return result.secure_url;
                }));

                // Update product with compressed image URLs
                product.outputImageUrls = outputImageUrls;
                await product.save();
            }

            // Generate CSV and upload to Cloudinary
            const csvCloudinaryUrl = await generateAndUploadCsv(products, request.requestId);

            // Update request status
            request.status = 'completed';
            request.updatedAt = new Date();
            await request.save();

            // Trigger the webhook after processing
            const webhookUrl = process.env.WEBHOOK_URL;
            if (webhookUrl) {
                await axios.post(webhookUrl, {
                    requestId: request.requestId,
                    status: 'completed',
                    message: 'All images have been processed successfully.',
                    csvDownloadUrl: csvCloudinaryUrl
                });

                console.log(`Webhook triggered for requestId: ${request.requestId}`);
            }
        } catch (error) {
            console.error(`Error processing request ${request.requestId}:`, error);
            // Update request status to failed
            request.status = 'failed';
            request.updatedAt = new Date();
            await request.save();

            // Optionally, trigger a failure webhook
            const webhookUrl = process.env.WEBHOOK_URL;
            if (webhookUrl) {
                await axios.post(webhookUrl, {
                    requestId: request.requestId,
                    status: 'failed',
                    message: 'Image processing failed.'
                });
            }
        }
    }
};

async function fetchImage(url) {
    const response = await axios({ url, responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
}

async function compressImage(imageBuffer) {
    return sharp(imageBuffer)
        .jpeg({ quality: 50 })
        .toBuffer();
}

async function uploadToCloudinary(imageBuffer) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'compressed_products' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        uploadStream.end(imageBuffer);
    });
}

function setupImageProcessor() {
    imageQueue.process(1, async (job) => {
        console.log(`Processing job: ${job.id}`);
        await processImages(); 
    });

    imageQueue.on('error', (error) => {
        console.error('Bull queue error:', error);
    });

    imageQueue.on('failed', (job, err) => {
        console.error(`Job ${job.id} failed with error: ${err.message}`);
    });

    imageQueue.on('completed', (job) => {
        console.log(`Job ${job.id} completed successfully`);
    });
}

export function addImageToQueue(imageId) {
    return imageQueue.add({ imageId });
}

const generateAndUploadCsv = async (products, requestId) => {
    const csvFilePath = path.join(__dirname, `../output/output-${requestId}.csv`);
    const csvWriter = createObjectCsvWriter({
        path: csvFilePath,
        header: [
            { id: 'serialNumber', title: 'S. No.' },
            { id: 'productName', title: 'Product Name' },
            { id: 'inputImageUrls', title: 'Input Image Urls' },
            { id: 'outputImageUrls', title: 'Output Image Urls' },
        ],
    });

    const records = products.map((product) => ({
        serialNumber: product.serialNumber,
        productName: product.productName,
        inputImageUrls: product.inputImageUrls.join(', '),
        outputImageUrls: product.outputImageUrls.join(', '),
    }));

    await csvWriter.writeRecords(records);
    console.log(`CSV file created successfully for requestId: ${requestId}`);

    // Upload CSV to Cloudinary
    try {
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(csvFilePath,
                {
                    resource_type: "raw",
                    public_id: `csv_reports/output-${requestId}`,
                    format: 'csv'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
        });

        console.log(`CSV file uploaded to Cloudinary: ${uploadResult.secure_url}`);

        // Delete local CSV file after upload
        fs.unlinkSync(csvFilePath);

        return uploadResult.secure_url;
    } catch (error) {
        console.error('Error uploading CSV to Cloudinary:', error);
        throw error;
    }
};

export { setupImageProcessor };
