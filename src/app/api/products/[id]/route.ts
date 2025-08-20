import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-utils";
import { unlink, access } from "fs/promises";
import path from "path";
import { constants } from "fs";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authorization
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();

    // Check if product exists with current images
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
    }

    // Handle image updates if provided
    if (body.existingImages !== undefined || body.newImages !== undefined) {
      // Get current image IDs
      const currentImageIds = existingProduct.images.map((img) => img.id);

      // Get remaining image IDs from request
      const remainingImageIds = (body.existingImages || []).map(
        (img: any) => img.id
      );

      // Find images to delete (current images not in remaining list)
      const imagesToDelete = existingProduct.images.filter(
        (img) => !remainingImageIds.includes(img.id)
      );

      // Delete image files from filesystem
      for (const image of imagesToDelete) {
        try {
          const filename = image.imageUrl.split("/").pop();
          if (filename) {
            const filePath = path.join(
              process.cwd(),
              "public",
              "uploads",
              "products",
              filename
            );
            // Check if file exists before attempting to delete
            try {
              await access(filePath, constants.F_OK);
              await unlink(filePath);
              console.log(`Deleted image file: ${filename}`);
            } catch (accessError: any) {
              if (accessError.code === 'ENOENT') {
                console.warn(`Image file not found, skipping deletion: ${filename}`);
              } else {
                throw accessError;
              }
            }
          }
        } catch (fileError) {
          console.warn(
            `Failed to delete image file: ${image.imageUrl}`,
            fileError
          );
        }
      }

      // Delete removed images from database
      if (imagesToDelete.length > 0) {
        await prisma.productImage.deleteMany({
          where: {
            id: { in: imagesToDelete.map((img) => img.id) },
          },
        });
      }

      // Update existing images
      if (body.existingImages && body.existingImages.length > 0) {
        for (const imgData of body.existingImages) {
          await prisma.productImage.update({
            where: { id: imgData.id },
            data: {
              altText: imgData.altText,
              isMain: imgData.isMain,
              order: imgData.order,
            },
          });
        }
      }

      // Add new images
      if (body.newImages && body.newImages.length > 0) {
        await prisma.productImage.createMany({
          data: body.newImages.map((img: any) => ({
            productId: id,
            imageUrl: img.imageUrl,
            altText: img.altText,
            isMain: img.isMain,
            order: img.order,
          })),
        });
      }
    }

    // Prepare update data
    const updateData: any = {
      name: body.name?.trim(),
      description: body.description?.trim() || null,
      price: body.price,
      salePrice: body.salePrice || null,
      discountPercent: body.discountPercent || null,
      category: body.category,
      categoryId: body.categoryId || null,
      stock: body.stock,

      // Pet-specific fields
      gender: body.gender || null,
      age: body.age || null,
      weight: body.weight || null,
      breed: body.breed || null,
      color: body.color || null,
      location: body.location || null,
      contactInfo: body.contactInfo || null,
      healthNote: body.healthNote || null,
      vaccinated: body.vaccinated,
      certified: body.certified,
      
      // Vaccination tracking fields
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      firstVaccineDate: body.firstVaccineDate ? new Date(body.firstVaccineDate) : null,
      secondVaccineDate: body.secondVaccineDate ? new Date(body.secondVaccineDate) : null,
      vaccineStatus: body.vaccineStatus || null,
      vaccineNotes: body.vaccineNotes || null,

      // General product fields
      brand: body.brand || null,
      model: body.model || null,
      size: body.size || null,
      material: body.material || null,
      weight_grams: body.weightGrams || null,
      dimensions: body.dimensions || null,

      isActive: body.isActive,
    };

    // Add productType if provided
    if (body.productType) {
      updateData.productType = body.productType;
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error("Error updating product:", error);

    // Handle admin authorization error
    if (error.message === "Unauthorized: Admin access required") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการแก้ไขสินค้า" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขสินค้า" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authorization
    await requireAdmin();

    const { id } = await params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
    }

    // Delete image files from filesystem
    for (const image of existingProduct.images) {
      try {
        // Extract filename from URL (e.g., /uploads/products/filename.jpg -> filename.jpg)
        const filename = image.imageUrl.split("/").pop();
        if (filename) {
          const filePath = path.join(
            process.cwd(),
            "public",
            "uploads",
            "products",
            filename
          );
          // Check if file exists before attempting to delete
          try {
            await access(filePath, constants.F_OK);
            await unlink(filePath);
            console.log(`Deleted image file: ${filename}`);
          } catch (accessError: any) {
            if (accessError.code === 'ENOENT') {
              console.warn(`Image file not found, skipping deletion: ${filename}`);
            } else {
              throw accessError;
            }
          }
        }
      } catch (fileError) {
        // Log error but don't fail the deletion if file doesn't exist
        console.warn(
          `Failed to delete image file: ${image.imageUrl}`,
          fileError
        );
      }
    }

    // Delete related images from database
    await prisma.productImage.deleteMany({
      where: { productId: id },
    });

    // Delete the product
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "ลบสินค้าเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    console.error("Error deleting product:", error);

    // Handle admin authorization error
    if (error.message === "Unauthorized: Admin access required") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการลบสินค้า" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบสินค้า" },
      { status: 500 }
    );
  }
}
