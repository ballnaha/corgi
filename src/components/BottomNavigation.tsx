"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Box, Typography } from "@mui/material";

import Image from "next/image";
import { colors } from "@/theme/colors";
import { handleLiffNavigation, isInLiffEnvironment } from "@/lib/liff-navigation";

interface BottomNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Derive active tab from current path when not explicitly controlled
  const derivedActiveTab = useMemo(() => {
    if (!pathname) return "home";
    if (pathname === "/" || pathname.startsWith("/product")) return "home";
    if (pathname.startsWith("/profile")) return "profile";
    if (pathname.startsWith("/favorites")) return "favorites";
    if (pathname.startsWith("/calendar")) return "calendar";
    return "home";
  }, [pathname]);

  const isControlled = typeof activeTab !== "undefined";
  const currentActiveTab = isControlled
    ? (activeTab as string)
    : derivedActiveTab;

  // Trigger a subtle bottom animation bar on route change
  const [routeAnimKey, setRouteAnimKey] = useState(0);
  useEffect(() => {
    setRouteAnimKey((k) => k + 1);
  }, [pathname]);

  const tabs = [
    { id: "home", icon: "custom", label: "หน้าหลัก" },
    { id: "favorites", icon: "custom", label: "รายการโปรด" },
    //{ id: "calendar", icon: ChatBubbleOutline, label: "ปฏิทิน" },
    { id: "profile", icon: "custom", label: "ข้อมูลส่วนตัว" },
  ];

  const getHrefForTab = (tabId: string) => {
    switch (tabId) {
      case "home":
        return "/";
      case "profile":
        return "/profile";
      case "favorites":
        return "/favorites";
      case "calendar":
        return "/calendar";
      default:
        return "/";
    }
  };

  const handleTabClick = (tabId: string) => {
    switch (tabId) {
      case "home":
        handleLiffNavigation(router, "/");
        break;
      case "profile":
        handleLiffNavigation(router, "/profile");
        break;
      case "favorites":
        handleLiffNavigation(router, "/favorites");
        break;
      case "calendar":
        // TODO: Navigate to calendar page when implemented
        console.log("Calendar page not implemented yet");
        break;
      default:
        onTabChange?.(tabId);
    }
  };

  // Hide bottom navigation on product detail pages, checkout, order-success, payment-notification, and admin pages
  if (
    pathname &&
    (pathname.startsWith("/product/") ||
      pathname.startsWith("/checkout") ||
      pathname.startsWith("/order-success") ||
      pathname.startsWith("/payment-notification") ||
      pathname.startsWith("/admin"))
  ) {
    return null;
  }

  return (
    <Box
      sx={{
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.secondary.main,
        borderTop: `1px solid ${colors.background.default}`,
        borderRadius: "20px 20px 0 0",
        px: 2,
        py: 1,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
        zIndex: 1000,
        height: 70,
        position: "fixed",
      }}
    >
      {/* Route change bottom animation */}
      <Box
        key={routeAnimKey}
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 3,
          backgroundColor: `${colors.primary.main}55`,
          transformOrigin: "left",
          animation: "growX 400ms ease",
          "@keyframes growX": {
            from: { transform: "scaleX(0)" },
            to: { transform: "scaleX(1)" },
          },
        }}
      />
      {tabs.map((tab) => {
        const isActive =
          currentActiveTab === tab.id || derivedActiveTab === tab.id;
        const isNavigable =
          tab.id === "home" || tab.id === "profile" || tab.id === "favorites";
        const content = (
          <Box
            key={tab.id}
            onClick={!isNavigable ? () => handleTabClick(tab.id) : undefined}
            sx={{
              display: "flex",
              flexDirection: isActive ? "row" : "column",
              alignItems: "center",
              cursor: "pointer",
              py: 0.5,
              px: isActive ? 2 : 1,
              borderRadius: isActive ? 5 : 2,
              backgroundColor: isActive ? colors.primary.main : "transparent",
              transition: "all 0.3s ease",
              gap: isActive ? 0.5 : 0,
              minWidth: isActive ? "auto" : 36,
              height: 48,
            }}
          >
            {tab.icon === "custom" ? (
              <Image
                src={
                  tab.id === "home" 
                    ? "/images/icon-home.png" 
                    : tab.id === "favorites"
                    ? "/images/icon-paw.png"
                    : "/images/icon-user.png"
                }
                alt={
                  tab.id === "home" 
                    ? "Home" 
                    : tab.id === "favorites"
                    ? "Favorites"
                    : "User Profile"
                }
                width={20}
                height={20}
                style={{
                  filter: isActive 
                    ? "brightness(0) saturate(100%) invert(100%)" 
                    : "brightness(0) saturate(100%) invert(60%)",
                  marginBottom: isActive ? 0 : 4,
                  transition: "all 0.3s ease",
                }}
              />
            ) : null}
            <Typography
              variant="caption"
              sx={{
                color: isActive ? colors.secondary.main : colors.text.secondary,
                fontSize: "0.7rem",
                fontWeight: isActive ? "bold" : "normal",
                display: isActive ? "block" : "block",
                mt: isActive ? 0 : 0.25,
              }}
            >
              {tab.label}
            </Typography>
          </Box>
        );

        return isNavigable ? (
          // In LIFF environment, prefer click handlers over Link for better compatibility
          isInLiffEnvironment() ? (
            <Box
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              sx={{ textDecoration: "none", cursor: "pointer" }}
            >
              {content}
            </Box>
          ) : (
            <Link
              key={tab.id}
              href={getHrefForTab(tab.id)}
              prefetch
              style={{ textDecoration: "none" }}
            >
              {content}
            </Link>
          )
        ) : (
          content
        );
      })}
    </Box>
  );
}
