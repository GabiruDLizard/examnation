# filepath: c:\Users\Kendr\OneDrive\Documents\Examnation\examnation\dockerfile
# ---- Stage 1: Build the React app ----
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

COPY package*.json ./
# Install dependencies
RUN npm install --silent

# Copy source code
COPY . .

# Build the application
RUN npm run build

FROM nginx:stable-alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy React build output to Nginx html folder
COPY --from=build /app/build /usr/share/nginx/html

# Create nginx config for React SPA
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    error_page 500 502 503 504 /50x.html; \
    location = /50x.html { \
        root /usr/share/nginx/html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]