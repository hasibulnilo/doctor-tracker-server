import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserSchema } from '../database/schemas/user.schema.js';

const UserModel: mongoose.Model<any> = (mongoose.models.User as mongoose.Model<any>) ?? mongoose.model('User', UserSchema);

async function seed() {
  const mongoUri = process.env.MONGODB_URI;
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD?.trim();

  if (!mongoUri) throw new Error('Set MONGODB_URI in .env before seeding.');
  if (!email || !password || password.length < 12) {
    throw new Error('Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 12 characters in .env');
  }

  await mongoose.connect(mongoUri);
  const adminName = process.env.SEED_ADMIN_NAME?.trim() || 'Doctor Tracker Admin';
  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await UserModel.findOneAndUpdate(
    { email },
    {
      $set: {
        name: adminName,
        email,
        password: hashedPassword,
        role: 'admin',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`Admin ready: ${admin?.email || email}`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
