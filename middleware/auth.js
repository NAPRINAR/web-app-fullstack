const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Получаем токен с req header
  const authHeader = req.headers['authorization'];
  //   console.log(authHeader);

  // Удаляем строку Baerer
  const token = authHeader && authHeader.split(' ')[1];

  // Проверка на наличии токена
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized / Не авторизован' });
  }
  // Верификация токена по SECRET_KEY
  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
  });
  next();
};

module.exports = authenticateToken;
