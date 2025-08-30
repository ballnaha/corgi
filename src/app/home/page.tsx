"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Card, 
  CardContent,
  Avatar,
  Rating,
  Chip,
  GlobalStyles,
  Grid,
  CircularProgress,
  IconButton,
  Badge
} from "@mui/material";
import { ShoppingCart } from "@mui/icons-material";
import Image from "next/image";
import { colors } from "@/theme/colors";
import RegistrationCertificateSheet from "@/components/RegistrationCertificateSheet";
import ProductCard from "@/components/ProductCard";
import Cart from "@/components/Cart";
import ResponsiveHeader from "@/components/ResponsiveHeader";
import CategoryFilter from "@/components/CategoryFilter";
import { Product } from "@/types";
import { readCartFromStorage, writeCartToStorage } from "@/lib/cart";
import { CartItem } from "@/types";
import FloatingActions from "@/components/FloatingActions";
import { generateSlug } from "@/lib/products";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const router = useRouter();
  const [isRegistrationSheetOpen, setIsRegistrationSheetOpen] = useState(false);
  
  // Authentication
  const { data: session } = useSession();
  
  // Product states
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Blog states
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  
  // Cart states
  const [isCartOpen, setIsCartOpen] = useState(false);
  


  const handleBookNow = () => {
    router.push("https://line.me/R/ti/p/@658jluqf");
  };

  const handleReadArticle = (slug?: string) => {
    if (slug) {
      router.push(`/blog/${slug}`);
    } else {
      router.push("/blog");
    }
  };

  const handleShopNow = () => {
    router.push("/shop");
  };

  const handleRegistrationInfo = () => {
    setIsRegistrationSheetOpen(true);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };





  // Fetch blog posts from API
  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setBlogLoading(true);
        const response = await fetch('/api/blog?limit=4');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setBlogPosts(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching blog posts:', error);
      } finally {
        setBlogLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products');
        if (response.ok) {
          type DbProduct = {
            id: string;
            name: string;
            category: string;
            price: number | string;
            salePrice?: number | string | null;
            discountPercent?: number | string | null;
            description?: string | null;
            imageUrl?: string | null;
            stock?: number | string | null;
            gender?: 'MALE' | 'FEMALE' | 'UNKNOWN' | null;
            age?: string | null;
            breed?: string | null;
            location?: string | null;
            images?: Array<{
              id: string;
              imageUrl: string;
              altText: string | null;
              isMain: boolean;
              order: number;
            }>;
          };
          const data: DbProduct[] = await response.json();
          
          const transformed: Product[] = data.map((p) => {
            // Get main image from images array, fallback to imageUrl
            const mainImage = p.images?.find(img => img.isMain)?.imageUrl || 
                            p.images?.[0]?.imageUrl || 
                            p.imageUrl || 
                            '';
            
            // Transform images to match ProductImage interface
            const transformedImages = p.images?.map(img => ({
              ...img,
              productId: p.id,
              createdAt: new Date()
            })) || [];
            
            return {
              ...p,
              image: mainImage,
              imageUrl: mainImage,
              images: transformedImages,
              price: Number(p.price),
              salePrice: p.salePrice != null ? Number(p.salePrice) : null,
              discountPercent: p.discountPercent != null ? Number(p.discountPercent) : null,
              stock: Number(p.stock ?? 0),
            };
          });
          
          setProducts(transformed);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Load cart from storage
  useEffect(() => {
    const stored = readCartFromStorage();
    if (stored.length) setCartItems(stored);
  }, []);

  // Save cart to storage when cart changes
  useEffect(() => {
    writeCartToStorage(cartItems);
  }, [cartItems]);

  // Filter products based on category and show first 8 products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Return first 8 products
    return filtered.slice(0, 8);
  }, [products, selectedCategory]);

  const handleAddToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { product, quantity: 1 }]);
    }
  };

  const handleProductClick = (product: Product) => {
    const slug = generateSlug(product.name, product.id);
    router.push(`/product/${slug}`);
  };

  // Cart functions
  const handleCartClick = () => {
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    
    setCartItems(cartItems.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(cartItems.filter(item => item.product.id !== productId));
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    router.push("/checkout");
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const infoCards = [
    {
      title: "LEARN HOW TO CARE PUPPY'S",
      subtitle: "Read Article",
      bgColor: "#FFFFFF",
      textColor: "#000000"
    },
    {
      title: "$19",
      subtitle: "STARTING AVERAGE COST",
      bgColor: "#FFFFFF",
      textColor: "#000000",
      isPrice: true
    },
    {
      title: "BASIC NUTRITION FOR ALL",
      subtitle: "Shop Now", 
      bgColor: "#FF6B35",
      textColor: "#FFFFFF"
    }
  ];

  const petCollection = [
    {
      name: "BIRD",
      imageSrc: "/images/bird1.png",
      bgColor: "#FF8A50"
    },
    {
      name: "DOG", 
      imageSrc: "/images/dog1-1.png",
      bgColor: "#0FB09E"
    },
    {
      name: "CAT",
      imageSrc: "/images/cat1-1.png",
      bgColor: "#F4D03F"
    },
    {
      name: "PET ACCESSORIES",
      imageSrc: "/images/accessories2.png",
      bgColor: "#52C4F0"
    }
  ];

  return (
    <>
      <GlobalStyles
        styles={{
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-10px)' }
          },
          '@keyframes bounce': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-5px)' }
          },
          body: {
            overflowX: 'hidden'
          },
          '*': {
            boxSizing: 'border-box'
          }
        }}
      />
      <Box sx={{ 
        minHeight: "100vh", 
        backgroundColor: "#FFFFFF",
        width: "100%",
        overflowX: "hidden"
      }}>
        
        {/* Responsive Header */}
        <ResponsiveHeader 
          showCartIcon={true}
          onCartClick={() => setIsCartOpen(true)}
          cartItemCount={cartItems.length}
        />

        {/* Hero Section */}
        <Container maxWidth="lg" sx={{ py: 6, px: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 3, md: 6 },
              flexDirection: { xs: "column", md: "row" },
              width: "100%",
              maxWidth: "100%"
            }}
          >
            {/* Left Content */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "1.5rem", sm: "1.8rem", md: "2.5rem" },
                  fontWeight: "400",
                  color: "#000",
                  lineHeight: 1.5,
                  mb: 3,
                  letterSpacing: "0.08em",
                  wordBreak: "break-word",
                  hyphens: "auto"
                }}
              >
                จำหน่ายลูกสุนัขพันธุ์ คอร์กี้ และสัตว์เลี้ยงอื่นๆ<br />
                <Box component="span" sx={{ color: "#FF6B6B", fontSize: { xs: "1.5rem", md: "2rem" } }}>❤️</Box>
              </Typography>
              
              <Typography
                sx={{
                  color: "#666",
                  fontSize: { xs: "16px", sm: "18px", md: "22px" },
                  lineHeight: 1.6,
                  mb: 4,
                  maxWidth: { xs: "100%", md: "400px" },
                  wordBreak: "break-word"
                }}
              >
                เพราะน้องไม่ใช่แค่สัตว์เลี้ยง <br />
                แต่เค้าคือ.... ครอบครัว
              </Typography>

              <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  onClick={handleBookNow}
                  sx={{
                    backgroundColor: "#FFB347",
                    color: "#000",
                    borderRadius: "20px",
                    px: 3,
                    py: 1,
                    fontSize: "14px",
                    fontWeight: "600",
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": {
                      backgroundColor: "#FF9500"
                    }
                  }}
                >
                  เพิ่มเราเป็นเพื่อน
                </Button>
                
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      backgroundColor: "#FF6B35",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer"
                    }}
                  >
                    <Typography sx={{ color: "white", fontSize: "12px" }}>▶</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Right Content - Dog Image */}
            <Box sx={{ flex: 1, position: "relative" }}>
              <Box
                sx={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                {/* Background Shape */}
                <Box
                  sx={{
                    width: { xs: 300, md: 360 },
                    height: { xs: 360, md: 420 },
                    
                    position: "relative",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    overflow: "visible",
                    
                  }}
                >
                  <Image
                    src="/images/lovecorgi1.png"
                    alt="cute dog"
                    width={400}
                    height={400}
                    style={{ objectFit: "contain" }}
                    priority
                  />

                  {/* Badge */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: -20,
                      backgroundColor: "#FFD700",
                      borderRadius: "50%",
                      width: 88,
                      height: 88,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "3px solid white",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                      zIndex: 2,
                      
                    }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ fontSize: "25px" , color:"#FFF" }}>🐾</Typography>
                      <Typography sx={{ fontSize: "13px", fontWeight: "bold", color: "#000" , letterSpacing: "0.1em" }}>CORGI</Typography>
                    </Box>
                  </Box>

                  {/* Orange Info Ticket */}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 16,
                      left: -20,
                      backgroundColor: "#FF6B35",
                      color: "white",
                      px: 2,
                      py: 1.2,
                      borderRadius: 2,
                      minWidth: 160,
                      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                      transform: "rotate(-3deg)",
                      zIndex: 2
                    }}
                  >
                    <Typography sx={{ fontSize: "12px", fontWeight: "bold" ,letterSpacing: "0.2em" }}>REGISTRATION CERTIFICATE</Typography>
                    <Typography sx={{ fontSize: "15px", mt: 0.5 , letterSpacing: "0.08em" }}>สุนัขของเรามีใบทะเบียนประวัติสุนัขให้ทุกตัว</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>

        
        {/* Special Cards Section */}
        <Container maxWidth="lg" sx={{ py: 6, px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ 
            display: "flex", 
            gap: { xs: 2, md: 3 }, 
            flexDirection: { xs: "column", md: "row" },
            width: "100%",
            maxWidth: "100%"
          }}>
            {/* Card 1: LEARN HOW TO CARE PUPPY'S */}
            <Box sx={{ flex: 1 }}>
              <Card
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  border: "3px solid #000",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-6px)"
                  },
                  
                }}
                
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#FFF",
                    p: 3,
                    gap: 3
                  }}
                >
                  {/* Left: Dog Image */}
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 120,
                      height: 120,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position:"relative",
                      top:-30,
                      left:-10,
                      
                    }}
                  >
                    <Image 
                      src="/images/dog_learn.png" 
                      alt="Corgi Puppy" 
                      width={150} 
                      height={150} 
                      style={{ objectFit: "contain" }}
                    />
                  </Box>

                  {/* Middle: Text Content */}
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <Typography
                      sx={{
                        fontSize: { xs: "18px", md: "24px" },
                        fontWeight: "800",
                        color: "#000",
                        lineHeight: 1.2,
                        mb: 1
                      }}
                    >
                      FRESH PUP,<br />
                      FRESH START.
                    </Typography>

                  </Box>

                  {/* Vertical Line Divider */}
                  <Box
                    sx={{
                      width: 1.2,
                      height: 120,
                      backgroundColor: "#000",
                      mx: 2,
                      borderRadius: "1.5px"
                    }}
                  />

                  {/* Right: Price Circle */}
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 120,
                      height: 120,
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {/* Circular text around the circle */}
                    <Box
                      sx={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        "& svg": {
                          width: "100%",
                          height: "100%"
                        }
                      }}
                    >

