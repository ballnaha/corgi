import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Define types for the API response based on actual Prisma schema
type OrderWithItems = {
    id: string;
    status: string;
    totalAmount: any; // Prisma Decimal type
    createdAt: Date;
    orderItems: {
        id: string;
        quantity: number;
        price: any; // Prisma Decimal type
        product: {
            id: string;
            name: string;
            description: string | null;
            price: any; // Prisma Decimal type
            imageUrl: string | null;
            category: string;
            stock: number;
            isActive: boolean;
            gender: string | null;
            age: string | null;
            weight: string | null;
            breed: string | null;
            color: string | null;
            vaccinated: boolean;
            certified: boolean;
            healthNote: string | null;
            location: string | null;
            contactInfo: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }[];
};

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.lineUserId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Find user first
        const user = await prisma.user.findUnique({
            where: {
                lineUserId: session.user.lineUserId,
            },
        });

        if (!user) {
            // Return empty array instead of error for better UX
            return NextResponse.json([]);
        }

        // Get user's orders with order items and products
        const orders = await prisma.order.findMany({
            where: {
                userId: user.id,
            },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Transform the data to include product details
        const transformedOrders = orders.map((order) => ({
            id: order.id,
            status: order.status,
            totalAmount: Number(order.totalAmount),
            createdAt: order.createdAt,
            items: order.orderItems.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                price: Number(item.price),
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    category: item.product.category,
                    imageUrl: item.product.imageUrl || '',
                    breed: item.product.breed,
                    gender: item.product.gender,
                    age: item.product.age,
                },
            })),
        }));

        return NextResponse.json(transformedOrders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}