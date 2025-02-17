import multer from 'multer';
import { uploadToS3 } from '../../../lib/aws';
import prisma from '../../../lib/prisma';

// Cấu hình multer để lưu file trong bộ nhớ
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware xử lý file upload
const uploadMiddleware = upload.single('file');

export const config = {
  api: {
    bodyParser: false, // Tắt bodyParser mặc định
  },
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Bọc multer bằng Promise để tránh lỗi callback
    await new Promise((resolve, reject) => {
      uploadMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload file lên S3 và nhận được file key
    const fileKey = await uploadToS3(req.file);

    // Kiểm tra req.body có được parse đúng không
    if (!req.body.title || !req.body.description || !req.body.userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Lưu thông tin tài liệu vào database (Prisma) với fileUrl là file key
    const document = await prisma.document.create({
      data: {
        title: req.body.title,
        description: req.body.description,
        fileUrl: fileKey, // Lưu key (ví dụ: uploads/1739766353197-BÃ¹i Minh Äá»©c_Äa ná»n táº£ng.docx)
        userId: parseInt(req.body.userId, 10),
      },
    });

    res.status(200).json({ message: 'File uploaded successfully', document });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
};

export default handler;
