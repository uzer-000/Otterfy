import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import dbStore from '@/lib/store';
import {
  ADMIN_EMAIL,
  isAdminEmail,
  getAdminCloudState,
  setUserApprovalStatus,
  setProductApprovalStatus,
  type UserApprovalStatus,
  type ProductApprovalStatus,
} from '@/lib/adminState';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json(
        { error: 'Acesso restrito exclusivamente ao Administrador Otterfy.' },
        { status: 403 }
      );
    }

    const [adminState, dbUsers, dbProducts, dbOrders] = await Promise.all([
      getAdminCloudState(),
      prisma.user.findMany({
        where: { NOT: { email: { endsWith: '@otterfy.internal' } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.findMany({
        include: {
          customer: true,
          transaction: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Build per-product order stats
    const productOrdersMap = new Map<string, typeof dbOrders>();
    for (const order of dbOrders) {
      const list = productOrdersMap.get(order.productId) || [];
      list.push(order);
      productOrdersMap.set(order.productId, list);
    }

    const enrichedProducts = dbProducts.map((p) => {
      const cs = (p.checkoutSettings && typeof p.checkoutSettings === 'object' ? p.checkoutSettings : {}) as Record<string, any>;
      const cloudMod = adminState.products[p.id];
      const rawModStatus: ProductApprovalStatus =
        cloudMod?.status ||
        cs._adminStatus ||
        (p.status === 'ACTIVE' ? 'APPROVED' : 'PENDING');

      const pOrders = productOrdersMap.get(p.id) || [];
      const approvedOrders = pOrders.filter((o) => o.status === 'APPROVED');
      const todayApproved = approvedOrders.filter((o) => new Date(o.createdAt) >= startOfToday);
      const todayPending = pOrders.filter(
        (o) => o.status === 'PENDING' && new Date(o.createdAt) >= startOfToday
      );

      const revenueTodayMzn = todayApproved.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      const totalRevenueMzn = approvedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      const lastSaleAt = approvedOrders[0]?.createdAt
        ? approvedOrders[0].createdAt.toISOString()
        : null;

      return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: Number(p.price) || 0,
        imageUrl: p.imageUrl || null,
        status: p.status,
        moderationStatus: rawModStatus,
        moderationReason: cloudMod?.reason || cs._adminReason || '',
        moderatedAt: cloudMod?.updatedAt || p.updatedAt.toISOString(),
        contentDeliveryType: p.contentDeliveryType || 'link',
        contentUrl: p.contentUrl || '',
        materials: p.materials || [],
        checkoutUrl: `/pay/${p.id}`,
        seller: {
          id: p.user?.id || p.userId,
          name: p.user?.name || 'Pedro Hill',
          email: p.user?.email || ADMIN_EMAIL,
          phone: p.user?.phone || '+258 84 000 0000',
        },
        salesTodayCount: todayApproved.length,
        revenueTodayMzn,
        pendingTodayCount: todayPending.length,
        totalSalesCount: approvedOrders.length,
        totalRevenueMzn,
        isSellingToday: todayApproved.length > 0,
        lastSaleAt,
        recentOrders: pOrders.slice(0, 6).map((o) => ({
          id: o.id,
          amount: Number(o.amount) || 0,
          status: o.status,
          customerName: o.customer?.name || 'Cliente',
          customerPhone: o.customer?.phone || '',
          method: o.transaction?.method || 'MPESA',
          createdAt: o.createdAt.toISOString(),
        })),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    // Sort products for the "Selling Today" radar: selling today first (by revenueToday desc), then totalRevenue desc, then newest
    const sortedProducts = [...enrichedProducts].sort((a, b) => {
      if (b.revenueTodayMzn !== a.revenueTodayMzn) return b.revenueTodayMzn - a.revenueTodayMzn;
      if (b.salesTodayCount !== a.salesTodayCount) return b.salesTodayCount - a.salesTodayCount;
      if (b.totalRevenueMzn !== a.totalRevenueMzn) return b.totalRevenueMzn - a.totalRevenueMzn;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const enrichedUsers = dbUsers.map((u) => {
      const cleanEmail = u.email.trim().toLowerCase();
      const isMasterAdmin = cleanEmail === ADMIN_EMAIL;
      const modRecord = adminState.users[cleanEmail] || adminState.users[u.id];
      const approvalStatus: UserApprovalStatus = isMasterAdmin
        ? 'APPROVED'
        : modRecord?.status || 'PENDING';

      const userProducts = enrichedProducts.filter(
        (p) => p.seller.id === u.id || p.seller.email.toLowerCase() === cleanEmail
      );
      const userSalesCount = userProducts.reduce((sum, p) => sum + p.totalSalesCount, 0);
      const userRevenueMzn = userProducts.reduce((sum, p) => sum + p.totalRevenueMzn, 0);
      const userSalesTodayCount = userProducts.reduce((sum, p) => sum + p.salesTodayCount, 0);
      const userRevenueTodayMzn = userProducts.reduce((sum, p) => sum + p.revenueTodayMzn, 0);

      return {
        id: u.id,
        name: u.name || 'Utilizador',
        email: u.email,
        phone: u.phone || 'Não informado',
        avatarImage: u.avatarImage && u.avatarImage.length > 10 ? u.avatarImage : null,
        isAdmin: isMasterAdmin,
        approvalStatus,
        note: modRecord?.note || '',
        updatedAt: modRecord?.updatedAt || u.updatedAt.toISOString(),
        createdAt: u.createdAt.toISOString(),
        productsCount: userProducts.length,
        approvedSalesCount: userSalesCount,
        totalRevenueMzn: userRevenueMzn,
        salesTodayCount: userSalesTodayCount,
        revenueTodayMzn: userRevenueTodayMzn,
      };
    });

    const allApprovedOrders = dbOrders.filter((o) => o.status === 'APPROVED');
    const todayAllApproved = allApprovedOrders.filter((o) => new Date(o.createdAt) >= startOfToday);

    const summary = {
      pendingUsersCount: enrichedUsers.filter((u) => u.approvalStatus === 'PENDING').length,
      approvedUsersCount: enrichedUsers.filter((u) => u.approvalStatus === 'APPROVED').length,
      blockedUsersCount: enrichedUsers.filter(
        (u) => u.approvalStatus === 'REJECTED' || u.approvalStatus === 'BLOCKED'
      ).length,
      totalUsersCount: enrichedUsers.length,

      pendingProductsCount: enrichedProducts.filter((p) => p.moderationStatus === 'PENDING').length,
      approvedProductsCount: enrichedProducts.filter((p) => p.moderationStatus === 'APPROVED').length,
      blockedBlackProductsCount: enrichedProducts.filter(
        (p) => p.moderationStatus === 'BLOCKED_BLACK' || p.moderationStatus === 'REJECTED'
      ).length,
      totalProductsCount: enrichedProducts.length,
      sellingTodayProductsCount: enrichedProducts.filter((p) => p.salesTodayCount > 0).length,

      salesTodayCount: todayAllApproved.length,
      revenueTodayMzn: todayAllApproved.reduce((sum, o) => sum + (Number(o.amount) || 0), 0),
      totalSalesCount: allApprovedOrders.length,
      totalRevenueMzn: allApprovedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0),
    };

    return NextResponse.json(
      {
        summary,
        users: enrichedUsers,
        products: sortedProducts,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/admin] Error:', error);
    return NextResponse.json({ error: 'Erro ao carregar dados administrativos.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
      return NextResponse.json(
        { error: 'Acesso restrito exclusivamente ao Administrador Otterfy.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'update_user_status') {
      const email = String(body.email || '').trim().toLowerCase();
      const userId = body.userId ? String(body.userId) : undefined;
      const status = body.status as UserApprovalStatus;
      const note = body.note ? String(body.note) : undefined;

      if (!email || !['PENDING', 'APPROVED', 'REJECTED', 'BLOCKED'].includes(status)) {
        return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
      }

      if (email === ADMIN_EMAIL && status !== 'APPROVED') {
        return NextResponse.json(
          { error: 'A conta principal do Administrador não pode ser bloqueada.' },
          { status: 400 }
        );
      }

      const record = await setUserApprovalStatus(email, status, userId, note);

      // If blocking/rejecting a non-admin seller, also pause their products so checkouts stop immediately
      if ((status === 'BLOCKED' || status === 'REJECTED') && email !== ADMIN_EMAIL && userId) {
        await prisma.product
          .updateMany({
            where: { userId },
            data: { status: 'INACTIVE' },
          })
          .catch(() => {});
      }

      return NextResponse.json({ ok: true, record });
    }

    if (action === 'update_product_status') {
      const productId = String(body.productId || '').trim();
      const moderationStatus = body.moderationStatus as ProductApprovalStatus;
      const reason = body.reason !== undefined ? String(body.reason) : undefined;
      const newPrice = body.price !== undefined ? Number(body.price) : undefined;
      const newName = body.name !== undefined ? String(body.name).trim() : undefined;

      if (
        !productId ||
        !['APPROVED', 'PENDING', 'REJECTED', 'BLOCKED_BLACK'].includes(moderationStatus)
      ) {
        return NextResponse.json({ error: 'Parâmetros de produto inválidos.' }, { status: 400 });
      }

      await setProductApprovalStatus(productId, moderationStatus, reason);

      const existing = await prisma.product.findUnique({ where: { id: productId } });
      if (!existing) {
        return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
      }

      const currentCs =
        existing.checkoutSettings && typeof existing.checkoutSettings === 'object'
          ? (existing.checkoutSettings as Record<string, any>)
          : {};

      const updatedCs = {
        ...currentCs,
        _adminStatus: moderationStatus,
        ...(reason !== undefined ? { _adminReason: reason } : {}),
      };

      const nextDbStatus = moderationStatus === 'APPROVED' ? 'ACTIVE' : 'INACTIVE';

      await prisma.product.update({
        where: { id: productId },
        data: {
          status: nextDbStatus,
          ...(newPrice !== undefined && newPrice > 0 ? { price: newPrice } : {}),
          ...(newName ? { name: newName } : {}),
          checkoutSettings: updatedCs,
        },
      });

      await dbStore
        .updateProduct(productId, {
          status: nextDbStatus,
          ...(newPrice !== undefined && newPrice > 0 ? { price: newPrice } : {}),
          ...(newName ? { name: newName } : {}),
          approvalStatus:
            moderationStatus === 'APPROVED'
              ? 'Aprovado'
              : moderationStatus === 'PENDING'
              ? 'Em Revisão'
              : moderationStatus === 'BLOCKED_BLACK'
              ? 'Bloqueado (Black)'
              : 'Rejeitado',
          checkoutSettings: updatedCs as any,
        })
        .catch(() => {});

      return NextResponse.json({
        ok: true,
        productId,
        status: nextDbStatus,
        moderationStatus,
      });
    }

    return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/admin] Error:', error);
    return NextResponse.json({ error: 'Erro ao executar ação administrativa.' }, { status: 500 });
  }
}
