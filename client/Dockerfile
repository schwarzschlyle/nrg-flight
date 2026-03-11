## Client (React + Vite)
##
## This Dockerfile is set up for the same workflow as local dev:
##   npm run dev
##
## It reads VITE_* variables from the container environment at runtime.

FROM node:20-alpine

WORKDIR /app

# Install deps first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the app
COPY . .

EXPOSE 5173

# Bind to all interfaces so it is reachable from outside the container.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
