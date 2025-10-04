import { NextRequest, NextResponse } from "next/server";
import { analyzeOrderWithDatabase, DiscountInfo } from "@/lib/order-logic";
import type { CartItem } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartItems, discountInfo }: { 
      cartItems: CartItem[], 
      discountInfo?: DiscountInfo 
    } = body;

    if (!cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json(
        { error: "Invalid cart items" },
        { status: 400 }
      );
    }

    const analysis = await analyzeOrderWithDatabase(cartItems, discountInfo);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error analyzing order:", error);
    return NextResponse.json(
      { error: "Failed to analyze order" },
      { status: 500 }
    );
  }
}