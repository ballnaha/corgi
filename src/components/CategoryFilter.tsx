"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import { colors } from "@/theme/colors";

interface Category {
  id: string;
  name: string;
  emoji?: string;
  image?: string;
  color: string;
  bgColor: string;
}

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories?: Category[];
}

const defaultCategories: Category[] = [
  {
    id: "dogs",
    name: "สุนัข",
    image: "/images/icon-corgi.png",
    color: colors.text.primary,
    bgColor: colors.categories.dogs,
  },
  {
    id: "birds",
    name: "นก",
    image: "/images/icon-bird.png",
    color: colors.secondary.main,
    bgColor: colors.categories.birds,
  },

  {
    id: "cats",
    name: "แมว",
    image: "/images/icon-cats.png",
    color: colors.secondary.main,
    bgColor: colors.categories.cats,
  },
  {
    id: "toys",
    name: "ของเล่น",
    image: "/images/icon-toys.png",
    color: colors.secondary.main,
    bgColor: colors.categories.rabbit,
  },

];

export default function CategoryFilter({
  selectedCategory,
  onCategoryChange,
  categories = defaultCategories,
}: CategoryFilterProps) {
  return (
    <Box sx={{ mb: 3, px: 2 }}>
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
          }}
        >
          Categories
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: colors.text.secondary,
            fontWeight: "500",
            cursor: "pointer",
            "&:hover": {
              color: colors.primary.main,
            },
          }}
        >
          See more
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
        {categories.map((category) => (
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
