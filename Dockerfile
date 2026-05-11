FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.js run.sh ./
RUN chmod +x run.sh
EXPOSE 8000
ENV NODE_ENV=production
CMD ["sh", "run.sh"]
