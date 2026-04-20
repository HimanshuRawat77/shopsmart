# Use official Node.js image
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY app/package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY app/ .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD [ "npm", "start" ]
