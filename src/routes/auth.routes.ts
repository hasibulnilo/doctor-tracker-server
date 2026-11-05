import { Router } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserModel } from '../database/models.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'doctor-tracker-dev-secret';

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await UserModel.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' },
    );

    return res.status(201).json({
      accessToken,
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Login failed' });
  }
});

router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (_error) {
    return res.status(500).json({ message: 'Unable to fetch current user' });
  }
});

export default router;
