// pages/api/documents/[id].js
import  prisma  from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      const deletedDoc = await prisma.document.delete({
        where: { id: parseInt(id) },
      });
      return res.status(200).json({ message: 'Document deleted successfully', deletedDoc });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting document', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
