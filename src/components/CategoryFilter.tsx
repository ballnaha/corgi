"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { colors } from "@/theme/colors";

interface Category {
  id: string;
  key: string;
  name: string;
  icon?: string;
  description?: string;
  animalType: string;
  isActive: boolean;
  sortOrder: number;
  emoji?: string;
  image?: string;
  color: string;
  bgColor: string;
}

interface CategoryFilterProps {
  selectedCategory?: string;
  onCategoryChange: (category: string) => void;
  categories?: Category[];
  includeInactive?: boolean;
  sortBy?: 'sortOrder' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// ฟังก์ชันสำหรับแปลง category key เป็น image และสี
const getCategoryDisplay = (key: string) => {
  const categoryMap: Record<string, { image: string; bgColor: string }> = {
    all: { image: "/images/icon-home.png", bgColor: colors.primary.main },
    dogs: { image: "/images/icon-corgi.png", bgColor: colors.categories.dogs },
    cats: { image: "/images/icon-cats.png", bgColor: colors.categories.cats },
    birds: { image: "/images/icon-bird.png", bgColor: colors.categories.birds },
    fish: { image: "/images/icon-bird.png", bgColor: colors.categories.birds },
    rabbits: { image: "/images/icon-toys.png", bgColor: colors.categories.rabbit },
    hamsters: { image: "/images/icon-toys.png", bgColor: colors.categories.rabbit },
    reptiles: { image: "/images/icon-toys.png", bgColor: colors.categories.rabbit },
    "small-pets": { image: "/images/icon-toys.png", bgColor: colors.categories.rabbit },
    accessories: { image: "/images/icon-toys.png", bgColor: colors.categories.rabbit },
  };
  
  return categoryMap[key] || { image: "/images/icon-toys.png", bgColor: colors.categories.rabbit };
};

// Default fallback categories
const defaultCategories: Category[] = [
  {
    id: "all",
    key: "all", 
    name: "ทั้งหมด",
    icon: "🏠",
    description: "สินค้าทั้งหมด",
    animalType: "ALL",
    isActive: true,
    sortOrder: 0,
    image: "/images/icon-home.png",
    color: colors.text.primary,
    bgColor: colors.primary.main,
  },
  {
    id: "dogs",
    key: "dogs", 
    name: "สุนัข",
    icon: "🐕",
    description: "สินค้าสำหรับสุนัขทุกสายพันธุ์ ทุกขนาด",
    animalType: "DOG",
    isActive: true,
    sortOrder: 1,
    image: "/images/icon-corgi.png",
    color: colors.text.primary,
    bgColor: colors.categories.dogs,
  },
  {
    id: "cats",
    key: "cats",
    name: "แมว",
    icon: "🐱", 
    description: "สินค้าสำหรับแมวทุกสายพันธุ์ ทุกขนาด",
    animalType: "CAT",
    isActive: true,
    sortOrder: 2,
    image: "/images/icon-cats.png",
    color: colors.text.primary,
    bgColor: colors.categories.cats,
  },
  {
    id: "birds",
    key: "birds",
    name: "นก",
    icon: "🐦",
    description: "สินค้าสำหรับนกทุกชนิด นกแก้ว นกขับร้อง",
    animalType: "BIRD",
    isActive: true,
    sortOrder: 3,
    image: "/images/icon-bird.png", 
    color: colors.text.primary,
    bgColor: colors.categories.birds,
  },
  {
    id: "accessories",
    key: "accessories",
    name: "ของใช้อื่นๆ",
    icon: "🎾",
    description: "อุปกรณ์และของใช้สำหรับสัตว์เลี้ยงทั่วไป",
    animalType: "GENERAL",
    isActive: true,
    sortOrder: 9,
    image: "/images/icon-toys.png",
    color: colors.text.primary,
    bgColor: colors.categories.rabbit,
  },
];

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  categories,
  includeInactive = false,
  sortBy = 'sortOrder',
  sortOrder = 'asc',
}: CategoryFilterProps) {
  const [loadedCategories, setLoadedCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูล categories จาก API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const params = new URLSearchParams();
        if (includeInactive) params.append('includeInactive', 'true');
        if (sortBy) params.append('sortBy', sortBy);
        if (sortOrder) params.append('sortOrder', sortOrder);

        const response = await fetch(`/api/categories?${params.toString()}`);
        console.log('Categories API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Categories API data:', data);
          
          // แปลงข้อมูลเป็น format ที่ component ต้องการ
          const formattedCategories = data
            .filter((cat: any) => includeInactive || cat.isActive) // Filter inactive if needed
            .map((cat: any) => {
              const display = getCategoryDisplay(cat.key);
              return {
                id: cat.key,
                key: cat.key,
                name: cat.name,
                icon: cat.icon,
                description: cat.description,
                animalType: cat.animalType,
                isActive: cat.isActive,
                sortOrder: cat.sortOrder,
                image: display.image,
                color: colors.text.primary,
                bgColor: display.bgColor,
              };
            });
          
          console.log('Formatted categories:', formattedCategories);
          setLoadedCategories(formattedCategories);
        } else {
          console.error('API response not ok:', response.status, response.statusText);
          // ใช้ default categories หากเกิดข้อผิดพลาด  
          console.log('Using fallback default categories due to API error');
          setLoadedCategories(defaultCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // ใช้ default categories หากเกิดข้อผิดพลาด
        console.log('Using fallback default categories');
        setLoadedCategories(defaultCategories);
      } finally {
        setLoading(false);
      }
    };

    if (!categories) {
      fetchCategories();
    } else {
      setLoadedCategories(categories);
      setLoading(false);
    }
  }, [categories, includeInactive, sortBy, sortOrder]);

  const displayCategories = categories || loadedCategories;

  if (loading && !categories) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: colors.text.primary, fontWeight: "bold", fontSize: "1.1rem", mb: 2 }}>
          กำลังโหลดหมวดหมู่...
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: colors.text.primary,
            fontWeight: "bold",
            fontSize: "1.1rem",
            display: { xs: "block", md: "none" }, // ซ่อนบน desktop (md ขึ้นไป)
          }}
        >
          หมวดหมู่
        </Typography>

      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 1,
          "&::-webkit-scrollbar": {
            display: "none",
          },
          scrollbarWidth: "none",
        }}
      >
        {displayCategories.map((category) => (
          <Box
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            sx={{
              minWidth: 60,
              pl: 1,
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                backgroundColor:
                  selectedCategory === category.id
                    ? category.bgColor
                    : colors.background.default,
                border:
                  selectedCategory === category.id
                    ? `2px solid ${category.bgColor}`
                    : `1px solid ${colors.text.disabled}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                mt: 1,
                mb: 1,
                mx: "auto",
                boxShadow:
                  selectedCategory === category.id
                    ? "0 4px 12px rgba(0,0,0,0.15)"
                    : "none",
                transform:
                  selectedCategory === category.id ? "scale(1.05)" : "scale(1)",
                transition: "all 0.2s ease",
              }}
            >
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  width={48}
                  height={48}
                  priority={false}
                  unoptimized
                  style={{
                    objectFit: "contain",
                  }}
                />
              ) : (
                category.emoji
              )}
            </Box>
            <Typography
              variant="caption"
              sx={{
                color:
                  selectedCategory === category.id
                    ? colors.text.primary
                    : colors.text.secondary,
                fontWeight:
                  selectedCategory === category.id ? "bold" : "normal",
                fontSize: "0.85rem",
              }}
            >
              {category.name}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
