import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all payments for the user (payment history)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.userId },
      include: {
        subscription: {
          include: { template: true },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Sunucu hatası', details: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
