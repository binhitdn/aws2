import prisma from '../../../../lib/prisma';
import { getS3FileUrl } from '../../../../lib/aws';

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
      const downloadUrl = await getS3FileUrl(document.fileUrl);
      res.status(200).json({ downloadUrl });
    } catch (error) {
      console.error('❌ Error generating download URL:', error);
      res.status(500).json({ message: 'Error fetching document', error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
