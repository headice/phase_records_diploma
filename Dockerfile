# Build the React application
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies using the lockfile for reproducible installs
COPY coursework_phase_records/client/app/package*.json ./
RUN npm install

# Copy source and build the production bundle
COPY coursework_phase_records/client/app ./
ARG REACT_APP_API_BASE_URL=http://localhost/api/
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
RUN npm run build

# Serve the optimized build with nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
