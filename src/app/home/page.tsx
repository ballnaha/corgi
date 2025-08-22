"use client";

import React from "react";
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
  Grid
} from "@mui/material";
import Image from "next/image";
import { colors } from "@/theme/colors";

export default function HomePage() {
  const router = useRouter();

  const handleBookNow = () => {
    router.push("/shop");
  };

  const handleReadArticle = () => {
    router.push("/shop");
  };

  const handleShopNow = () => {
    router.push("/shop");
  };

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
      name: "COCKATIELL",
      imageSrc: "/images/bird1.png",
      bgColor: "#FF8A50"
    },
    {
      name: "SPANISH BULLDOG", 
      imageSrc: "/images/icon-corgi.png",
      bgColor: "#F4D03F"
    },
    {
      name: "SPANIEL DOG",
      imageSrc: "/images/dog-house.png",
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
          }
        }}
      />
      <Box sx={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
        
        {/* Header */}
        <Box
          sx={{
            backgroundColor: "white",
            py: 2,
            px: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #f0f0f0"
          }}
        >
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                backgroundColor: "#FF6B35",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Typography sx={{ color: "white", fontSize: "12px", fontWeight: "bold" }}>🐾</Typography>
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: "bold",
                color: "#000",
                fontSize: "18px"
              }}
            >
              PUPPS
            </Typography>
          </Box>

          {/* Navigation */}
          <Box sx={{ display: "flex", gap: 4, alignItems: "center" }}>
            
            <Button
              variant="outlined"
              onClick={handleBookNow}
              sx={{
                borderColor: "#000",
                color: "#000",
                borderRadius: "20px",
                px: 3,
                py: 0.5,
                fontSize: "14px",
                textTransform: "none",
                "&:hover": {
                  borderColor: "#FF6B35",
                  color: "#FF6B35"
                }
              }}
            >
              Shop Now
            </Button>
          </Box>
        </Box>

        {/* Hero Section */}
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexDirection: { xs: "column", md: "row" }
            }}
          >
            {/* Left Content */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2.5rem", md: "3.5rem" },
                  fontWeight: "800",
                  color: "#000",
                  lineHeight: 1.1,
                  mb: 3,
                  letterSpacing: "-0.02em"
                }}
              >
                YOUR<br />
                PUPP'S BEST<br />
                FRIEND <Box component="span" sx={{ color: "#FF6B6B", fontSize: "2rem" }}>❤️</Box>
              </Typography>
              
              <Typography
                sx={{
                  color: "#666",
                  fontSize: "16px",
                  lineHeight: 1.6,
                  mb: 4,
                  maxWidth: "400px"
                }}
              >
                Training, grooming & nutrition & exercise; there's
                caring worth often becomes the family.
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
                  Book a Schedule
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
                      <Typography sx={{ fontSize: "20px" }}>🐾</Typography>
                      <Typography sx={{ fontSize: "8px", fontWeight: "bold", color: "#000" }}>SAFE & HEALTH</Typography>
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
                    <Typography sx={{ fontSize: "12px", fontWeight: "bold" }}>FISH CUTLET</Typography>
                    <Typography sx={{ fontSize: "10px", mt: 0.5 }}>Ingredients: Pumpkin, Meat, Fish Cutlet</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>

        {/* Info Cards Section */}
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
            {/* Left Combined Card (text + price) */}
            <Box sx={{ flex: 1, position: "relative" }}>
              <Card
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #111",
                  display: "flex",
                  alignItems: "center",
                  overflow: "visible",
                  minHeight: 120
                }}
              >
                {/* Dog image outside card to the left like mockup */}
                <Box
                  sx={{
                    position: "absolute",
                    left: -30,
                    bottom: 30,
                    width: 100,
                    height: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Image src="/images/corgi1.png" alt="dog" width={250} height={250} />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                  {/* Text area */}
                  <Box sx={{ flex: 1, pl: { xs: 8, md: 10 }, pr: 2 }}>
                    <Typography
                      sx={{
                        fontSize: "16px",
                        fontWeight: 800,
                        color: "#000",
                        mb: 0.5,
                        lineHeight: 1.1
                      }}
                    >
                      LEARN HOW TO
                      <br />
                      CARE PUPPY'S
                    </Typography>
                    <Button
                      onClick={handleReadArticle}
                      sx={{
                        color: "#111",
                        fontSize: "12px",
                        textTransform: "none",
                        p: 0,
                        minWidth: "auto",
                        textDecoration: "underline",
                        "&:hover": { backgroundColor: "transparent", color: "#FF6B35" }
                      }}
                    >
                      Read Article
                    </Button>
                  </Box>

                  {/* Price area with divider */}
                  <Box sx={{ pl: 3, ml: 2, borderLeft: "1px solid #111", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Box sx={{ position: "relative", width: 110, height: 110 }}>
                      {/* Outer circular text */}
                      <svg width={110} height={110} viewBox="0 0 110 110" style={{ position: "absolute", top: 0, left: 0 }}>
                        <defs>
                          <path id="textcircle" d="M55,55 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
                        </defs>
                        <text style={{ fontSize: 8, letterSpacing: 1, fill: "#111" }}>
                          <textPath href="#textcircle" startOffset="0">
                            GROOMING • EXERCISE • TRAINING •
                          </textPath>
                        </text>
                      </svg>

                      {/* Inner dashed circle and price */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: 76,
                          height: 76,
                          backgroundColor: "#FFF",
                          borderRadius: "50%",
                          border: "2px dashed #111",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Box sx={{ textAlign: "center", lineHeight: 1 }}>
                          <Typography sx={{ fontSize: "20px", fontWeight: "bold" }}>$13</Typography>
                          <Typography sx={{ fontSize: "8px", color: "#111" }}>MONTH</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Card>
            </Box>

            {/* Right Nutrition Card */}
            <Box sx={{ flex: 1, position: "relative" }}>
              <Card
                sx={{
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #111",
                  color: "#000",
                  minHeight: 160,
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                {/* Product image slightly overlapping inside left side */}
                <Box sx={{ position: "absolute", left: 12, top: -8 }}>
                  <Image src="/images/promotion.png" alt="product" width={64} height={86} />
                </Box>

                <Box sx={{ pl: 10 }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 800, mb: 0.5, textAlign: "left" }}>
                    BASIC NUTRITION
                    <br />
                    MEAT BALL
                  </Typography>
                  <Button
                    onClick={handleShopNow}
                    sx={{
                      color: "#111",
                      fontSize: "12px",
                      textTransform: "none",
                      p: 0,
                      minWidth: "auto",
                      textDecoration: "underline",
                      "&:hover": { backgroundColor: "transparent", color: "#FF6B35" }
                    }}
                  >
                    Shop Now
                  </Button>
                </Box>
              </Card>
            </Box>
          </Box>
        </Container>

        {/* Pet Collection Section */}
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: "1.8rem", md: "2.2rem" },
                fontWeight: "800",
                color: "#000"
              }}
            >
              WELL GROOMED PET COLLECTION
            </Typography>
            <Typography
              sx={{
                color: "#666",
                fontSize: "14px",
                maxWidth: "300px"
              }}
            >
              We have huge collection of domestic animal.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
            {petCollection.map((pet, index) => (
              <Box key={index} sx={{ flex: 1 }}>
                <Card
                  sx={{
                    borderRadius: 4,
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)"
                    }
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: pet.bgColor,
                      height: 200,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "80px",
                      position: "relative",
                      overflow: "visible",
                      // เพิ่ม bubble effects สำหรับแต่ละ pet
                      ...(pet.name === "COCKATIELL" && {
                        // เพิ่มวงกลมสีส้มอ่อนแบบ bubble
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '-20px',
                          left: '-20px',
                          width: '80px',
                          height: '80px',
                          backgroundColor: 'rgba(255, 138, 80, 0.6)',
                          borderRadius: '50%',
                          animation: 'float 3s ease-in-out infinite',
                          zIndex: 10,
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: '-15px',
                          right: '-15px',
                          width: '60px',
                          height: '60px',
                          backgroundColor: 'rgba(255, 138, 80, 0.5)',
                          borderRadius: '50%',
                          animation: 'float 4s ease-in-out infinite reverse',
                          zIndex: 10,
                          border: '2px solid rgba(255, 255, 255, 0.2)'
                        }
                      }),
                      // เพิ่ม bubble effects สำหรับ SPANISH BULLDOG
                      ...(pet.name === "SPANISH BULLDOG" && {
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '-18px',
                          right: '-18px',
                          width: '70px',
                          height: '70px',
                          backgroundColor: 'rgba(244, 208, 63, 0.7)',
                          borderRadius: '50%',
                          animation: 'bounce 3.5s ease-in-out infinite',
                          zIndex: 10,
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: '-12px',
                          left: '-12px',
                          width: '50px',
                          height: '50px',
                          backgroundColor: 'rgba(244, 208, 63, 0.6)',
                          borderRadius: '50%',
                          animation: 'float 4.5s ease-in-out infinite',
                          zIndex: 10,
                          border: '2px solid rgba(255, 255, 255, 0.2)'
                        }
                      }),
                      // เพิ่ม bubble effects สำหรับ SPANIEL DOG
                      ...(pet.name === "SPANIEL DOG" && {
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '-16px',
                          left: '-16px',
                          width: '65px',
                          height: '65px',
                          backgroundColor: 'rgba(82, 196, 240, 0.7)',
                          borderRadius: '50%',
                          animation: 'float 3.2s ease-in-out infinite',
                          zIndex: 10,
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: '-10px',
                          right: '-10px',
                          width: '45px',
                          height: '45px',
                          backgroundColor: 'rgba(82, 196, 240, 0.6)',
                          borderRadius: '50%',
                          animation: 'bounce 2.8s ease-in-out infinite',
                          animationDelay: '0.5s',
                          zIndex: 10,
                          border: '2px solid rgba(255, 255, 255, 0.2)'
                        }
                      })
                    }}
                  >
                    {/* เพิ่ม bubble วงกลมเล็กๆ สำหรับแต่ละ pet */}
                    {pet.name === "COCKATIELL" && (
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
                    {/* เพิ่ม bubble วงกลมเล็กๆ สำหรับ SPANISH BULLDOG */}
                    {pet.name === "SPANISH BULLDOG" && (
                      <>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '30px',
                            left: '25px',
                            width: '25px',
                            height: '25px',
                            backgroundColor: 'rgba(244, 208, 63, 0.8)',
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
                            backgroundColor: 'rgba(244, 208, 63, 0.7)',
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
                            backgroundColor: 'rgba(244, 208, 63, 0.8)',
                            borderRadius: '50%',
                            animation: 'float 2.8s ease-in-out infinite',
                            animationDelay: '1.2s',
                            zIndex: 15,
                            border: '2px solid rgba(255, 255, 255, 0.4)'
                          }}
                        />
                      </>
                    )}
                    {/* เพิ่ม bubble วงกลมเล็กๆ สำหรับ SPANIEL DOG */}
                    {pet.name === "SPANIEL DOG" && (
                      <>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '25px',
                            right: '30px',
                            width: '28px',
                            height: '28px',
                            backgroundColor: 'rgba(82, 196, 240, 0.8)',
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
                            backgroundColor: 'rgba(82, 196, 240, 0.7)',
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
                            backgroundColor: 'rgba(82, 196, 240, 0.8)',
                            borderRadius: '50%',
                            animation: 'bounce 2.6s ease-in-out infinite',
                            animationDelay: '1.4s',
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
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Box sx={{ display: "flex", gap: 6, alignItems: "center", flexDirection: { xs: "column", lg: "row" } }}>
            {/* Left side - Services list */}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "2rem", md: "2.5rem" },
                  fontWeight: "800",
                  color: "#000",
                  lineHeight: 1.1,
                  mb: 2
                }}
              >
                HOW WE SERVE OUR<br />
                PET PARENTS
              </Typography>
              
              <Typography
                sx={{
                  color: "#666",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  mb: 4,
                  maxWidth: "300px"
                }}
              >
                making pet rearing simpler for you. Our entire, well rounded routine is created with love.
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[
                  { text: "Adoption", active: true },
                  { text: "Fostering", active: false },
                  { text: "Vaccination", active: false },
                  { text: "Grooming", active: false }
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
                    <Typography sx={{ fontSize: "16px", fontWeight: item.active ? 700 : 400, color: "#000" }}>
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

        {/* WHAT WE CARE THE MOST Section */}
        <Container maxWidth="lg" sx={{ py: 6 }}>
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
                <Box sx={{ width: 44, height: 44, backgroundColor: "#4CAF50", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography sx={{ color: "white", fontSize: "22px" }}>🐾</Typography>
                </Box>
                <Typography sx={{ fontSize: { xs: "1.3rem", md: "1.8rem" }, fontWeight: 800, lineHeight: 1 }}>
                  WHAT WE CARE<br />THE MOST?
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#000", mb: 1 }}>PUPP'S —</Typography>
                <Typography sx={{ color: "#666", fontSize: 14, lineHeight: 1.6 }}>
                  has a unique pet service, starts with anatomic research, analyzes, and provides precise growth, and health.
                </Typography>
              </Box>
            </Box>

            {/* Middle-Top: Counter */}
            <Box sx={{ p: 3, gridColumn: { lg: 2 }, gridRow: { lg: 1 }, display: "flex", flexDirection: "column", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
              <Typography sx={{ fontSize: 12, color: "#666", mb: 1 }}>Clients Testimonial</Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 800 }}>01 -</Typography>
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
                <Image src="/images/cat1_nobg.png" alt="cat" width={214} height={250} style={{ objectFit: "contain", borderRadius: 8 }} />
                <Box sx={{ position: "absolute", top: "50%", right: -14, transform: "translateY(-50%)", width: 36, height: 36, backgroundColor: "#FF7A32", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }}>
                  <Typography sx={{ color: "white", fontSize: 16 }}>▶</Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 12, color: "#666", mt: 0.5 }}>Never miss a moment!</Typography>
            </Box>

            {/* Middle-Middle: Testimonial text */}
            <Box sx={{ p: 3, gridColumn: { lg: 2 }, gridRow: { lg: 2 }, backgroundColor: "#FFFFFF" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Box sx={{ width: 30, height: 30, backgroundColor: "#FF6B35", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography sx={{ color: "white", fontSize: 16 }}>❝</Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
                Thanks for your patient to take care my Pudding for the whole week. Great care taker. Will definitely send my Pudding to you for home boarding again.
              </Typography>
            </Box>

            {/* Middle-Bottom: Author */}
            <Box sx={{ p: 3, gridColumn: { lg: 2 }, gridRow: { lg: 3 }, backgroundColor: "#FFFFFF" }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#000" }}>SHANNON PAPPERT</Typography>
              <Typography sx={{ fontSize: 12, color: "#666" }}>Adventure Travellers</Typography>
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
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#000" }}>Book a Schedule</Typography>
                <Typography sx={{ color: "#999" }}>|</Typography>
                <Typography sx={{ fontSize: 14 }}>🐾</Typography>
              </Box>
            </Box>
          </Box>
        </Container>

        {/* Footer Services Section */}
        <Box sx={{ backgroundColor: "#F4D03F", py: 4 }}>
          <Container maxWidth="lg">
            <Box sx={{ display: "flex", justifyContent: "space-around", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
              {[
                { name: "GROOMING", icon: "🎀", color: "#FF69B4" },
                { name: "HEALTH", icon: "🏥", color: "#FFD700" },
                { name: "FEEDING", icon: "🍖", color: "#FF8A50" },
                { name: "LOVE", icon: "❤️", color: "#FF6B6B" },
                { name: "SITTING", icon: "🪑", color: "#8A2BE2" }
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
        <Box sx={{ backgroundColor: "#1A1A1A", py: 3 }}>
          <Container maxWidth="lg">
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 30, height: 30, backgroundColor: "#FF6B35", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography sx={{ color: "white", fontSize: "16px" }}>🐾</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "white", fontSize: "18px" }}>PUPP'S</Typography>
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
                <a href="#" aria-label="LINE" style={{ textDecoration: "none" }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#06C755", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 10 }}>LINE</Typography>
                  </Box>
                </a>
              </Box>
            </Box>
          </Container>
        </Box>

      </Box>
    </>
  );
}