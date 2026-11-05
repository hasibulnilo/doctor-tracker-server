import { Router } from 'express';
import { DoctorModel, PatientModel } from '../database/models.js';
import { authenticate } from '../middleware/auth.js';
import { buildPagination } from '../utils/pagination.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { page, limit } = buildPagination(req);
    const filter: any = {};

    if (req.query.search) {
      filter.$or = ['name', 'specialization', 'hospital', 'email', 'phone'].map((key) => ({
        [key]: { $regex: String(req.query.search), $options: 'i' },
      }));
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

router.post('/', authenticate, async (req, res) => {
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

router.get('/:id', authenticate, async (req, res) => {
  try {
    const doctor = await DoctorModel.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    return res.json(doctor);
  } catch (_error) {
    return res.status(400).json({ message: 'Invalid doctor id' });
  }
});

router.get('/:id/patients', authenticate, async (req, res) => {
  try {
    const { page, limit } = buildPagination(req);
    const doctor = await DoctorModel.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const [data, total] = await Promise.all([
      PatientModel.find({ doctor: req.params.id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      PatientModel.countDocuments({ doctor: req.params.id }),
    ]);

    return res.json({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to fetch doctor patients' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.email) {
      update.email = String(update.email).trim().toLowerCase();
    }

    const doctor = await DoctorModel.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    return res.json(doctor);
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to update doctor' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const doctor = await DoctorModel.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    await PatientModel.deleteMany({ doctor: req.params.id });
    return res.json({ message: 'Doctor and associated patients deleted' });
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to delete doctor' });
  }
});

export default router;
