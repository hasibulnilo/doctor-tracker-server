import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined. Set it in the backend .env file.');
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
};
