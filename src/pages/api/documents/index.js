// pages/api/documents/index.js
import prisma  from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const documents = await prisma.document.findMany({
        include: { user: true },
      });
      return res.status(200).json(documents);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching documents', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
