"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { displayName: string; email: string; statusMessage: string }) => void;
  initialData: {
    displayName: string;
    email?: string;
    statusMessage?: string;
  };
}

export default function EditProfileDialog({
  open,
  onClose,
  onSave,
  initialData,
}: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    displayName: initialData.displayName || "",
    email: initialData.email || "",
    statusMessage: initialData.statusMessage || "",
  });

  // Update form data when initialData changes
  useEffect(() => {
    setFormData({
      displayName: initialData.displayName || "",
      email: initialData.email || "",
      statusMessage: initialData.statusMessage || "",
    });
  }, [initialData]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>แก้ไขโปรไฟล์</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="ชื่อแสดง"
            value={formData.displayName}
            onChange={handleChange("displayName")}
            fullWidth
            required
          />
          <TextField
            label="อีเมล"
            type="email"
            value={formData.email}
            onChange={handleChange("email")}
            fullWidth
          />
          <TextField
            label="สถานะ"
            value={formData.statusMessage}
            onChange={handleChange("statusMessage")}
            fullWidth
            multiline
            rows={2}
            placeholder="เขียนสถานะของคุณ..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ยกเลิก</Button>
        <Button onClick={handleSave} variant="contained">
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
}