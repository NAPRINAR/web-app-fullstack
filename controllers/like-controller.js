const { prisma } = require('../prisma/prisma-client');

const LikeController = {
  likePost: async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.userId;

    if (!postId) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    try {
      // Проверяем на наличие лайка
      const existLike = await prisma.like.findFirst({
        where: {
          postId,
          userId,
        },
      });
      if (existLike) {
        return res.status(400).json({ error: 'Вы уже поставили лайк' });
      }

      const like = await prisma.like.create({
        data: { postId, userId },
      });

      res.json(like);
    } catch (error) {
      console.error('Like error');
      res.status(500).json({ error: 'internal serverr error' });
    }
  },
  unlikePost: async (req, res) => {
    const { id } = req.params;
    const { userId } = req.user.userId;

    if (!id) {
      return res.status(400).json({ error: 'Вы уже поставили дизлайк' });
    }

    try {
      const existLike = await prisma.like.findFirst({
        where: {
          postId: id,
          userId,
        },
      });

      if (!existLike) {
        return res.status(400).json({ error: 'Вы не поставили лайк этому посту' });
      }

      const like = await prisma.like.deleteMany({
        where: { postId: id, userId },
      });

      res.json(like);
    } catch (error) {
      console.error('UnLike error');
      res.status(500).json({ error: 'internal serverr error' });
    }
  },
};

module.exports = LikeController;
