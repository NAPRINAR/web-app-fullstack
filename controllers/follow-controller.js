const { prisma } = require('../prisma/prisma-client');
// const { connect } = require('../routes');

const FollowController = {
  followUser: async (req, res) => {
    const { followingId } = req.body;
    const userId = req.user.userId;

    // Проверка на подписку на самого себя ;)
    if (followingId === userId) {
      return res.status(500).json({ error: 'Вы не можете подписаться на самого себя' });
    }

    // if (!userIsValid) {
    //   return res.status(500).json({ error: 'У вас нет доступа' });
    // }

    try {
      // Проверка на повторную подписку
      const existSubscription = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId }],
        },
      });

      //   console.log(existSubscription);

      if (existSubscription) {
        return res.status(500).json({ error: 'Вы уже подписаны на этого пользователя' });
      }

      await prisma.follows.create({
        data: {
          follower: { connect: { id: userId } },
          following: { connect: { id: followingId } },
        },
      });
      res.status(201).json({ message: 'Вы успешно подписались на пользователя' });
    } catch (error) {
      console.error('follow error', error);
      res.status(500).json({ error: 'internal server error' });
    }
  },
  unfollowUser: async (req, res) => {
    const { followingId } = req.body;
    const userId = req.user.userId;

    try {
      const follows = await prisma.follows.findFirst({
        where: {
          AND: [{ followerId: userId }, { followingId }],
        },
      });
      if (!follows) {
        return res.status(404).json({ error: 'Вы не подписаны на данного пользователя' });
      }

      await prisma.follows.delete({
        where: { id: follows.id },
      });

      res.status(201).json({ message: 'Вы успешно отписались от пользователя' });
    } catch (error) {
      console.error('unfollow error', error);
      return res.status(500).json({ error: 'internal server error' });
    }
  },
};

module.exports = FollowController;
