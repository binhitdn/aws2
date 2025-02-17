import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = 'ap-southeast-1'; // Hardcode luôn region

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async (file) => {
  const key = `uploads/${Date.now()}-${file.originalname}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME, // Sử dụng biến môi trường cho Bucket
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);
    // Trả về file key thay vì full URL
    return key;
  } catch (error) {
    throw new Error(`Lỗi khi tải lên S3: ${error.message}`);
  }
};


export async function getS3FileUrl(fileKey) {
  if (!fileKey) {
    throw new Error('Invalid fileKey');
  }

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME, // Sử dụng cùng biến môi trường với upload
    Key: fileKey,
  };

  const command = new GetObjectCommand(params);
  return await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL có hiệu lực trong 1 giờ
}
