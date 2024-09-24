const { prisma } = require('../prisma/prisma-client');
const bcrypt = require('bcryptjs');
const jdenticon = require('jdenticon');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const UserController = {
  register: async (req, res) => {
    const { email, password, name } = req.body;
    // Валидация полей
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Все поля обязательны',
      });
    }
    try {
      // Проверка в БД существует ли пользователь
      const userExist = await prisma.user.findUnique({ where: { email } });
      if (userExist) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
      }
      // Хэширование пароля
      const hashedPassword = await bcrypt.hash(password, 10);
      // Генерация файла аватарки
      const png = jdenticon.toPng(name, 200);
      // Генерация названии аватарки
      const avatarName = `${name}_${Date.now()}.png`;
      // Генерация пути аватарки
      const avatarPath = path.join(__dirname, '../uploads', avatarName);
      // Создание Аватарки
      fs.writeFileSync(avatarPath, png);
      // Запись пользователя в БД
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          avatarUrl: `/uploads/${avatarPath}`,
        },
      });
      res.json(user);
    } catch (error) {
      console.error('Error in register', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
  login: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: 'Все поля обязательны',
      });
    }
    try {
      // Находим пользователя в БД
      const user = await prisma.user.findUnique({ where: { email } });
      // Проверка существует ли пользователь
      if (!user) {
        return res.status(400).json({ error: 'Неверный логин или пароль' });
      }
      // Расшифровка и проверка пароля
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(400).json({ error: 'Неверный логин или пароль' });
      }
      // Генерация токена
      const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY);
      // Отправка токена в Front
      res.json({ token });
    } catch (error) {
      console.error('login error', error);
      res.status(500).json({ error: 'Internal error' });
    }
  },
  getUserById: async (req, res) => {
    // Забираем id пользователя из параметров
    const { id } = req.params;
    // Забираем id из объекта user которую мы передаём из middleWare
    const userId = req.user.userId;
    try {
      //Забираем user - a и добавляем в объект поля followers и following
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          followers: true,
          following: true,
        },
      });
      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      // Проверка подписаны ли вы на пользователя
      const isFollowing = await prisma.follows.findFirst({
        where: { AND: [{ followerId: userId }, { followingId: id }] },
      });
      res.json({ ...user, isFollowing: Boolean(isFollowing) });
    } catch (error) {
      console.error('Get Current error', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
  updateUser: async (req, res) => {
    const { id } = req.params;
    const { email, name, dateOfBirth, bio, location } = req.body;

    let filePath;

    // Проверка в наличии файла в запросе
    if (req.file && req.file.path) {
      filePath = req.file.path;
    }

    if (id !== req.user.userId) {
      return res.status(403).json({ error: 'Нет доступа' });
    }
    try {
      let existingUser;
      // Проверка в уникальности email в БД
      if (email) {
        existingUser = await prisma.user.findFirst({
          where: { email },
        });
      }
      if (existingUser && existingUser.id !== id) {
        return res.status(400).json({ error: 'Пользователь с таким e-mail уже существует' });
      }
      // Перезапись user - a в БД  !!!  || undefined работает в случии когда в body не передан текущий параметр   !!!
      const user = await prisma.user.update({
        where: { id },
        data: {
          email: email || undefined,
          name: name || undefined,
          avatarUrl: filePath ? `/${filePath}` : undefined,
          dateOfBirth: dateOfBirth || undefined,
          bio: bio || undefined,
          location: location || undefined,
        },
      });

      res.json(user);
    } catch (error) {
      console.error('Update user', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
  current: async (req, res) => {
    try {
      // Находим пользователя и забираем нужные нам поля из БД
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          followers: {
            include: {
              follower: true,
            },
          },
          following: {
            include: {
              following: true,
            },
          },
        },
      });

      // Проверка на наличие пользовтеля
      if (!user) {
        return res.status(400).json({ error: 'Не удалось найти пользователя' });
      }

      res.json(user);
    } catch (error) {
      console.error('Get Current Error');
      res.status(500).json({ error: 'internal server error' });
    }
  },
};

module.exports = UserController;
