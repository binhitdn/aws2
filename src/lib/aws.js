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


export async function getS3FileUrl(fileKey) {
  if (!fileKey) {
    throw new Error('Invalid fileKey');
  }

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileKey,
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 }); // URL có hiệu lực trong 1 giờ
}