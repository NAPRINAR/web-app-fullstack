const { prisma } = require('../prisma/prisma-client');

const CommentController = {
  createComment: async (req, res) => {
    const { postId, content } = req.body;
    const userId = req.user.userId;

    // Проверяем на наличие полей в объекте
    if (!postId || !content) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    try {
      // Создаём комментарий
      const comment = await prisma.comment.create({
        data: {
          postId,
          userId,
          content,
        },
      });
      res.json(comment);
    } catch (error) {
      console.error('Error creating comment', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
  deleteComment: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      // Находим комментарий в БД
      const comment = await prisma.comment.findUnique({
        where: {
          id,
        },
      });

      // Проверяем существует ли комментарий
      if (!comment) {
        return res.status(404).json({ error: 'Комментарий не найден' });
      }
      // Проверяем имеет ли доступ текущий пользователь удалять комментарий
      if (comment.userId !== userId) {
        return res.status(404).json({ error: 'нет доступа' });
      }
      // Удаляем комментарий
      await prisma.comment.delete({
        where: {
          id,
        },
      });
      res.json(comment);
    } catch (error) {
      console.error('deleteComment error', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
};

module.exports = CommentController;
