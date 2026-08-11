import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all templates
router.get('/', async (req: any, res: Response) => {
  try {
    const templates = await prisma.serviceTemplate.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true,
        category: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(templates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
