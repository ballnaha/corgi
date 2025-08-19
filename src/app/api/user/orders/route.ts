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
    orderNumber: string | null;
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
                        product: {
                            include: {
                                images: {
                                    select: {
                                        id: true,
                                        imageUrl: true,
                                        altText: true,
                                        isMain: true,
                                    },
                                },
                            },
                        },
                    },
                },
                paymentNotifications: {
                    select: {
                        id: true,
                        transferAmount: true,
                        transferDate: true,
                        paymentSlipData: true,
                        paymentSlipMimeType: true,
                        paymentSlipFileName: true,
                        submittedAt: true,
                    },
                    orderBy: {
                        submittedAt: 'desc',
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
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            shippingAddress: order.shippingAddress,
            shippingFee: order.shippingFee ? Number(order.shippingFee) : 0,
            discountAmount: order.discountAmount ? Number(order.discountAmount) : 0,
            paymentType: order.paymentType,
            adminComment: order.adminComment,
            depositAmount: order.depositAmount ? Number(order.depositAmount) : null,
            remainingAmount: order.remainingAmount ? Number(order.remainingAmount) : null,
            paymentNotifications: order.paymentNotifications?.map(notification => ({
                id: notification.id,
                transferAmount: Number(notification.transferAmount),
                transferDate: notification.transferDate,
                status: notification.status,
                paymentSlipData: notification.paymentSlipData,
                paymentSlipMimeType: notification.paymentSlipMimeType,
                paymentSlipFileName: notification.paymentSlipFileName,
                submittedAt: notification.submittedAt,
            })) || [],
            items: order.orderItems.map((item) => {
                // Get main image from product_images where is_main = true
                const mainImage = item.product.images?.find(img => img.isMain);
                const imageUrl = mainImage?.imageUrl || item.product.imageUrl || '';
                
                return {
                    id: item.id,
                    quantity: item.quantity,
                    price: Number(item.price),
                    product: {
                        id: item.product.id,
                        name: item.product.name,
                        category: item.product.category,
                        imageUrl: imageUrl,
                        breed: item.product.breed,
                        gender: item.product.gender,
                        age: item.product.age,
                    },
                };
            }),
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