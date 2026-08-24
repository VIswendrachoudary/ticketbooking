FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY backend/package.json ./backend/package.json
RUN npm install
COPY backend ./backend
WORKDIR /app/backend
RUN npx prisma generate && npm run build
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
