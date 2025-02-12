// pages/api/documents/upload.js
import { createRouter } from 'next-connect';
import multer from 'multer';
import { uploadToS3 } from '../../../lib/aws'; // Đảm bảo bạn đã cấu hình AWS S3
import prisma from '../../../lib/prisma'; // Đảm bảo bạn đã cấu hình Prisma

// Tắt body parser mặc định của Next.js để multer có thể xử lý
export const config = {
  api: {
    bodyParser: false,
  },
};

// Cấu hình multer để lưu trữ tạm thời trong bộ nhớ
const upload = multer({
  storage: multer.memoryStorage(),
});

// Tạo router với next-connect (phiên bản 1.0)
const router = createRouter();

// Sử dụng middleware multer để xử lý file upload
router.use(upload.single('file')); // 'file' là tên field trong form upload

// Định nghĩa phương thức POST


export default router.handler();
