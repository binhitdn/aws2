import multer from 'multer';
import { uploadToS3 } from '../../lib/aws'; // Hãy chắc chắn rằng bạn đã cấu hình AWS S3
import prisma from '../../lib/prisma'; // Giả sử bạn đã cấu hình Prisma

// Cấu hình multer để lưu trữ tạm thời trong bộ nhớ
const upload = multer({
  storage: multer.memoryStorage(),
});

// Handler cho Next.js API route
export const config = {
  api: {
    bodyParser: false, // Tắt bodyParser mặc định của Next.js để multer xử lý
  },
};

const handler = async (req, res) => {
  if (req.method === 'POST') {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error uploading file', error: err.message });
      }

      try {
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }

        // Upload file lên S3
        const fileUrl = await uploadToS3(req.file);

        // Lưu thông tin tài liệu vào cơ sở dữ liệu (dùng Prisma)
        const document = await prisma.document.create({
          data: {
            title: req.body.title,
            description: req.body.description,
            fileUrl: fileUrl,
            userId: req.body.userId, // Giả sử đã có thông tin người dùng
          },
        });

        res.status(200).json({ message: 'File uploaded successfully', document });
      } catch (error) {
        res.status(500).json({ message: 'Error uploading file', error: error.message });
      }
    });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
};

export default handler;
