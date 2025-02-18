import multer from 'multer';
import { uploadToS3 } from '../../../lib/aws';
import prisma from '../../../lib/prisma';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadMiddleware = upload.single('file');

export const config = {
  api: {
    bodyParser: false, 
  },
};

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await new Promise((resolve, reject) => {
      uploadMiddleware(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileKey = await uploadToS3(req.file);

    if (!req.body.title || !req.body.description || !req.body.userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const document = await prisma.document.create({
      data: {
        title: req.body.title,
        description: req.body.description,
        fileUrl: fileKey,
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
