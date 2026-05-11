# 抖音云固定执行 /opt/application/run.sh，WORKDIR 必须与此一致
FROM node:18-alpine
WORKDIR /opt/application
COPY package.json ./
RUN npm install --omit=dev
COPY index.js run.sh ./
RUN chmod +x run.sh
EXPOSE 8000
ENV NODE_ENV=production
CMD ["sh", "/opt/application/run.sh"]
