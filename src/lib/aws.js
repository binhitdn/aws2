// lib/aws.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const region = 'ap-southeast-1'; // Hardcode luôn region

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const uploadToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `uploads/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${region}.amazonaws.com/${params.Key}`;
  } catch (error) {
    throw new Error(`Lỗi khi tải lên S3: ${error.message}`);
  }
};
