import { Router } from 'express';
import { DoctorModel, PatientModel } from '../database/models';
import { authenticate } from '../middleware/auth';
import { buildPagination } from '../utils/pagination';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { page, limit } = buildPagination(req);
    const filter: any = {};

    if (req.query.search) {
      filter.$or = ['name', 'phone', 'condition'].map((key) => ({
        [key]: { $regex: String(req.query.search), $options: 'i' },
      }));
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

router.post('/', authenticate, async (req, res) => {
  try {
    const doctorId = String(req.body?.doctorId || '');
    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

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

router.get('/:id', authenticate, async (req, res) => {
  try {
    const patient = await PatientModel.findById(req.params.id).populate('doctor', 'name specialization');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.json(patient);
  } catch (_error) {
    return res.status(400).json({ message: 'Invalid patient id' });
  }
});

router.patch('/:id', authenticate, async (req, res) => {
  try {
    const update: any = { ...req.body };

    if (update.doctorId) {
      const doctor = await DoctorModel.findById(update.doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      update.doctor = update.doctorId;
      delete update.doctorId;
    }

    const patient = await PatientModel.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate('doctor', 'name specialization');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.json(patient);
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to update patient' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const patient = await PatientModel.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.json({ message: 'Patient deleted' });
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : 'Unable to delete patient' });
  }
});

export default router;
