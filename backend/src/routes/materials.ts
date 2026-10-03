import { Router } from 'express';
import multer from 'multer';
import { getMaterials, uploadMaterial, downloadMaterial, deleteMaterial, getGroupMaterials } from '../controllers/materials';
import { authenticate } from '../middleware/auth';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../../uploads/materials');
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const filename = Date.now().toString(36) + '-' + Math.random().toString(36).substr(2) + path.extname(file.originalname);
    cb(null, filename);
  },
});

const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const fileFilter = (req: any, file: any, cb: any) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持上传PDF、Word和图片格式'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

const router = Router();

router.get('/', authenticate, getMaterials);
router.get('/group/:groupId', authenticate, getGroupMaterials);
router.post('/', authenticate, upload.single('file'), uploadMaterial);
router.get('/download/:id', authenticate, downloadMaterial);
router.delete('/:id', authenticate, deleteMaterial);

export default router;
