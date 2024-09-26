const { prisma } = require('../prisma/prisma-client');

const PostController = {
  createPost: async (req, res) => {
    // Забираем объект с постом с фронта
    const { content } = req.body;
    // Забираем айди пользователя который создал пост
    const authorId = req.user.userId;
    // Проверяем на наличие филдов в объекте
    if (!content) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    try {
      // Создаём пост в БД
      const post = await prisma.post.create({
        data: {
          content,
          authorId,
        },
      });
      // Отправляем созданный пост в фронт
      res.json(post);
    } catch (error) {
      console.error('Create post error');
      res.status(500).json({ error: 'internal server error' });
    }
  },
  getAllPosts: async (req, res) => {
    const userId = req.user.userId;
    try {
      // Забираем все посты с нужными нам полями

      const posts = await prisma.post.findMany({
        include: {
          likes: true,
          comments: true,
          author: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      // Проверка поставил ли лайк текущий пользователь какому то посту
      const postWithLikeInfo = posts.map((post) => ({
        ...post,
        likedByUser: post.likes.some((like) => like.userId === userId),
      }));

      res.json(postWithLikeInfo);
    } catch (error) {
      console.error('getAllPosts error ', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
  getPostById: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
      // Забираем пост с нужными нам полями
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          comments: {
            include: {
              user: true,
            },
          },
          likes: true,
          author: true,
        },
      });
      // Проверка на наличие поста
      if (!post) {
        return res.status(404).json({ error: 'Пост не найден' });
      }
      // Проверка лайкнул ли текущий пользователь данный пост
      const postWithLikeInfo = {
        ...post,
        likedByUser: post.likes.some((like) => like.userId === userId),
      };

      res.json(postWithLikeInfo);
    } catch (error) {
      console.error('postByIdError', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  deletePost: async (req, res) => {
    const { id } = req.params;
    // Находим пост
    const post = await prisma.post.findUnique({
      where: {
        id,
      },
    });
    // Проверяем присуствует ли пост
    if (!post) {
      return res.status(404).json({ error: 'Пост не найден' });
    }
    // Проверка на то что пользователь удаляет именно свой пост
    if (post.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    try {
      // Удаление поста и всех полей которые связаны с ним
      const transaction = await prisma.$transaction([
        prisma.comment.deleteMany({ where: { postId: id } }),
        prisma.like.deleteMany({ where: { postId: id } }),
        prisma.post.deleteMany({ where: { id } }),
      ]);

      res.json(transaction);
    } catch (error) {
      console.error('Delete post error', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
};

module.exports = PostController;
