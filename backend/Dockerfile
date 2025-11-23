FROM node:20

# instalar npm versão solicitada
RUN npm install -g npm@11.6.3

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 4000
CMD ["npm", "start"]
