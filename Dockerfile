# Use a Node.js base image
FROM node:16

# Set the working directory
WORKDIR /app

# Define ARG variables with default values
ARG PORT=5000
ARG VITE_WS_URL=unset

# Copy package.json and pnpm-lock.yaml to the container
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install project dependencies using pnpm
RUN pnpm install

# Copy the rest of the project files to the container
COPY . .

# Build the project with Vite
RUN pnpm run build

# Set the environment variables
ENV VITE_WS_URL $VITE_WS_URL

# Expose the desired port (replace 3000 with the port your app listens on)
EXPOSE 3000

# Start the application (replace "build" with the appropriate command to start your app)
CMD ["pnpm", "run", "serve", "--host", "3000"]