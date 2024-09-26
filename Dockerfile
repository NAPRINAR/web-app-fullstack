# Используем образ линукс Alpine с версией node 14
FROM node:19.5.0-alpine

# Указываем нашу рабочую директорию
WORKDIR /app

# Копируем package.json и package.lock.json внутрьь контейнера
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем всё остальные файлы
COPY . .

# Устанавилваем prisma
RUN npm install -g prisma

# Генерируем Prisma client
RUN prisma generate

# Копируем Prsima schema
COPY prisma/schema.prisma ./prisma/

# Открыть порт в нашем контейнере
EXPOSE 3000

# Запускаем наш сервер
CMD ["npm", "start"]