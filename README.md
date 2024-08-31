# Image Processing Application

Hosted on AWS EC2 instance : [image-processing-app.com](http://54.237.102.69:5173/)

NOTE: The server is hosted on a free tier EC2 instance. it is not working as expected on EC2 instance, trying to fix it. (works fine on local) 

Postman Collection: [image-processing-app.postman_collection.json](/image-processing-app.postman_collection.json)

Webhook Listener: [webhook.site](https://webhook.site/#!/view/9efb83dc-3acb-4e22-a45f-40e822aa4fd5/4f9b0aea-82c1-4982-83ce-445160d4dab0/1)

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