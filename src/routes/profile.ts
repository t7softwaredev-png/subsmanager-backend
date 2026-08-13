import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get profile
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        notificationsEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Update profile
router.patch('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, notificationsEnabled } = req.body;

    if (!name && !email && notificationsEnabled === undefined) {
      return res.status(400).json({ error: 'En az bir alan gereklidir' });
    }

    // Check if email is already taken
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== req.userId) {
        return res.status(400).json({ error: 'Bu email zaten kullanımda' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined,
        notificationsEnabled: notificationsEnabled !== undefined ? notificationsEnabled : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        notificationsEnabled: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
