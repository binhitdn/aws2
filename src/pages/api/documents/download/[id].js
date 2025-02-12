import  prisma  from '../../../lib/prisma';
import { getS3FileUrl } from '../../../lib/aws'; // Tạo hàm để lấy URL tải về từ S3

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const document = await prisma.document.findUnique({
        where: { id: parseInt(id) },
      });

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const downloadUrl = getS3FileUrl(document.fileUrl);
      res.status(200).json({ downloadUrl });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching document for download', error: error.message });
    }
  }
}
