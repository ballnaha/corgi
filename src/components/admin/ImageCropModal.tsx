'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  loadImageFromFile,
  createCroppedCanvas,
  canvasToFile,
  calculateAspectRatioCrop,
  needsCropping,
  validateImageFile
} from '@/utils/imageUtils';

interface ImageCropModalProps {
  open: boolean;
  onClose: () => void;
  onCrop: (croppedFile: File) => void;
  file: File | null;
  aspectRatio?: number; // 16/9 for blog images
  title?: string;
}

export default function ImageCropModal({
  open,
  onClose,
  onCrop,
  file,
  aspectRatio = 16 / 9,
  title = 'ปรับขนาดรูปภาพ'
}: ImageCropModalProps) {
  const [src, setSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(aspectRatio);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [enableAspectRatio, setEnableAspectRatio] = useState(true);
  const [outputSize, setOutputSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');
  
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Validate pixel crop object
  const isValidCrop = (c?: Crop): c is Crop => {
    if (!c) return false;
    const { x, y, width, height } = c;
    return (
      typeof x === 'number' && Number.isFinite(x) &&
      typeof y === 'number' && Number.isFinite(y) &&
      typeof width === 'number' && Number.isFinite(width) && width > 0 &&
      typeof height === 'number' && Number.isFinite(height) && height > 0
    );
  };

  // Size options for output
  const sizeOptions = {
    small: { width: 800, height: 450, label: 'เล็ก (800×450)' },
    medium: { width: 1200, height: 675, label: 'กลาง (1200×675)' },
    large: { width: 1600, height: 900, label: 'ใหญ่ (1600×900)' },
    xlarge: { width: 1920, height: 1080, label: 'ใหญ่มาก (1920×1080)' }
  };

  const getOutputDimensions = () => {
    return sizeOptions[outputSize];
  };

  // Load image when file changes
  useEffect(() => {
    if (!file || !open) {
      setSrc('');
      setPreviewUrl('');
      return;
    }

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'ไฟล์ไม่ถูกต้อง');
      return;
    }

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, open]);

  // Initialize crop when image loads
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const image = e.currentTarget;
    const { naturalWidth: width, naturalHeight: height } = image;
    
    console.log('Image loaded successfully', width, 'x', height);
    
    // Auto-adjust scale if image is too large for the container
    const maxDisplayWidth = 600; // Maximum width for display
    const maxDisplayHeight = 400; // Maximum height for display
    
    let autoScale = 1;
    if (width > maxDisplayWidth || height > maxDisplayHeight) {
      const scaleByWidth = maxDisplayWidth / width;
      const scaleByHeight = maxDisplayHeight / height;
      autoScale = Math.min(scaleByWidth, scaleByHeight, 1);
      setScale(autoScale);
      console.log('Auto-adjusting scale to:', autoScale);
    }
    
    if (aspect) {
      // Always create a default crop area
      const crop: Crop = {
        unit: '%',
        x: 5,
        y: 5,
        width: 90,
        height: 90 / aspect,
      };
      
      console.log('Setting initial crop:', crop);
      setCrop(crop);
      
      // Convert to pixel crop
      const pixelCrop: Crop = {
        unit: 'px' as const,
        x: ((crop.x || 0) / 100) * width,
        y: ((crop.y || 0) / 100) * height,
        width: ((crop.width || 0) / 100) * width,
        height: ((crop.height || 0) / 100) * height,
      };
      
      console.log('Setting initial pixel crop:', pixelCrop);
      setCompletedCrop(pixelCrop);
    }
  }, [aspect]);

  // Derive pixel crop from percent crop whenever crop changes
  useEffect(() => {
    if (!crop || !imgRef.current) return;
    const image = imgRef.current;
    // Ensure image is ready
    if (!image.complete || image.naturalWidth === 0) return;

    const pixelCrop: Crop = {
      unit: 'px',
      x: ((crop.x || 0) / 100) * image.naturalWidth,
      y: ((crop.y || 0) / 100) * image.naturalHeight,
      width: ((crop.width || 0) / 100) * image.naturalWidth,
      height: ((crop.height || 0) / 100) * image.naturalHeight,
    };

    // Guard against invalid crop
    if (isValidCrop(pixelCrop)) {
      setCompletedCrop(pixelCrop);
    }
  }, [crop]);

  // Update preview when crop changes
  useEffect(() => {
    const generatePreview = async () => {
      if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
        console.log('Missing preview requirements:', {
          completedCrop: !!completedCrop,
          imgRef: !!imgRef.current,
          previewCanvasRef: !!previewCanvasRef.current
        });
        setPreviewUrl('');
        return;
      }

      const canvas = previewCanvasRef.current;
      const image = imgRef.current;

      // Wait for image to be fully loaded
      if (!image.complete || image.naturalWidth === 0) {
        console.log('Image not ready yet, waiting...');
        const checkReady = () => {
          if (image.complete && image.naturalWidth > 0) {
            generatePreview();
          } else {
            setTimeout(checkReady, 50);
          }
        };
        checkReady();
        return;
      }

      try {
        console.log('Generating preview with crop:', completedCrop);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Could not get canvas context');
          setPreviewUrl('');
          return;
        }

                 // Use the actual crop dimensions for preview (1:1 scale)
         // This will show the exact pixels that will be cropped
        const previewWidth = Math.max(1, Math.round(completedCrop.width || 0));
        const previewHeight = Math.max(1, Math.round(completedCrop.height || 0));
        
        canvas.width = previewWidth;
        canvas.height = previewHeight;

        // Clear canvas
        ctx.clearRect(0, 0, previewWidth, previewHeight);

        // Enable image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Save the context state
        ctx.save();

        // Validate crop dimensions
        if (!isValidCrop(completedCrop)) {
          console.error('Invalid crop dimensions:', completedCrop);
          setPreviewUrl('');
          return;
        }

        // Always show exactly what will be cropped (without scale/rotate transformations)
        // This ensures preview matches the actual crop result
        ctx.drawImage(
          image,
          Math.max(0, completedCrop.x || 0), 
          Math.max(0, completedCrop.y || 0), 
          Math.min(completedCrop.width || 0, image.naturalWidth - (completedCrop.x || 0)), 
          Math.min(completedCrop.height || 0, image.naturalHeight - (completedCrop.y || 0)),
          0, 0, previewWidth, previewHeight
        );

        console.log('Preview crop area:', {
          source: {
            x: completedCrop.x,
            y: completedCrop.y,
            width: completedCrop.width,
            height: completedCrop.height
          },
          destination: {
            width: previewWidth,
            height: previewHeight
          }
        });

        // Restore context
        ctx.restore();

        // Generate preview URL from canvas
        const previewDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPreviewUrl(previewDataUrl);

        console.log('Preview generated successfully', previewWidth, 'x', previewHeight);
        console.log('Preview URL generated:', previewDataUrl.substring(0, 50) + '...');
      } catch (error) {
        console.error('Error generating preview:', error);
        setError('เกิดข้อผิดพลาดในการสร้างตัวอย่าง');
        setPreviewUrl('');
      }
    };

    // Use setTimeout to ensure this runs after the crop state is fully updated
    const timer = setTimeout(generatePreview, 10);
    return () => clearTimeout(timer);
  }, [completedCrop, aspectRatio]);

  const handleCrop = async () => {
    if (!completedCrop || !imgRef.current || !file) {
      console.log('Missing required data for crop:', { completedCrop, imgRef: imgRef.current, file });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Starting crop with:', {
        crop: completedCrop,
        scale,
        rotate,
        imageSize: { width: imgRef.current.naturalWidth, height: imgRef.current.naturalHeight },
        file: file.name
      });

      const image = imgRef.current;
      
      // Create a canvas with the final target size
      const { width: targetWidth, height: targetHeight } = getOutputDimensions();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Always use the original image coordinates for cropping
      // Scale and rotate are only for display purposes in the UI
      const croppedCanvas = createCroppedCanvas(
        image,
        {
          x: completedCrop.x || 0,
          y: completedCrop.y || 0,
          width: completedCrop.width || 0,
          height: completedCrop.height || 0,
        },
        targetWidth,
        targetHeight
      );
      
      // Copy the cropped content to our canvas
      ctx.drawImage(croppedCanvas, 0, 0);

      console.log('Canvas created successfully:', canvas.width, 'x', canvas.height);

      const croppedFile = await canvasToFile(
        canvas,
        file.name,
        file.type.includes('png') ? 'png' : 'jpeg',
        0.9
      );

      if (croppedFile) {
        console.log('Cropped file created successfully:', croppedFile.size, 'bytes');
        onCrop(croppedFile);
        handleClose();
      } else {
        console.error('Failed to create cropped file');
        setError('เกิดข้อผิดพลาดในการ crop รูปภาพ');
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      setError('เกิดข้อผิดพลาดในการ crop รูปภาพ: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSrc('');
    setPreviewUrl('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setScale(1);
    setRotate(0);
    setError(null);
    setLoading(false);
    setOutputSize('medium'); // Reset to default size
    onClose();
  };

  const handleAspectRatioToggle = (enabled: boolean) => {
    setEnableAspectRatio(enabled);
    setAspect(enabled ? aspectRatio : undefined);
    
    if (!enabled && imgRef.current) {
      // Reset to full image when aspect ratio is disabled
      const { naturalWidth: width, naturalHeight: height } = imgRef.current;
      setCrop({
        unit: '%',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      setCompletedCrop({
        unit: 'px',
        x: 0,
        y: 0,
        width,
        height,
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          เลือกส่วนของรูปภาพที่ต้องการใช้ - ลากเพื่อเลื่อนตำแหน่ง ปรับมุมเพื่อปรับขนาด
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Crop Area */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enableAspectRatio}
                    onChange={(e) => handleAspectRatioToggle(e.target.checked)}
                  />
                }
                label={`ล็อกอัตราส่วน ${aspectRatio.toFixed(2)}:1 (แนะนำสำหรับบล็อก)`}
              />
            </Box>

            {src && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                backgroundColor: 'grey.50',
                overflow: 'hidden',
                maxWidth: '100%',
                maxHeight: '500px',
                position: 'relative'
              }}>
                <ReactCrop
                  crop={crop}
                  onChange={(crop, percentCrop) => setCrop(percentCrop)}
                  onComplete={(crop) => {
                    // Guard: ignore empty/invalid crop
                    if (!crop || !Number.isFinite(crop.width || 0) || !Number.isFinite(crop.height || 0) || (crop.width || 0) <= 0 || (crop.height || 0) <= 0) {
                      return;
                    }
                    setCompletedCrop(crop);
                  }}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '450px'
                  }}
                >
                  <img
                    ref={imgRef}
                    alt="Crop preview"
                    src={src}
                    style={{
                      // Remove scale and rotate from the crop image
                      // These will only affect the visual display, not the crop coordinates
                      maxWidth: '100%',
                      maxHeight: '400px',
                      width: 'auto',
                      height: 'auto',
                      display: 'block'
                    }}
                    onLoad={onImageLoad}
                    onError={(e) => {
                      console.error('Image failed to load:', e);
                      setError('ไม่สามารถโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
                    }}
                    crossOrigin="anonymous"
                  />
                </ReactCrop>
                

              </Box>
            )}

            {/* Controls */}
            <Box sx={{ mt: 2, space: 2 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="output-size-label">ขนาดรูปที่ต้องการ</InputLabel>
                <Select
                  labelId="output-size-label"
                  value={outputSize}
                  label="ขนาดรูปที่ต้องการ"
                  onChange={(e) => setOutputSize(e.target.value as typeof outputSize)}
                >
                  {Object.entries(sizeOptions).map(([key, option]) => (
                    <MenuItem key={key} value={key}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontStyle: 'italic', p: 1, backgroundColor: 'warning.light', borderRadius: 1 }}>
                ⚠️ หมายเหตุ: การย่อ/ขยายและหมุนเป็นเครื่องมือช่วยดูเท่านั้น ไม่มีผลต่อการ Crop จริง
              </Typography>

              <Typography gutterBottom variant="body2">
                ขนาดสำหรับ Preview: {Math.round(scale * 100)}%
              </Typography>
              <Slider
                value={scale}
                onChange={(_, value) => setScale(value as number)}
                min={0.3}
                max={1.5}
                step={0.05}
                marks={[
                  { value: 0.3, label: '30%' },
                  { value: 0.5, label: '50%' },
                  { value: 1, label: '100%' },
                  { value: 1.5, label: '150%' },
                ]}
              />

              <Typography gutterBottom variant="body2" sx={{ mt: 2 }}>
                การหุนสำหรับ Preview: {rotate}°
              </Typography>
              <Slider
                value={rotate}
                onChange={(_, value) => setRotate(value as number)}
                min={-180}
                max={180}
                step={90}
                marks={[
                  { value: -180, label: '-180°' },
                  { value: -90, label: '-90°' },
                  { value: 0, label: '0°' },
                  { value: 90, label: '90°' },
                  { value: 180, label: '180°' },
                ]}
              />
            </Box>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          {/* Preview */}
          <Box sx={{ 
            width: { xs: '100%', md: '300px' },
            flexShrink: 0 
          }}>
            <Typography variant="subtitle2" gutterBottom>
              ตัวอย่าง
            </Typography>
                         <Box sx={{ 
               border: 1,
               borderColor: 'divider',
               borderRadius: 1,
               p: 2,
               backgroundColor: 'grey.50',
               textAlign: 'center',
               overflow: 'auto',
               maxHeight: '500px'
             }}>
               {!completedCrop ? (
                 <Box sx={{ 
                   width: '100%', 
                   height: '169px', // 300/16*9 
                   display: 'flex', 
                   alignItems: 'center', 
                   justifyContent: 'center',
                   border: '1px dashed #ddd',
                   borderRadius: '4px',
                   backgroundColor: '#f9f9f9'
                 }}>
                   <Typography variant="body2" color="text.secondary">
                     เลือกพื้นที่ crop เพื่อดูตัวอย่าง
                   </Typography>
                 </Box>
               ) : (
                 <>
                   <Box sx={{ 
                     display: 'inline-block',
                     border: '1px solid #ddd',
                     borderRadius: '4px',
                     backgroundColor: '#fff',
                     maxWidth: '100%'
                   }}>
                     <canvas
                       ref={previewCanvasRef}
                       style={{
                         display: 'block',
                         width: 'auto',
                         height: 'auto',
                         maxWidth: '100%'
                       }}
                     />
                   </Box>
                 </>
               )}
               <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                 {completedCrop ? 
                                       `Preview: ${Math.round(completedCrop.width || 0)} × ${Math.round(completedCrop.height || 0)} px` :
                   'Preview: ไม่มี'
                 } | 
                 ขนาดจริง: {getOutputDimensions().width} × {getOutputDimensions().height} px
               </Typography>
             </Box>

            {completedCrop && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" component="div">
                  <strong>ข้อมูลการ Crop (จากรูปต้นฉบับ):</strong>
                </Typography>
                <Typography variant="caption" component="div">
                  ตำแหน่ง: ({Math.round(completedCrop.x || 0)}, {Math.round(completedCrop.y || 0)})
                </Typography>
                <Typography variant="caption" component="div">
                  ขนาด: {Math.round(completedCrop.width || 0)} × {Math.round(completedCrop.height || 0)}
                </Typography>
                <Typography variant="caption" component="div">
                  อัตราส่วน: {((completedCrop.width || 0) / (completedCrop.height || 1)).toFixed(2)}:1
                </Typography>
                <Typography variant="caption" component="div">
                  Preview: {previewCanvasRef.current?.width || 0} × {previewCanvasRef.current?.height || 0}
                </Typography>
                <Typography variant="caption" component="div" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                  ✅ Preview แสดงตรงตามพื้นที่ Crop ที่เลือก
                </Typography>
              </Box>
            )}

            {/* Debug Info */}
            <Box sx={{ mt: 2, p: 1, backgroundColor: '#f0f8ff', borderRadius: 1, fontSize: '10px' }}>
              <Typography variant="caption" component="div" sx={{ fontSize: '10px' }}>
                🔧 Debug: {imgRef.current?.complete ? '✅ Image Ready' : '⏳ Loading...'} | 
                Canvas: {previewCanvasRef.current ? '✅ Ready' : '❌ Missing'} | 
                Crop: {completedCrop ? '✅ Set' : '❌ None'} | 
                Preview: {previewUrl ? '✅ Generated' : '❌ None'}
              </Typography>
              <Typography variant="caption" component="div" sx={{ fontSize: '10px' }}>
                Crop Area: {completedCrop ? `${Math.round(completedCrop.width || 0)}×${Math.round(completedCrop.height || 0)}` : 'None'} | 
                Display Scale: {scale}x | Aspect Lock: {enableAspectRatio ? 'ON' : 'OFF'}
              </Typography>
              <Typography variant="caption" component="div" sx={{ fontSize: '10px' }}>
                Output: {getOutputDimensions().width}×{getOutputDimensions().height} | Size: ~{Math.round((getOutputDimensions().width * getOutputDimensions().height * 3) / 1024)}KB
              </Typography>
                             <Typography variant="caption" component="div" sx={{ fontSize: '10px', color: 'success.main' }}>
                 ✅ Preview = ขนาดจริงของพื้นที่ Crop (1:1 Scale)
               </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={loading}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleCrop}
          variant="contained"
          disabled={!completedCrop || loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'กำลังประมวลผล...' : 'ใช้รูปนี้'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
