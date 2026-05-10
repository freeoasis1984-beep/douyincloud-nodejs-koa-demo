FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.js ./
EXPOSE 8000
ENV NODE_ENV=production
CMD ["node", "index.js"]