<svg viewBox="0 0 120 120">
  <defs>
    <path
      id="circle"
      d="M 60, 60 m -50, 0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0"
    />
  </defs>
  <text fontSize="9" fontWeight="600" fill="#666" letterSpacing="0.5px">
    <textPath href="#circle" startOffset="0%">
    PREMIUM QUALITY • HEALTHY & HAPPY • READY TO LOVE 
    </textPath>
  </text>
</svg>

                    </Box>

                    {/* Inner circle with price */}
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        border: "2px dashed #000",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#fff",
                        position: "relative"
                      }}
                    >
                      <Typography sx={{ fontSize: "16px", fontWeight: "800", color: "#000" }}>
                        LOVE
                      </Typography>
                      <Typography sx={{ fontSize: "20px", fontWeight: "600", color: "#666", letterSpacing: "0.5px" }}>
                      🐶
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Box>

            {/* Card 2: REGISTRATION CERTIFICATE */}
            <Box sx={{ flex: 1 }}>
              <Card
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  border: "3px solid #000",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-6px)"
                  },
                  
                }}
                
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#FFF",
                    p: 3,
                    gap: 3
                  }}
                >
                  {/* Left: Dog Image */}
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 120,
                      height: 120,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position:"relative",
                      top:-10,
                      left:-10,
                      
                    }}
                  >
                    <Image 
                      src="/images/dog_hiphop.png" 
                      alt="Corgi Puppy" 
                      width={150} 
                      height={150} 
                      style={{ objectFit: "contain" }}
                    />
                  </Box>

                  {/* Middle: Text Content */}
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <Typography
                      sx={{
                        fontSize: { xs: "18px", md: "24px" },
                        fontWeight: "800",
                        color: "#000",
                        lineHeight: 1.2,
                        mb: 1
                      }}
                    >
                      BORN TO BE A DOG STAR.

                    </Typography>
                    <Typography
                      sx={{
                        color: "#666",
                        fontSize: "16px",
                        mb: 2,
                        lineHeight: 1.4
                      }}
                    >
                      เกิดมาเพื่อเป็นดาวเด่น
                    </Typography>
                    
                  </Box>

                </Box>
              </Card>
            </Box>
          </Box>
        </Container>

        {/* Pet Collection Section */}
        <Container maxWidth="lg" sx={{ pt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            mb: 4,
            flexWrap: "wrap",
            gap: 2
          }}>
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: "1.8rem", md: "2.2rem" },
                fontWeight: "800",
                color: "#000"
              }}
            >
              หมวดหมู่
            </Typography>
            
          </Box>

          <Box
              sx={{
                display: "grid",
                gap: { xs: 1, sm: 1.5, md: 3 },
                gridTemplateColumns: {
                  xs: "1fr 1fr", // mobile → 2 columns
                  sm: "1fr 1fr 1fr", // tablet → 3 columns  
                  md: "1fr 1fr 1fr 1fr" // desktop → 4 columns
                },
                width: "100%",
                maxWidth: "100%"
              }}
            >
            {petCollection.map((pet, index) => (
              <Box key={index} sx={{ 
                flex: 1, 
                minWidth: 0,
                width: "100%",
                maxWidth: "100%"
              }}>
                <Card
                  sx={{
                    borderRadius: { xs: 3, sm: 4 },
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    transition: "transform 0.3s ease",
                    width: "100%",
                    maxWidth: "100%",
                    "&:hover": {
                      transform: "translateY(-4px)"
                    }
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: pet.bgColor,
                      height: { xs: 100, sm: 140, md: 200 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: { xs: "40px", sm: "50px", md: "80px" },
                      position: "relative",
                      overflow: "hidden",
                      // เพิ่ม bubble effects สำหรับแต่ละ pet ตามสีพื้นหลัง
                      ...(pet.name === "BIRD" && {
                        // เพิ่มวงกลมสีส้มแบบ bubble สำหรับ BIRD (#FF8A50)
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: { xs: '-10px', sm: '-15px', md: '-20px' },
                          left: { xs: '-10px', sm: '-15px', md: '-20px' },
                          width: { xs: '40px', sm: '60px', md: '80px' },
                          height: { xs: '40px', sm: '60px', md: '80px' },
                          backgroundColor: 'rgba(255, 138, 80, 0.6)',
                          borderRadius: '50%',
                          animation: 'float 3s ease-in-out infinite',
                          zIndex: 10,
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: { xs: '-8px', sm: '-12px', md: '-15px' },
                          right: { xs: '-8px', sm: '-12px', md: '-15px' },
                          width: { xs: '30px', sm: '45px', md: '60px' },
                          height: { xs: '30px', sm: '45px', md: '60px' },
                          backgroundColor: 'rgba(255, 138, 80, 0.5)',
                          borderRadius: '50%',
                          animation: 'float 4s ease-in-out infinite reverse',
                          zIndex: 10,
                          border: '2px solid rgba(255, 255, 255, 0.2)'
                        }
                      }),
                      // เพิ่ม bubble effects สำหรับ DOG (#0FB09E)
                      ...(pet.name === "DOG" && {
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: { xs: '-9px', sm: '-14px', md: '-18px' },
                          right: { xs: '-9px', sm: '-14px', md: '-18px' },
                          width: { xs: '35px', sm: '52px', md: '70px' },
                          height: { xs: '35px', sm: '52px', md: '70px' },
                          backgroundColor: 'rgba(15, 176, 158, 0.3)',
                          borderRadius: '50%',
                          animation: 'bounce 3.5s ease-in-out infinite',
                          zIndex: 10,
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: { xs: '-6px', sm: '-9px', md: '-12px' },
                          left: { xs: '-6px', sm: '-9px', md: '-12px' },
                          width: { xs: '25px', sm: '38px', md: '50px' },
                          height: { xs: '25px', sm: '38px', md: '50px' },
                          backgroundColor: 'rgba(15, 176, 158, 0.6)',
                          borderRadius: '50%',
                          animation: 'float 4.5s ease-in-out infinite',
                          zIndex: 10,
                          border: '2px solid rgba(255, 255, 255, 0.2)'
                        }
                      }),
                      // เพิ่ม bubble effects สำหรับ CAT (#F4D03F)
                      ...(pet.name === "CAT" && {
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: { xs: '-8px', sm: '-12px', md: '-16px' },
                          left: { xs: '-8px', sm: '-12px', md: '-16px' },
                          width: { xs: '33px', sm: '49px', md: '65px' },
                          height: { xs: '33px', sm: '49px', md: '65px' },
                          backgroundColor: 'rgba(244, 208, 63, 0.7)',
                          borderRadius: '50%',
                          animation: 'float 3.2s ease-in-out infinite',
                          zIndex: 10,
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: { xs: '-5px', sm: '-8px', md: '-10px' },
                          right: { xs: '-5px', sm: '-8px', md: '-10px' },
                          width: { xs: '23px', sm: '34px', md: '45px' },
                          height: { xs: '23px', sm: '34px', md: '45px' },
                          backgroundColor: 'rgba(244, 208, 63, 0.6)',
                          borderRadius: '50%',
                          animation: 'bounce 2.8s ease-in-out infinite',
                          animationDelay: '0.5s',
                          zIndex: 10,
                          border: '2px solid rgba(255, 255, 255, 0.2)'
                        }
                      }),
                      // เพิ่ม bubble effects สำหรับ PET ACCESSORIES (#52C4F0)
                      ...(pet.name === "PET ACCESSORIES" && {
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: { xs: '-7px', sm: '-11px', md: '-14px' },
                          right: { xs: '-7px', sm: '-11px', md: '-14px' },
                          width: { xs: '34px', sm: '51px', md: '68px' },
                          height: { xs: '34px', sm: '51px', md: '68px' },
                          backgroundColor: 'rgba(82, 196, 240, 0.7)',
                          borderRadius: '50%',
                          animation: 'float 3.8s ease-in-out infinite',
                          zIndex: 10,
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: { xs: '-4px', sm: '-6px', md: '-8px' },
                          left: { xs: '-4px', sm: '-6px', md: '-8px' },
                          width: { xs: '24px', sm: '36px', md: '48px' },
                          height: { xs: '24px', sm: '36px', md: '48px' },
                          backgroundColor: 'rgba(82, 196, 240, 0.6)',
                          borderRadius: '50%',
                          animation: 'bounce 3.2s ease-in-out infinite',
                          animationDelay: '0.3s',
                          zIndex: 10,
                          border: '2px solid rgba(255, 255, 255, 0.2)'
                        }
                      })
                    }}
                  >
                    {/* เพิ่ม bubble วงกลมเล็กๆ สำหรับแต่ละ pet */}
                    {pet.name === "BIRD" && (
                      <>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '20px',
                            right: '40px',
                            width: '30px',
                            height: '30px',
                            backgroundColor: 'rgba(255, 138, 80, 0.8)',
                            borderRadius: '50%',
                            animation: 'bounce 2s ease-in-out infinite',
                            zIndex: 15,
                            border: '2px solid rgba(255, 255, 255, 0.4)'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: '40px',
                            left: '30px',
                            width: '45px',
                            height: '45px',
                            backgroundColor: 'rgba(255, 138, 80, 0.7)',
                            borderRadius: '50%',
                            animation: 'float 3.5s ease-in-out infinite',
                            animationDelay: '0.5s',
                            zIndex: 15,
                            border: '2px solid rgba(255, 255, 255, 0.3)'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '70px',
                            left: '15px',
                            width: '20px',
                            height: '20px',
                            backgroundColor: 'rgba(255, 138, 80, 0.8)',
                            borderRadius: '50%',
                            animation: 'bounce 2.5s ease-in-out infinite',
                            animationDelay: '1s',
                            zIndex: 15,
                            border: '2px solid rgba(255, 255, 255, 0.4)'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '90px',
                            right: '20px',
                            width: '35px',
                            height: '35px',
                            backgroundColor: 'rgba(255, 138, 80, 0.7)',
                            borderRadius: '50%',
                            animation: 'float 4.5s ease-in-out infinite',
                            animationDelay: '1.5s',
                            zIndex: 15,
                            border: '2px solid rgba(255, 255, 255, 0.3)'
                          }}
                        />
                      </>
                    )}
                    {/* เพิ่ม bubble วงกลมเล็กๆ สำหรับ DOG */}
                    {pet.name === "DOG" && (
                      <>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '30px',
                            left: '25px',
                            width: '25px',
                            height: '25px',
                            backgroundColor: 'rgba(15, 176, 158, 0.3)',
                            borderRadius: '50%',
                            animation: 'float 2.2s ease-in-out infinite',
                            zIndex: 15,
                            border: '2px solid rgba(255, 255, 255, 0.4)'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: '50px',
                            right: '35px',
                            width: '40px',
                            height: '40px',
                            backgroundColor: 'rgba(15, 176, 158, 0.7)',
                            borderRadius: '50%',
                            animation: 'bounce 3s ease-in-out infinite',
                            animationDelay: '0.8s',
                            zIndex: 15,
                            border: '2px solid rgba(255, 255, 255, 0.3)'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '80px',
                            right: '15px',
                            width: '18px',
                            height: '18px',
                            backgroundColor: 'rgba(15, 176, 158, 0.8)',
                            borderRadius: '50%',
                            animation: 'float 2.8s ease-in-out infinite',
                            animationDelay: '1.2s',
                            zIndex: 15,
                            border: '2px solid rgba(255, 255, 255, 0.4)'
                          }}
                        />
                      </>
                    )}
                    {/* เพิ่ม bubble วงกลมเล็กๆ สำหรับ CAT */}
                    {pet.name === "CAT" && (
                      <>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '25px',
                            right: '30px',
                            width: '28px',
                            height: '28px',
                            backgroundColor: 'rgba(244, 208, 63, 0.8)',
                            borderRadius: '50%',
                            animation: 'bounce 2.4s ease-in-out infinite',
                            zIndex: 15,
                            border: '2px solid rgba(255, 255, 255, 0.4)'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: '35px',
                            left: '20px',
                            width: '35px',
                            height: '35px',
                            backgroundColor: 'rgba(244, 208, 63, 0.7)',
                            borderRadius: '50%',
                            animation: 'float 3.2s ease-in-out infinite',
                            animationDelay: '0.6s',
                            zIndex: 15,
                            border: '2px solid rgba(255, 255, 255, 0.3)'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '85px',
                            left: '10px',
                            width: '22px',
                            height: '22px',
                            backgroundColor: 'rgba(244, 208, 63, 0.8)',
                            borderRadius: '50%',
                            animation: 'bounce 2.6s ease-in-out infinite',
                            animationDelay: '1.4s',
                            zIndex: 15,
                            border: '2px solid rgba(255, 255, 255, 0.4)'
                          }}
                        />
                      </>
                    )}
                    {/* เพิ่ม bubble วงกลมเล็กๆ สำหรับ PET ACCESSORIES */}
                    {pet.name === "PET ACCESSORIES" && (
                      <>
                        
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: '38px',
                            left: '18px',
                            width: '38px',
                            height: '38px',
                            backgroundColor: 'rgba(82, 196, 240, 0.7)',
                            borderRadius: '50%',
                            animation: 'float 3.4s ease-in-out infinite',
                            animationDelay: '0.7s',
                            zIndex: 15,
                            border: '2px solid rgba(255, 255, 255, 0.3)'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '88px',
                            left: '12px',
                            width: '24px',
                            height: '24px',
                            backgroundColor: 'rgba(82, 196, 240, 0.8)',
                            borderRadius: '50%',
                            animation: 'bounce 2.7s ease-in-out infinite',
                            animationDelay: '1.3s',
                            zIndex: 15,
                            border: '2px solid rgba(255, 255, 255, 0.4)'
                          }}
                        />
                        
                      </>
                    )}
                    <Image 
                      src={pet.imageSrc} 
                      alt={pet.name} 
                      width={200} 
                      height={200} 
                      style={{ position: 'relative', zIndex: 5 }}
                    />
                  </Box>
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <Typography
                      sx={{
                        fontSize: "16px",
                        fontWeight: "800",
                        color: "#000",
                        letterSpacing: "0.5px"
                      }}
                    >
                      {pet.name}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Container>


        {/* HOW WE SERVE OUR PET PARENTS Section */}
        <Container maxWidth="lg" sx={{ py: 6, px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ display: "flex", gap: 6, alignItems: "center", flexDirection: { xs: "column", lg: "row" } }}>
            {/* Left side - Services list */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "2rem", md: "2.5rem" },
                  fontWeight: "600",
                  color: "#000",
                  lineHeight: 1.1,
                  mb: 2
                }}
              >
                ขอต้อนรับสู่<br />
                ครอบครัวของเรา
              </Typography>
              
              <Typography
                sx={{
                  color: "#666",
                  fontSize: "16px",
                  lineHeight: 1.6,
                  mb: 4,
                  maxWidth: "300px"
                }}
              >
                ค้นหาสัตว์เลี้ยงที่ตอบโจทย์คุณที่สุด ให้เราได้แนะนำคุณ
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  { text: "สายพันธุ์ที่มีสุขภาพดี", active: true },
                  { text: "ได้รับการฉีดวัคซีน", active: true },
                  { text: "ใบทะเบียนสุนัข (Registration Certificate)", active: true },
                  { text: "ใบเพ็ดดีกรี (Pedigree Certificate)", active: true },
                  
                ].map((item, index) => (
                  <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: "2px solid #000",
                        backgroundColor: item.active ? "#F4D03F" : "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {item.active ? (
                        <Typography sx={{ color: "#000", fontSize: "12px", fontWeight: 800 }}>✓</Typography>
                      ) : (
                        <Box sx={{ width: 6, height: 6, backgroundColor: "#000", borderRadius: "50%" }} />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: "16px", fontWeight: item.active ? 500 : 400, color: "#000" }}>
                      {item.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Center - Photo card with pin */}
            <Box sx={{ flex: 1, display: "flex", justifyContent: "center", position: "relative" }}>
              <Box
                sx={{
                  width: 350,
                  height: 350,
                  backgroundColor: "#fff",
                  
                  transform: "rotate(-3deg)",
                  
                  position: "relative"
                }}
              >
                <Image src="/images/dog_fashion1.png" alt="dog fashion" fill style={{ objectFit: "cover" }} />
                <Box
                  sx={{
                    position: "absolute",
                    top: -10,
                    right: -10,
                    width: 42,
                    height: 42,
                    backgroundColor: "#FF4D4F",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
                  }}
                >
                  <Box sx={{ width: 12, height: 12, backgroundColor: "#fff", borderRadius: "50%" }} />
                </Box>
              </Box>
            </Box>

            {/* Right side - Pet categories (styled like mockup) */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
              {/* BIRD - left square label + right circular image (two pieces) */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    px: 3,
                    py: 1.5,
                    backgroundColor: "#F5F5F5",
                    border: "3px solid #000",
                    borderRadius: 1,
                    minWidth: 96,
                    minHeight: 86,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Typography sx={{ fontSize: "16px", fontWeight: 800 }}>BIRD</Typography>
                </Box>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    backgroundColor: "#F0E1CD",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    
                  }}
                >
                  <Image src="/images/icon-bird.png" alt="bird" width={80} height={80} />
                </Box>
              </Box>

              {/* CAT - left square label + right circular image */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                  sx={{
                    width: 100,
                    height: 100,
                    backgroundColor: "#F4D03F",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    
                  }}
                >
                  <Image src="/images/icon-cats1.png" alt="cat" width={80} height={80} />
                </Box>
                <Box
                  sx={{
                    px: 2,
                    py: 1.2,
                    backgroundColor: "#52C4F0",
                    color: "#000",
                    border: "3px solid #000",
                    borderRadius: 1,
                    transform: "rotate(-4deg)"
                  }}
                >
                  <Typography sx={{ fontSize: "14px", fontWeight: 900, lineHeight: 1 }}>CAT</Typography>
                  <Typography sx={{ fontSize: "10px" }}>Your furry friend is waiting for you.</Typography>
                </Box>
                
              </Box>

              {/* DOGS - left square label + right circular dog image */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    px: 3,
                    py: 1.5,
                    backgroundColor: "#F0E1CD",
                    border: "3px solid #000",
                    borderRadius: 1,
                    minWidth: 96,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Typography sx={{ fontSize: "16px", fontWeight: 800 }}>DOGS</Typography>
                </Box>
                <Box sx={{ width: 100, height: 100, backgroundColor: "#FF8A50", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Image src="/images/icon-begel.png" alt="dog" width={80} height={80} style={{ borderRadius: "50%", objectFit: "cover" }} />
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>


        {/* Featured Products Section */}
        <Container maxWidth="lg" sx={{ py: 6, px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: "1.8rem", md: "2.2rem" },
                fontWeight: "800",
                color: "#000"
              }}
            >
              รับน้องไปดูแล
            </Typography>
            <Button
              onClick={handleBookNow}
              sx={{
                color: "#FF6B35",
                fontSize: "14px",
                textTransform: "none",
                fontWeight: "600",
                "&:hover": { backgroundColor: "transparent", textDecoration: "underline" }
              }}
            >
              ดูทั้งหมด →
            </Button>
          </Box>

          {/* Category Filter */}
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </Container>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={48} sx={{ color: "#FF6B35" }} />
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: { xs: 1.5, sm: 1.5, md: 2 },
                gridTemplateColumns: {
                  xs: "1fr 1fr", // mobile → 2 columns
                  sm: "1fr 1fr 1fr", // tablet → 3 columns  
                  md: "1fr 1fr 1fr 1fr", // medium → 4 columns
                  lg: "1fr 1fr 1fr 1fr" // desktop → 4 columns (เหมือนหน้า shop)
                },
                width: "100%",
                maxWidth: "100%"
              }}
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onProductClick={handleProductClick}
                />
              ))}
            </Box>
          )}

          {!loading && filteredProducts.length === 0 && (
            <Box
  sx={{
    textAlign: "center",
    py: 8,
    p: 4, // เพิ่ม padding ภายใน Box เพื่อให้มีพื้นที่ว่างระหว่างข้อความกับขอบ
    border: '2px dashed', // กำหนดขอบเป็นเส้นปะ
    borderColor: '#e0e0e0', // สีเทาอ่อนแบบ minimal
    borderRadius: 2, // เพิ่มความโค้งมนเล็กน้อยที่มุม
    maxWidth: 500, // กำหนดความกว้างสูงสุดเพื่อให้ดูดีขึ้น
    mx: 'auto', // จัดให้อยู่กึ่งกลาง
    backgroundColor: '#fdfdfd', // เพิ่มสีพื้นหลังอ่อนๆ ให้ดูมีมิติ
  }}
>
  <Typography sx={{ color: "#666", fontSize: 18, fontWeight: 500 }}>
    น้อง ๆ ย้ายบ้านหมดแล้วครับ
  </Typography>
  <Typography sx={{ color: "#999", fontSize: 14, mt: 1 }}>
    แต่ไม่ต้องห่วง! เรากำลังเตรียมความพร้อมให้น้องใหม่เร็วๆ นี้
  </Typography>
  <Typography sx={{ color: "#999", fontSize: 14 }}>
    โปรดติดตามข่าวสารได้ที่หน้าเพจของเรานะครับ
  </Typography>
</Box>
          )}
        </Container>


        {/* WHAT WE CARE THE MOST Section */}
        <Container maxWidth="lg" sx={{ py: 6, px: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr 1fr" },
              gridTemplateRows: { xs: "auto", lg: "auto auto auto" },
              border: "3px solid #000",
              borderRadius: 3,
              overflow: "hidden",
              gap: "3px",
              backgroundColor: "#000"
            }}
          >
            {/* Left: Title + Description (span 3 rows) */}
            <Box
              sx={{
                p: 3,
                gridColumn: { lg: 1 },
                gridRow: { lg: "1 / span 3" },
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                gap: 2,
                backgroundColor: "#FFFFFF"
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  backgroundColor: "rgba(255, 255, 255, 1)", // ขาวโปร่งใส
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(8px)", // ทำให้ background ข้างหลังเบลอ
                  WebkitBackdropFilter: "blur(8px)", // รองรับ Safari
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)" // เพิ่มมิติเล็กน้อย
                }}
              >
                <Typography sx={{ color: "black", fontSize: "22px" }}>🐾</Typography>
              </Box>

                <Typography sx={{ fontSize: { xs: "1.3rem", md: "1.8rem" }, fontWeight: 500, lineHeight: 1.2, letterSpacing: "0.05em" }}>
                ลูกสุนัขสุขภาพดี <br />จากฟาร์มของเรา
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#000", mb: 1 }}>บ้านคอร์กี้นครปฐม —</Typography>
                <Typography sx={{ color: "#666", fontSize: 16, lineHeight: 1.6 }}>
                ค้นพบลูกสุนัขสายพันธุ์แท้หลากหลายสายพันธุ์ ที่ได้รับการเลี้ยงดูอย่างพิถีพิถันในสภาพแวดล้อมที่สะอาดและปลอดภัย ในนครปฐม เราใส่ใจทุกรายละเอียดเพื่อมอบลูกสุนัขที่ดีที่สุดให้คุณ
                </Typography>
              </Box>
            </Box>

            {/* Middle-Top: Counter */}
            <Box sx={{ p: 3, gridColumn: { lg: 2 }, gridRow: { lg: 1 }, display: "flex", flexDirection: "column", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
              
              <Typography sx={{ fontSize: 24, fontWeight: 800 }}>พบกับลูกสุนัขพร้อมย้ายบ้าน</Typography>
            </Box>

            {/* Right-Top: Media card spanning two rows (dog image with play) */}
            <Box sx={{ p: 3, position: "relative", gridColumn: { lg: 3 }, gridRow: { lg: "1 / span 2" }, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 1, backgroundColor: "#FFFFFF" }}>
              <Box
                sx={{
                  width: 220,
                  height: 220,
                  backgroundColor: "#4CAF50",
                  border: "3px solid #000",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative"
                }}
              >
                <Image src="/images/dak.png" alt="cat" width={214} height={250} style={{ objectFit: "contain", borderRadius: 8 }} />
                <Box sx={{ position: "absolute", top: "50%", right: -14, transform: "translateY(-50%)", width: 36, height: 36, backgroundColor: "#FF7A32", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }}>
                  <Typography sx={{ color: "white", fontSize: 16 }}>▶</Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 14, color: "#666", mt: 0.5 }}>พบกับลูกสุนัขพร้อมย้ายบ้าน</Typography>
            </Box>

            {/* Middle-Middle: Testimonial text */}
            <Box sx={{ p: 3, gridColumn: { lg: 2 }, gridRow: { lg: 2 }, backgroundColor: "#FFFFFF" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Box sx={{ width: 30, height: 30, backgroundColor: "#FF6B35", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography sx={{ color: "white", fontSize: 16 }}>❝</Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 16, color: "#666", lineHeight: 1.6 }}>
              เลือกดูสมาชิกใหม่จากฟาร์มของเราได้เลย ทุกตัวผ่านการตรวจสุขภาพและฉีดวัคซีนครบถ้วนตามช่วงวัย พร้อมใบรับรองสายพันธุ์แท้จากสมาคม และสมุดสุขภาพประจำตัว
              </Typography>
            </Box>

            {/* Middle-Bottom: Author */}
            <Box sx={{ p: 3, gridColumn: { lg: 2 }, gridRow: { lg: 3 }, backgroundColor: "#FFFFFF" }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#000" }}>WHAT DA DOG</Typography>
              <Typography sx={{ fontSize: 14, color: "#666" }}>บ้านคอร์กี้นครปฐม</Typography>
            </Box>

            {/* Right-Bottom: CTA row */}
            <Box sx={{ p: 2, gridColumn: { lg: 3 }, gridRow: { lg: 3 }, display: "flex", alignItems: "center", justifyContent: "flex-end", backgroundColor: "#FFFFFF" }}>
              <Box
                onClick={handleBookNow}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  border: "2px solid #000",
                  borderRadius: "20px",
                  px: 2,
                  py: 0.5,
                  cursor: "pointer",
                  backgroundColor: "#FFF8E6",
                  '&:hover': { backgroundColor: "#FFE4B3" }
                }}
              >
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#000" }}>ติดต่อสอบถาม</Typography>
                <Typography sx={{ color: "#999" }}>|</Typography>
                <Typography sx={{ fontSize: 14 }}>🐾</Typography>
              </Box>
            </Box>
          </Box>
        </Container>



        {/* Blog Section */}
        <Container maxWidth="lg" sx={{ py: 6, px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: "1.8rem", md: "2.2rem" },
                fontWeight: "800",
                color: "#000"
              }}
            >
              มาทำความรู้จักกับน้องๆ ให้มากขึ้น
            </Typography>
            <Button
              onClick={() => router.push('/blog')}
              sx={{
                color: "#FF6B35",
                fontSize: "14px",
                textTransform: "none",
                fontWeight: "600",
                "&:hover": { backgroundColor: "transparent", textDecoration: "underline" }
              }}
            >
              ดูทั้งหมด →
            </Button>
            
          </Box>

          <Box sx={{ 
            display: "grid", 
            gridTemplateColumns: { 
              xs: "1fr", 
              sm: "repeat(2, 1fr)", 
              md: "repeat(3, 1fr)", 
              lg: "repeat(4, 1fr)" 
            }, 
            gap: { xs: 1.5, sm: 2, md: 2 },
            width: "100%",
            maxWidth: "100%"
          }}>
            {blogLoading ? (
              // Loading state
              Array.from({ length: 4 }).map((_, index) => (
                <Box key={index}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      overflow: "hidden",
                      border: "3px solid #000",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        paddingTop: '56.25%', // 16:9 aspect ratio
                        backgroundColor: "#f0f0f0"
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <CircularProgress size={40} />
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ height: 20, backgroundColor: "#f0f0f0", borderRadius: 1, mb: 2 }} />
                      <Box sx={{ height: 40, backgroundColor: "#f0f0f0", borderRadius: 1, mb: 2 }} />
                      <Box sx={{ height: 16, backgroundColor: "#f0f0f0", borderRadius: 1, width: "60%" }} />
                    </CardContent>
                  </Card>
                </Box>
              ))
            ) : (
              // Blog posts from API
              blogPosts.map((post, index) => {
                // Use category color from database or fallback colors
                const fallbackColors = [
                  { bg: "#FF8A50", badge: "#FFD700", button: "#FF6B35" },
                  { bg: "#4CAF50", badge: "#E8F5E8", button: "#4CAF50" },
                  { bg: "#52C4F0", badge: "#E3F2FD", button: "#52C4F0" }
                ];
                const fallbackColor = fallbackColors[index] || fallbackColors[0];
                
                // Function to lighten color for badge background
                const lightenColor = (hex: string, percent: number) => {
                  const num = parseInt(hex.replace("#", ""), 16);
                  const amt = Math.round(2.55 * percent);
                  const R = (num >> 16) + amt;
                  const G = (num >> 8 & 0x00FF) + amt;
                  const B = (num & 0x0000FF) + amt;
                  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
                };

                const categoryColor = post.category.color || fallbackColor.bg;
                const color = {
                  bg: categoryColor,
                  badge: lightenColor(categoryColor, 40), // Lighter version for badge background
                  button: categoryColor
                };

                return (
                  <Box key={post.id}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        overflow: "hidden",
                        border: "3px solid #000",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        transition: "transform 0.3s ease",
                        cursor: "pointer",
                        "&:hover": {
                          transform: "translateY(-4px)"
                        }
                      }}
                      onClick={() => handleReadArticle(post.slug)}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          paddingTop: '56.25%', // 16:9 aspect ratio
                          backgroundColor: color.bg,
                          overflow: "hidden"
                        }}
                      >
                        {post.imageUrl && (
                          <Image 
                            src={post.imageUrl} 
                            alt={post.title} 
                            width={400} 
                            height={225} 
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover"
                            }}
                          />
                        )}
                      </Box>
                      <CardContent sx={{ p: 3 }}>
                        {/* Badge - เล็กและประหยัดพื้นที่ */}
                        <Box
                          sx={{
                            backgroundColor: post.category.color || color.badge,
                            borderRadius: "12px",
                            px: 1.5,
                            py: 0.25,
                            border: "1px solid #000",
                            display: "inline-block",
                            mb: 1
                          }}
                        >
                          <Typography sx={{ 
                            fontSize: "10px", 
                            fontWeight: "600", 
                            color: "#fff",
                            lineHeight: 1.2
                          }}>
                            {post.category.name}
                          </Typography>
                        </Box>
                        
                        <Typography
                          sx={{
                            fontSize: "18px",
                            fontWeight: "700",
                            color: "#000",
                            mb: 2,
                            lineHeight: 1.3,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                          }}
                        >
                          {post.title}
                        </Typography>
                        <Typography
                          sx={{
                            color: "#666",
                            fontSize: "14px",
                            lineHeight: 1.6,
                            mb: 2,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            wordBreak: "break-word"
                          }}
                        >
                          {post.excerpt}
                        </Typography>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReadArticle(post.slug);
                          }}
                          sx={{
                            color: color.button,
                            fontSize: "14px",
                            textTransform: "none",
                            p: 0,
                            minWidth: "auto",
                            fontWeight: "600",
                            "&:hover": { backgroundColor: "transparent", textDecoration: "underline" }
                          }}
                        >
                          อ่านต่อ →
                        </Button>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })
            )}
          </Box>
        </Container>


        {/* Footer Services Section */}
        <Box sx={{ backgroundColor: "#F4D03F", py: 4 }}>
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-around", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              {[
{ name: "ครอบครัว", icon: "👪", color: "#FFB6C1" }, // Light Pink
{ name: "สุขภาพ", icon: "🏥", color: "#F0E68C" }, // Khaki / Mellow Yellow
{ name: "อาหาร", icon: "🍖", color: "#FFDAB9" }, // Peach Puff
{ name: "ความรัก", icon: "💕", color: "#FFC0CB" }, // Pink
{ name: "เพื่อน", icon: "👬", color: "#B0E0E6" }  // Powder Blue
              ].map((service, index) => (
                <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "white" }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: service.color,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Typography sx={{ fontSize: "16px" }}>{service.icon}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "14px", fontWeight: "600", color: "black" }}>
                    {service.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>

        {/* Footer - Minimal */}
        <Box sx={{ backgroundColor: "#2d2d2d", py: 3 }}>
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
              {/* Logo */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Image
                  src="/images/whatdadog_logo_white.png"
                  alt="What Da Dog Pet Shop"
                  width={140}
                  height={60}
                  style={{
                    objectFit: "contain",
                    maxWidth: "100%",
                    height: "auto"
                  }}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <a href="#" aria-label="Facebook" style={{ textDecoration: "none" }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#1877F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ color: "white", fontWeight: 700, fontSize: 18 }}>f</Typography>
                  </Box>
                </a>
                <a href="#" aria-label="TikTok" style={{ textDecoration: "none" }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>♪</Typography>
                  </Box>
                </a>
                <a href="https://line.me/R/ti/p/@658jluqf" target="_blank" aria-label="LINE" style={{ textDecoration: "none" }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#06C755", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 10 }}>LINE</Typography>
                  </Box>
                </a>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Registration Certificate Sheet */}
        <RegistrationCertificateSheet
          open={isRegistrationSheetOpen}
          onClose={() => setIsRegistrationSheetOpen(false)}
        />

        {/* Cart Drawer */}
        <Cart
          open={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
        />

      </Box>
      
      {/* Floating Actions (Back to Top only) */}
      <FloatingActions 
        cartItemCount={0}
        onCartClick={handleCartClick}
        showCart={false}
      />
    </>
  );
}