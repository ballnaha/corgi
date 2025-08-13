"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Avatar,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack,
  Pets,
} from "@mui/icons-material";
import { colors } from "@/theme/colors";
import { useLiff } from "@/hooks/useLiff";
// Removed unused EditProfileDialog

interface UserData {
  id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl?: string | null;
  email?: string | null;
  statusMessage?: string | null;
  createdAt: Date | string;
  lastLoginAt: Date | string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
    breed?: string | null;
    gender?: string | null;
    age?: string | null;
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: Date | string;
  items: OrderItem[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { isInLiff, getProfile } = useLiff();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [categoryTabs, setCategoryTabs] = useState<{ key: string; name: string; icon?: string }[]>([]);
  // Bottom navigation is now global in RootLayout
  const [dataFetched, setDataFetched] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      setLoadingUser(true);
      // Get additional LINE profile data if in LIFF
      let lineProfile = null;
      if (isInLiff) {
        try {
          lineProfile = await getProfile();
        } catch (error) {
          console.warn("Could not get LIFF profile:", error);
        }
      }

      // Fetch user data from our API
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setUserData({
          ...data,
          statusMessage: lineProfile?.statusMessage || data.statusMessage,
        });
      } else {
        // If user doesn't exist in DB, create them
        const createResponse = await fetch("/api/user/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lineUserId: session?.user?.lineUserId,
            displayName: session?.user?.name,
            pictureUrl: session?.user?.image,
            email: session?.user?.email,
            statusMessage: lineProfile?.statusMessage,
          }),
        });

        if (createResponse.ok) {
          const newUser = await createResponse.json();
          setUserData(newUser);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoadingUser(false);
    }
  }, [isInLiff, getProfile]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const response = await fetch("/api/user/orders");
      
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      } else {
        console.error("Failed to fetch orders, status:", response.status);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch('/api/categories');
      if (!res.ok) return;
      const cats = await res.json();
      // Ensure only needed fields and order stable
      const tabs = cats
        .filter((c: any) => ['dogs', 'cats', 'birds', 'fish', 'toys', 'food'].includes(c.key))
        .map((c: any) => ({ key: c.key, name: c.name, icon: c.icon }))
        // Keep the visual order similar to existing UI
        .sort((a: any, b: any) => {
          const order = ['dogs', 'cats', 'birds', 'fish', 'toys'];
          return order.indexOf(a.key) - order.indexOf(b.key);
        });
      setCategoryTabs(tabs);
    } catch (e) {
      // ignore
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted || status === "loading" || dataFetched) return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    // Only fetch data once when component mounts and session is available
    if (mounted && session && status === "authenticated") {
      fetchUserData();
      fetchOrders();
      fetchCategories();
      setDataFetched(true);
    }
  }, [mounted, session, status, dataFetched]);

  const handleUpdateProfile = async (updatedData: {
    displayName: string;
    email: string;
    statusMessage: string;
  }) => {
    try {
      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUserData(updatedUser);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // Filter orders by category
  const getFilteredOrders = () => {
    const dynamicKeys = categoryTabs.map(c => c.key);
    const selectedKey = dynamicKeys[selectedCategory] ?? 'other';

    if (selectedKey === 'other') {
      return orders.filter(order =>
        order.items.some(item => !dynamicKeys.includes(item.product.category))
      );
    }

    return orders.filter(order =>
      order.items.some(item => item.product.category === selectedKey)
    );
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dogs': return '🐕';
      case 'cats': return '🐱';
      case 'birds': return '🐦';
      case 'fish': return '🐠';
      default: return '🐾';
    }
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Only show loading for initial mount and auth loading
  if (!mounted || status === "loading") {
    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.default",
          zIndex: 9999,
          gap: 2,
        }}
      >
        <Typography suppressHydrationWarning>กำลังโหลดโปรไฟล์...</Typography>
      </Box>
    );
  }

  if (!session) {
    return null;
  }

  // Wait until all API calls have completed before rendering content
  const isDataLoading = loadingUser || loadingOrders || loadingCategories;

  if (isDataLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #FFB74D 0%, #FF8A65 100%)",
          position: "relative",
          pb: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Use session data as fallback while userData is loading
  const displayData = userData || {
    displayName: session.user?.name || "",
    pictureUrl: session.user?.image || "",
    email: session.user?.email || "",
    lineUserId: session.user?.lineUserId || "",
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FFB74D 0%, #FF8A65 100%)",
        position: "relative",
        pb: 10, // Space for bottom navigation
      }}
    >
      {isDataLoading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "background.default",
            zIndex: 1300,
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      )}


      {/* Header - Transparent with Back and Home Buttons */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 1100,
        }}
      >
        <IconButton
          onClick={() => router.back()}
          sx={{
            backgroundColor: "transparent",
            color: colors.secondary.main,
            width: 48,
            height: 48,
            borderRadius: "50%",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              transform: "scale(1.05)",
            },
            "&:active": {
              transform: "scale(0.95)",
            },
          }}
        >
          <ArrowBack fontSize="medium" />
        </IconButton>
      </Box>



      {/* User Profile Section */}
      <Box
        sx={{
          pt: 8,
          pb: 4,
          px: 3,
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        {/* User Avatar */}
        <Avatar
          src={displayData.pictureUrl || session.user?.image || ""}
          alt={displayData.displayName || session.user?.name || "User"}
          sx={{
            width: 100,
            height: 100,
            border: `3px solid ${colors.secondary.main}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        />

        {/* User Info */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h4"
            sx={{
              color: colors.secondary.main,
              fontWeight: "bold",
              mb: 1,
              fontSize: "1.8rem",
            }}
          >
            {displayData.displayName || session.user?.name}
          </Typography>

          {/* Removed unused empty description block */}


        </Box>
      </Box>

      {/* Purchase History Section */}
      <Box
        sx={{
          backgroundColor: colors.secondary.main,
          borderRadius: "32px 32px 0 0",
          minHeight: "60vh",
          p: 3,
          mt: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: colors.text.primary,
            fontWeight: "bold",
            mb: 3,
            fontSize: "1.5rem",
          }}
        >
          ประวัติการซื้อสินค้า
        </Typography>

        {/* Category Tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={selectedCategory}
            onChange={(_, newValue) => setSelectedCategory(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: colors.primary.main,
              },
              "& .MuiTab-root": {
                color: colors.text.secondary,
                fontWeight: "bold",
                textTransform: "none",
                fontSize: "0.9rem",
                minWidth: "auto",
                px: 2,
                "&.Mui-selected": {
                  color: colors.primary.main,
                },
              },
            }}
          >
            {categoryTabs.map((c) => (
              <Tab key={c.key} label={c.name} icon={<span style={{ fontSize: '1.2rem' }}>{c.icon ?? '🐾'}</span>} />
            ))}
            <Tab label="อื่นๆ" icon={<Pets fontSize="small" />} />
          </Tabs>
        </Box>

        {/* Purchase History Content */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {loadingOrders ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <>
              {getFilteredOrders().length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: colors.text.secondary }}>
                    ยังไม่มีประวัติการซื้อในหมวดนี้
                  </Typography>
                </Box>
              ) : (
                getFilteredOrders().map((order) => (
                  <Card
                    key={order.id}
                    sx={{
                      borderRadius: 3,
                      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                      overflow: "hidden",
                      mx: -3
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {order.items.map((item, index) => (
                        <Box key={item.id} sx={{ display: "flex", gap: 3, mb: index < order.items.length - 1 ? 2 : 0 }}>
                          {item.product.imageUrl ? (
                            <Box
                              component="img"
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              loading="lazy"
                              sx={{
                                width: 96,
                                height: 96,
                                borderRadius: 2,
                                objectFit: 'cover',
                                flexShrink: 0,
                                border: `1px solid ${colors.background.default}`,
                                backgroundColor: colors.background.default,
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 96,
                                height: 96,
                                borderRadius: 2,
                                background: "linear-gradient(135deg, #FFB74D 0%, #FF9800 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "2rem",
                                flexShrink: 0,
                                border: `1px solid ${colors.background.default}`,
                              }}
                            >
                              {getCategoryIcon(item.product.category)}
                            </Box>
                          )}
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                color: colors.text.primary,
                                fontWeight: "bold",
                                fontSize: "1.2rem",
                                mb: 1,
                              }}
                            >
                              {item.product.name}
                              {item.product.breed && ` - ${item.product.breed}`}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: colors.text.secondary,
                                mb: 1,
                                fontSize: "0.85rem",
                              }}
                            >
                              วันที่ซื้อ: {formatDate(order.createdAt)}
                            </Typography>
                            {item.product.gender && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: colors.text.secondary,
                                  mb: 1,
                                  fontSize: "0.8rem",
                                }}
                              >
                                เพศ: {item.product.gender === 'MALE' ? 'ผู้ชาย' : item.product.gender === 'FEMALE' ? 'ผู้หญิง' : 'ไม่ระบุ'}
                                {item.product.age && ` • อายุ: ${item.product.age}`}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  color: colors.primary.main,
                                  fontWeight: "bold",
                                  fontSize: "1.1rem",
                                }}
                              >
                                ฿{item.price.toLocaleString()}
                                {item.quantity > 1 && ` x ${item.quantity}`}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: order.status === 'DELIVERED' ? colors.success : 
                                         order.status === 'PROCESSING' ? colors.warning : colors.info,
                                  fontWeight: 'bold',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  backgroundColor: order.status === 'DELIVERED' ? `${colors.success}20` : 
                                                   order.status === 'PROCESSING' ? `${colors.warning}20` : `${colors.info}20`,
                                }}
                              >
                                {order.status === 'DELIVERED' ? 'ส่งแล้ว' : 
                                 order.status === 'PROCESSING' ? 'กำลังดำเนินการ' : 
                                 order.status === 'PENDING' ? 'รอดำเนินการ' : order.status}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                      {order.items.length > 1 && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${colors.background.default}` }}>
                          <Typography
                            variant="h6"
                            sx={{
                              color: colors.text.primary,
                              fontWeight: "bold",
                              textAlign: 'right',
                            }}
                          >
                            รวม: ฿{order.totalAmount.toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}
        </Box>
      </Box>



      {/* BottomNavigation is rendered globally in RootLayout */}
    </Box>
  );
}