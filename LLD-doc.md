# Low-Level Design: Image Processing Application

## 1. System Overview

The image processing application is designed to accept CSV files containing product information and image URLs, process these images asynchronously which means the images will be compressed by 50% of its original quality, and provide status updates to the client. The system uses a combination of Express.js for the API layer, MongoDB for data storage, Redis and Bull for job queuing, and an external image processing service for image manipulation.

## 2. Component Diagram

![Image Processing Application Component Diagram](/assets//Mediamodifier-Design-Template.jpg)

## 3. Component Descriptions

### a) Express.js API
- Handles incoming HTTP requests for CSV upload and status checks.
- Routes: 
  - `/api/upload` (POST)
  - `/api/status/:requestId` (GET)
- Controllers: 
  - `upload.controller.js`
  - `status.controller.js`

### b) MongoDB
- Stores request and product information.
- Models: 
  - `Request`
  - `Product`

### c) Redis/Bull Queue
- Manages asynchronous job processing.
- Configured in `image.worker.js`

### d) Image Processing Worker
- Processes queued jobs.
- Fetches pending requests from the database.
- Compresses and optimizes images using Sharp.
- Uploads processed images to Cloudinary.
- Updates job status in the database.
- Generates and stores CSV reports in Cloudinary.
- Sends webhook notifications to external services.

### e) Async Image Processing Service
- External service for image manipulation.
- Uses Sharp library for image compression and manipulation.
- Accepts image processing requests.
- Sends callbacks with processed image results.

### f) Webhook Handling
- Integrated in `image.worker.js`.
- Sends POST requests to URL from `WEBHOOK_URL` in `.env`.
- Triggers after each request completion.

### g) CSV Generator
- Creates CSV reports of processed products.
- Stores reports in the file storage system i.e Cloudinary.

### h) File Storage - Cloudinary
- Stores generated CSV reports and processed images.


## 4. Database Schema

The database schema is designed to store product data and track the status of each image processing request. The system uses MongoDB as the database, with two main collections: Request and Product. These collections are structured to efficiently manage and query data related to image processing.

### 1. Request Collection

The Request collection stores metadata about each image processing request. This collection is the primary entry point for tracking the progress and status of image processing jobs.

Collection Name: requests

Fields:
- **requestId** (String):
  - Description: A unique identifier for each processing request.
  - Details: Generated using a custom UUID-like function to ensure uniqueness.
  - Constraints: Unique, Primary Key.
- **status** (String):
  - Description: Indicates the current status of the processing request.
  - Details: Possible values include 'pending', 'in progress', 'completed', and 'failed'.
  - Default Value: 'pending'.
- **createdAt** (Date):
  - Description: Timestamp indicating when the request was created.
  - Details: Automatically set to the current date and time.
  - Default Value: Date.now.
- **updatedAt** (Date):
  - Description: Timestamp indicating when the request was last updated.
  - Details: Automatically updated whenever the request status changes.
  - Default Value: Date.now.

![request collection](/assets/request.PNG)

### 2. Product Collection

The Product collection stores data related to each product that is part of an image processing request. This collection contains both the input image URLs (before processing) and the output image URLs (after processing).

Collection Name: products

Fields:
- **serialNumber** (Number):
  - Description: The serial number of the product as provided in the CSV file.
  - Details: Used to identify the order of products in a request.
- **productName** (String):
  - Description: The name of the product.
  - Details: Derived from the CSV file.
- **inputImageUrls** (Array of Strings):
  - Description: List of URLs pointing to the original images for the product.
  - Details: Extracted from the CSV file.
- **outputImageUrls** (Array of Strings):
  - Description: List of URLs pointing to the processed images for the product.
  - Details: Populated after processing is complete.
- **requestId** (String):
  - Description: Foreign key linking the product to its corresponding processing request.
  - Details: References the requestId in the Request collection.
  - Constraints: Required, Reference to requests.
  
  ![product collection](/assets/product.PNG)


## 5. API Documentation

### a) Upload API
- Endpoint: POST `/api/upload`
- Description: Accepts a CSV file containing product information and initiates the image processing job.
- Input: 
  - file = CSV file (multipart/form-data)
- CSV format: S. No., Product Name, Input Image Urls
- Sample CSV file: [sample.csv](/sample/sample_csv.csv)
- Output: JSON with requestId and statusUrl
- Example Response:
  ```json
  {
    "requestId": "fb5321a6-6bf7-4dbd-b61f-203a4dfb06bc",
    "statusUrl": "http://localhost:8000/api/status/fb5321a6-6bf7-4dbd-b61f-203a4dfb06bc"
  }
  ```

### b) Status API
- Endpoint: GET `/api/status/:requestId`
- Description: Retrieves the current status of a processing request.
- Input: requestId in URL parameter
- Output: JSON with status information
- Example Response:
  ```json
  {
    "status": "completed"
  }
  ```

## 6. Asynchronous Workers Documentation

### Image Processing Worker (`image.worker.js`)

The main worker function `processImages()` performs the following tasks:

1. Fetches pending requests from the database.
2. For each request:
   - Retrieves associated products.
   - For each product:
     - Fetches the image from the input URL.
     - Uses Sharp to compress and optimize the image.
     - Uploads the compressed image to Cloudinary.
     - Updates the product with the new image URLs.
   - Generates a CSV report with product details and uploads it to Cloudinary.
   - Updates the request status to 'completed'.
   - Sends a webhook notification with the processing results.
   - User can update the webhook URL in `.env` file.
   - Webhook response: 

     ```json
     // on success
     {
            "requestId": "fb5321a6-6bf7-4dbd-b61f-203a4dfb06bc",
            "status": "completed",
            "message": "All images have been processed successfully.",
            "csvDownloadUrl": "https://res.cloudinary.com/daoun5nwk/raw/upload/v1725025374/csv_reports/output-fb5321a6-6bf7-4dbd-b61f-203a4dfb06bc.csv"
     }

     // on failure
     {
            "requestId": "fb5321a6-6bf7-4dbd-b61f-203a4dfb06bc",
            "status": "failed",
            "message": "Image processing failed.",
     }
     ```


### Error Handling

- If an error occurs during processing:
  - The request status is updated to 'failed'.
  - A failure webhook notification is sent.
  - The error is logged, but processing continues for other requests.

## 7. Error Handling and Retry Mechanism

- Implements error handling for failed image processing attempts.
- Uses Bull's built-in retry mechanism for failed jobs.
- Updates request statuses to 'failed' when errors occur.
- Continues processing other requests even if one fails.

## 8. Scalability Considerations

- Uses Redis and Bull for job queuing, allowing for distributed processing.
- Processes images asynchronously, improving throughput.
- Utilizes Cloudinary for scalable image and CSV storage.

## 9. Security Measures

- Uses environment variables for sensitive configuration (Cloudinary, Redis, Webhook URL).
- Implements error handling to prevent system crashes from individual request failures.

This Low-Level Design provides a comprehensive overview of the image processing application's architecture and components. It covers the system design, database schema, API specifications, worker functionality, and additional considerations for scalability and security.