# Image Processing Application

Hosted on AWS EC2 instance : [image-processing-app.com](http://44.202.10.113:5173/)  ** Closed due to limited free tier.

NOTE: The server is hosted on a free tier EC2 instance(t2.micro). Could break for large csv file. You can use this [sample csv](/sample/sample_csv.csv) file to test the server. I tried to send csv files with 10 rows, the EC2 instance became unresponsive and was not able to ssh for ~1 hour. could be beacuse of the free tier EC2 instance. 

Postman Collection: [image-processing-app.postman_collection.json](/image-processing-app.postman_collection.json)

Webhook Listener: [webhook.site](https://webhook.site/#!/view/9efb83dc-3acb-4e22-a45f-40e822aa4fd5/4f9b0aea-82c1-4982-83ce-445160d4dab0/1) (Open the webhook listener for output csv file.)

Low-Level Design : [Low-Level Design Document](/LLD-doc.md)

## Local Setup

- Clone the repository
  ```bash
  git clone https://github.com/suraj2860/image-processing-app.git
  ```
- Install the dependencies
  ```bash
  npm install
  ```
- Create a .env file with the variables from .env.example. replace the values with your own.
  
- Start the local redis server using docker
  ```bash
  docker run --name redis -d -p 6379:6379 redis
  ```
- Start the server
  ```bash
  npm start
  ``` 
