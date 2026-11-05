import 'dotenv/config';
const express = require('express');
const cors = require('cors');
const mongoose: any = require('mongoose');
const bcrypt: any = require('bcrypt');
const jwt: any = require('jsonwebtoken');
import type { Request, Response, NextFunction } from 'express';
import { DoctorSchema } from './database/schemas/doctor.schema';
import { PatientSchema } from './database/schemas/patient.schema';
import { UserSchema } from './database/schemas/user.schema';

const app = express();
const port = Number(process.env.PORT || 5000);
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'doctor-tracker-dev-secret';

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
const DoctorModel = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
const PatientModel = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { sub?: string; email?: string; role?: string };
    (req as any).user = { userId: decoded.sub || '', email: decoded.email || '', role: decoded.role || 'admin' };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const buildPagination = (req: Request) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  return { page, limit };
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'doctor-tracker-api' });
});

app.post('/api/auth/login', async (req, res) => {
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

    const accessToken = jwt.sign({ sub: user._id.toString(), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    return res.status(201).json({
      accessToken,
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Login failed' });
  }
});

app.get('/api/auth/me', authenticate, async (req: any, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch current user' });
  }
});

app.get('/api/doctors', authenticate, async (req, res) => {
  try {
    const { page, limit } = buildPagination(req);
    const filter: any = {};

    if (req.query.search) {
      filter.$or = ['name', 'specialization', 'hospital', 'email', 'phone'].map((key) => ({ [key]: { $regex: String(req.query.search), $options: 'i' } }));
    }
    if (req.query.specialization) {
      filter.specialization = { $regex: String(req.query.specialization), $options: 'i' };
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {
        ...(req.query.from ? { $gte: new Date(String(req.query.from)) } : {}),
        ...(req.query.to ? { $lte: new Date(String(req.query.to)) } : {}),
      };
    }

    const [data, total] = await Promise.all([
      DoctorModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      DoctorModel.countDocuments(filter),
    ]);

    return res.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to fetch doctors' });
  }
});

app.post('/api/doctors', authenticate, async (req, res) => {
  try {
    const payload = {
      name: String(req.body?.name || '').trim(),
      specialization: String(req.body?.specialization || '').trim(),
      hospital: String(req.body?.hospital || '').trim(),
      phone: String(req.body?.phone || '').trim(),
      email: String(req.body?.email || '').trim().toLowerCase(),
    };

    if (!payload.name || !payload.specialization || !payload.hospital || !payload.phone || !payload.email) {
      return res.status(400).json({ message: 'All doctor fields are required' });
    }

    const doctor = await DoctorModel.create(payload);
    return res.status(201).json(doctor);
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to create doctor' });
  }
});

app.get('/api/doctors/:id', authenticate, async (req, res) => {
  try {
    const doctor = await DoctorModel.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    return res.json(doctor);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid doctor id' });
  }
});

app.get('/api/doctors/:id/patients', authenticate, async (req, res) => {
  try {
    const { page, limit } = buildPagination(req);
    const doctor = await DoctorModel.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const [data, total] = await Promise.all([
      PatientModel.find({ doctor: req.params.id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      PatientModel.countDocuments({ doctor: req.params.id }),
    ]);

    return res.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return res.status(400).json({ message: 'Unable to fetch doctor patients' });
  }
});

app.patch('/api/doctors/:id', authenticate, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.email) update.email = String(update.email).trim().toLowerCase();
    const doctor = await DoctorModel.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    return res.json(doctor);
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to update doctor' });
  }
});

app.delete('/api/doctors/:id', authenticate, async (req, res) => {
  try {
    const doctor = await DoctorModel.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    await PatientModel.deleteMany({ doctor: req.params.id });
    return res.json({ message: 'Doctor and associated patients deleted' });
  } catch (error) {
    return res.status(400).json({ message: 'Unable to delete doctor' });
  }
});

app.get('/api/patients', authenticate, async (req, res) => {
  try {
    const { page, limit } = buildPagination(req);
    const filter: any = {};

    if (req.query.search) {
      filter.$or = ['name', 'phone', 'condition'].map((key) => ({ [key]: { $regex: String(req.query.search), $options: 'i' } }));
    }
    if (req.query.condition) {
      filter.condition = { $regex: String(req.query.condition), $options: 'i' };
    }
    if (req.query.doctorId) {
      filter.doctor = req.query.doctorId;
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {
        ...(req.query.from ? { $gte: new Date(String(req.query.from)) } : {}),
        ...(req.query.to ? { $lte: new Date(String(req.query.to)) } : {}),
      };
    }

    const [data, total] = await Promise.all([
      PatientModel.find(filter).populate('doctor', 'name specialization').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      PatientModel.countDocuments(filter),
    ]);

    return res.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to fetch patients' });
  }
});

app.post('/api/patients', authenticate, async (req, res) => {
  try {
    const doctorId = String(req.body?.doctorId || '');
    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const payload = {
      name: String(req.body?.name || '').trim(),
      age: Number(req.body?.age),
      gender: String(req.body?.gender || 'male'),
      phone: String(req.body?.phone || '').trim(),
      condition: String(req.body?.condition || '').trim(),
      doctor: doctorId,
    };

    if (!payload.name || !payload.phone || !payload.condition || Number.isNaN(payload.age) || payload.age < 0) {
      return res.status(400).json({ message: 'Patient name, phone, condition, age and doctor are required' });
    }

    const patient = await PatientModel.create(payload);
    return res.status(201).json(patient);
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to create patient' });
  }
});

app.get('/api/patients/:id', authenticate, async (req, res) => {
  try {
    const patient = await PatientModel.findById(req.params.id).populate('doctor', 'name specialization');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    return res.json(patient);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid patient id' });
  }
});

app.patch('/api/patients/:id', authenticate, async (req, res) => {
  try {
    const update: any = { ...req.body };

    if (update.doctorId) {
      const doctor = await DoctorModel.findById(update.doctorId);
      if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
      update.doctor = update.doctorId;
      delete update.doctorId;
    }

    const patient = await PatientModel.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).populate('doctor', 'name specialization');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    return res.json(patient);
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to update patient' });
  }
});

app.delete('/api/patients/:id', authenticate, async (req, res) => {
  try {
    const patient = await PatientModel.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    return res.json({ message: 'Patient deleted' });
  } catch (error) {
    return res.status(400).json({ message: 'Unable to delete patient' });
  }
});

app.get('/api/dashboard', authenticate, async (_req, res) => {
  try {
    const [totalDoctors, totalPatients, patientsPerDoctor, monthlyPatients] = await Promise.all([
      DoctorModel.countDocuments(),
      PatientModel.countDocuments(),
      PatientModel.aggregate([
        { $group: { _id: '$doctor', count: { $sum: 1 } } },
        { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctor' } },
        { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, doctorId: '$_id', doctorName: '$doctor.name', patients: '$count' } },
        { $sort: { patients: -1 } },
        { $limit: 10 },
      ]),
      PatientModel.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
    ]);

    return res.json({ totalDoctors, totalPatients, patientsPerDoctor, monthlyPatients });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Dashboard unavailable' });
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ message: error?.message || 'Internal server error' });
});

const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined. Set it in the backend .env file.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    app.listen(port, () => {
      console.log(`Doctor Tracker API running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
