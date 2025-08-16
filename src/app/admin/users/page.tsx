"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  CircularProgress,
  Alert,
  TablePagination,
} from "@mui/material";
import {
  Search,
  Person,
  AdminPanelSettings,
  Refresh,
  PersonAdd,
  CheckCircle,
} from "@mui/icons-material";
import { colors } from "@/theme/colors";

interface User {
  id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  email?: string;
  role: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  orderCount: number;
  totalSpent: number;
  _count?: {
    orders: number;
  };
  orders?: Array<{
    total: number;
  }>;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    newUsersThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchUsersAndStats();
  }, []);

  const fetchUsersAndStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching users and stats...");

      const response = await fetch("/api/admin/users");
      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        throw new Error(`ไม่สามารถโหลดข้อมูลผู้ใช้ได้ (${response.status})`);
      }

      const data = await response.json();
      console.log("📊 Received data:", data);

      setStats(
        data.stats || {
          totalUsers: 0,
          activeUsers: 0,
          adminUsers: 0,
          newUsersThisMonth: 0,
        }
      );
      setUsers(data.recentUsers || []);
      console.log("✅ Data loaded successfully");
    } catch (err: any) {
      console.error("❌ Error fetching users:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchUsersAndStats();
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(
        `/api/admin/users?action=search&q=${encodeURIComponent(
          searchQuery
        )}&limit=50`
      );

      if (!response.ok) {
        throw new Error("ไม่สามารถค้นหาผู้ใช้ได้");
      }

      const searchResults = await response.json();
      setUsers(searchResults);
      setPage(0); // Reset to first page
    } catch (err: any) {
      console.error("Error searching users:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการค้นหา");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  // Pagination
  const paginatedUsers = users.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography color="text.secondary">กำลังโหลดข้อมูลผู้ใช้...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: { xs: 2, sm: 0 },
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                mb: 1,
                fontSize: { xs: "1.5rem", md: "1.5rem" },
              }}
            >
              จัดการผู้ใช้งาน
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                fontSize: { xs: "0.875rem", md: "1rem" },
              }}
            >
              ดูและจัดการผู้ใช้งานทั้งหมดในระบบ
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchUsersAndStats}
            disabled={loading}
            size="small"
          >
            รีเฟรช
          </Button>
        </Box>


      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              alignItems: { xs: "stretch", sm: "center" },
            }}
          >
            <TextField
              placeholder="ค้นหาผู้ใช้ (ชื่อ, อีเมล, LINE ID)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              size="small"
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={searchLoading}
                size="small"
                sx={{
                  backgroundColor: colors.primary.main,
                  "&:hover": { backgroundColor: colors.primary.dark },
                  minWidth: { xs: "auto", sm: "80px" },
                }}
              >
                {searchLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  "ค้นหา"
                )}
              </Button>
              {searchQuery && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSearchQuery("");
                    fetchUsersAndStats();
                  }}
                >
                  ล้าง
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Users Table - Desktop */}
      <Card sx={{ display: { xs: "none", md: "block" } }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ผู้ใช้</TableCell>
                <TableCell>วันที่สมัคร</TableCell>
                <TableCell>เข้าใช้ล่าสุด</TableCell>
                <TableCell align="right">คำสั่งซื้อ</TableCell>
                <TableCell align="right">ยอดซื้อรวม</TableCell>
                <TableCell align="center">จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        src={user.pictureUrl}
                        alt={user.displayName || "User"}
                        sx={{ width: 40, height: 40 }}
                      >
                        {(user.displayName || "U").charAt(0)}
                      </Avatar>
                      <Box>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: "bold" }}
                          >
                            {user.displayName || "ไม่ระบุชื่อ"}
                          </Typography>
                          {user.isAdmin && (
                            <Chip
                              label="Admin"
                              size="small"
                              color="warning"
                              variant="filled"
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {user.email || user.lineUserId}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(user.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {user.lastLoginAt
                        ? formatDate(user.lastLoginAt)
                        : "ไม่เคยเข้าใช้"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {(user.orderCount || 0).toLocaleString()} คำสั่ง
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      {user.totalSpent ? formatCurrency(user.totalSpent) : "฿0"}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={users.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="รายการต่อหน้า:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
          }
        />
      </Card>

      {/* Users Cards - Mobile */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        {paginatedUsers.map((user) => (
          <Card key={user.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Avatar
                  src={user.pictureUrl}
                  alt={user.displayName || "User"}
                  sx={{ width: 50, height: 50 }}
                >
                  {(user.displayName || "U").charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "bold" }}
                      noWrap
                    >
                      {user.displayName || "ไม่ระบุชื่อ"}
                    </Typography>
                    {user.isAdmin && (
                      <Chip
                        label="Admin"
                        size="small"
                        color="warning"
                        variant="filled"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {user.email || user.lineUserId}
                  </Typography>
                </Box>
                <Box sx={{ width: 40, height: 40 }} />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    คำสั่งซื้อ
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {(user.orderCount || 0).toLocaleString()} คำสั่ง
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ยอดซื้อรวม
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", color: colors.primary.main }}
                  >
                    {user.totalSpent ? formatCurrency(user.totalSpent) : "฿0"}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    วันที่สมัคร
                  </Typography>
                  <Typography variant="body2">
                    {new Date(user.createdAt).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    เข้าใช้ล่าสุด
                  </Typography>
                  <Typography variant="body2">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                        })
                      : "ไม่เคยเข้าใช้"}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}

        {/* Mobile Pagination */}
        <Card>
          <TablePagination
            component="div"
            count={users.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            labelRowsPerPage="รายการต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
            }
          />
        </Card>
      </Box>

      {/* Empty State */}
      {users.length === 0 && !loading && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Person sx={{ fontSize: 64, color: colors.text.disabled, mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            ไม่พบผู้ใช้
          </Typography>
          <Typography color="text.secondary">
            {searchQuery
              ? "ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา"
              : "ยังไม่มีผู้ใช้ในระบบ"}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
