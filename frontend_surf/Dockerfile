# Use the latest LTS version of Node.js with full system libraries
FROM node:22

# Install all required system dependencies including Linux headers
RUN apt-get update && \
    apt-get install -y \
    python3 \
    make \
    g++ \
    libusb-1.0-0-dev \
    linux-headers-generic \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Clean install npm and clear cache
RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm install --force

# Copy the rest of your application files
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Define the command to run your app
CMD ["npm", "start"]
