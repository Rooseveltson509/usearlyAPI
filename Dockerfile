# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.8.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
# Copy only package.json and package-lock.json
COPY ./package.json ./package-lock.json ./

# Install all dependencies
RUN npm install --production && ls node_modules | grep jsonwebtoken

# Copy application code
COPY . .

RUN ls node_modules | grep jsonwebtoken

RUN ls -al /app

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Expose the application port
EXPOSE ${PORT}

# Start the server by default, this can be overwritten at runtime
CMD [ "node", "index.js" ]