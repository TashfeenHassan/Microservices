# Use official Node.js image
FROM node:20-alpine 

# Set working directory
WORKDIR /app 

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install 

# Copy all source files
COPY . .

# Expose the service port
EXPOSE 8002 

# Start the application
CMD ["node", "server.js"]
