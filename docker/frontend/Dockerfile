FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json from the frontend directory
COPY ./frontend/package.json ./frontend/package-lock.json ./

# Install dependencies and the Expo CLI
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 19000

# Start the Expo app
CMD ["npx", "expo", "start", "--port", "19000"]
