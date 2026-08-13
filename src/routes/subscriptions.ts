import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all subscriptions for user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const subscriptions = await prisma.userSubscription.findMany({
      where: { userId: req.userId },
      include: { template: true },
      orderBy: { nextRenewalDate: 'asc' },
    });

    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Sunucu hatası', details: error instanceof Error ? error.message : String(error) });
  }
});

// Create subscription
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { templateId, customName, customLogoUrl, price, billingCycle, startDate, notes, description } = req.body;

    if (!price || !billingCycle) {
      return res.status(400).json({ error: 'Fiyat ve fatura döngüsü gereklidir' });
    }

    if (!templateId && !customName) {
      return res.status(400).json({ error: 'Şablon ID veya özel isim gereklidir' });
    }

    // Calculate next renewal date
    const start = new Date(startDate || new Date());
    const next = new Date(start);

    if (billingCycle === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else if (billingCycle === 'monthly') {
      next.setMonth(next.getMonth() + 1);
    } else if (billingCycle === 'yearly') {
      next.setFullYear(next.getFullYear() + 1);
    }

    const subscription = await prisma.userSubscription.create({
      data: {
        userId: req.userId!,
        templateId: templateId || undefined,
        customName: customName || undefined,
        customLogoUrl: customLogoUrl || undefined,
        price,
        billingCycle,
        startDate: start,
        nextRenewalDate: next,
        notes: notes || undefined,
        description: description || undefined,
      },
      include: { template: true },
    });

    res.status(201).json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Sunucu hatası', details: error instanceof Error ? error.message : String(error) });
  }
});

// Update subscription
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { customName, customLogoUrl, price, billingCycle, startDate, status, notes, description } = req.body;

    // Verify ownership
    const subscription = await prisma.userSubscription.findUnique({ where: { id } });
    if (!subscription || subscription.userId !== req.userId) {
      return res.status(403).json({ error: 'Yetkisiz erişim' });
    }

    // Recalculate next renewal if dates changed
    let nextRenewalDate = subscription.nextRenewalDate;
    if (startDate || billingCycle) {
      const start = new Date(startDate || subscription.startDate);
      const next = new Date(start);
      const cycle = billingCycle || subscription.billingCycle;

      if (cycle === 'weekly') {
        next.setDate(next.getDate() + 7);
      } else if (cycle === 'monthly') {
        next.setMonth(next.getMonth() + 1);
      } else if (cycle === 'yearly') {
        next.setFullYear(next.getFullYear() + 1);
      }

      nextRenewalDate = next;
    }

    const updated = await prisma.userSubscription.update({
      where: { id },
      data: {
        customName: customName !== undefined ? customName : undefined,
        customLogoUrl: customLogoUrl !== undefined ? customLogoUrl : undefined,
        price: price !== undefined ? price : undefined,
        billingCycle: billingCycle !== undefined ? billingCycle : undefined,
        startDate: startDate !== undefined ? new Date(startDate) : undefined,
        nextRenewalDate: nextRenewalDate !== subscription.nextRenewalDate ? nextRenewalDate : undefined,
        status: status !== undefined ? status : undefined,
        notes: notes !== undefined ? notes : undefined,
        description: description !== undefined ? description : undefined,
      },
      include: { template: true },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Sunucu hatası', details: error instanceof Error ? error.message : String(error) });
  }
});

// Mark a subscription as paid/unpaid (creates a payment record and advances the renewal date)
router.post('/:id/payments', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, paidAt, paid } = req.body;

    // Verify ownership
    const subscription = await prisma.userSubscription.findUnique({ where: { id } });
    if (!subscription || subscription.userId !== req.userId) {
      return res.status(403).json({ error: 'Yetkisiz erişim' });
    }

    const paymentDate = paidAt ? new Date(paidAt) : new Date();

    const payment = await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        userId: req.userId!,
        amount: amount !== undefined ? amount : subscription.price,
        paid: paid !== undefined ? Boolean(paid) : true,
        paidAt: paymentDate,
      },
    });

    // Bir sonraki yenileme tarihini bir fatura döngüsü kadar ilerlet
    const next = new Date(subscription.nextRenewalDate);
    if (subscription.billingCycle === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else if (subscription.billingCycle === 'monthly') {
      next.setMonth(next.getMonth() + 1);
    } else if (subscription.billingCycle === 'yearly') {
      next.setFullYear(next.getFullYear() + 1);
    }

    const updatedSubscription = await prisma.userSubscription.update({
      where: { id },
      data: { nextRenewalDate: next },
      include: { template: true },
    });

    res.status(201).json({ payment, subscription: updatedSubscription });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Sunucu hatası', details: error instanceof Error ? error.message : String(error) });
  }
});

// Delete subscription
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const subscription = await prisma.userSubscription.findUnique({ where: { id } });
    if (!subscription || subscription.userId !== req.userId) {
      return res.status(403).json({ error: 'Yetkisiz erişim' });
    }

    await prisma.userSubscription.delete({ where: { id } });

    res.json({ message: 'Abonelik silindi' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
