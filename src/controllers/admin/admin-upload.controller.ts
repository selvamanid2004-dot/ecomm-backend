import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/environment.config';

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const cleanExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    const uniqueName = `prod-${Date.now()}-${uuidv4().slice(0, 8)}${cleanExt}`;
    cb(null, uniqueName);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only safe image formats (PNG, JPG, JPEG, WEBP, GIF) are permitted. SVG is not allowed for security reasons.'));
    }
  },
}).single('image');

export class AdminUploadController {
  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Check if multipart file was uploaded
      if (req.file) {
        const filename = req.file.filename;
        const protocol = req.protocol || 'http';
        const host = req.get('host') || 'localhost:5000';
        const url = `${protocol}://${host}/uploads/${filename}`;
        const relativeUrl = `/uploads/${filename}`;

        res.status(200).json({
          success: true,
          message: 'Product image uploaded successfully',
          data: {
            url,
            relativeUrl,
            filename,
          },
        });
        return;
      }

      // 2. Fallback: Base64 data URL provided in JSON body
      const base64Data = req.body?.image || req.body?.base64;
      if (typeof base64Data === 'string' && base64Data.startsWith('data:image/')) {
        const matches = base64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches) {
          const rawExt = matches[1].toLowerCase() === 'jpeg' ? 'jpg' : matches[1].toLowerCase();
          const ext = ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(`.${rawExt}`) ? `.${rawExt}` : '.jpg';
          const filename = `prod-${Date.now()}-${uuidv4().slice(0, 8)}${ext}`;
          const filePath = path.join(uploadDir, filename);
          const buffer = Buffer.from(matches[2], 'base64');

          fs.writeFileSync(filePath, buffer);

          const protocol = req.protocol || 'http';
          const host = req.get('host') || 'localhost:5000';
          const url = `${protocol}://${host}/uploads/${filename}`;
          const relativeUrl = `/uploads/${filename}`;

          res.status(200).json({
            success: true,
            message: 'Product image uploaded successfully',
            data: {
              url,
              relativeUrl,
              filename,
            },
          });
          return;
        }
      }

      res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please select an image file to upload.',
      });
    } catch (error) {
      next(error);
    }
  };
}
