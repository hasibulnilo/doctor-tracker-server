import { Router } from 'express';
import { DoctorModel, PatientModel } from '../database/models.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
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

export default router;
