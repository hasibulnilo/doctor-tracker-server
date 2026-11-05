import { Router } from 'express';
import { DoctorModel, PatientModel } from '../database/models';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  try {
    const [totalDoctors, totalPatients, monthlyPatients, patientCounts] = await Promise.all([
      DoctorModel.countDocuments(),
      PatientModel.countDocuments(),
      PatientModel.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
      PatientModel.aggregate([
        { $group: { _id: '$doctor', patients: { $sum: 1 } } },
        { $sort: { patients: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const doctorIds = patientCounts.map((item) => item._id).filter(Boolean);
    const doctorsById = doctorIds.length
      ? await DoctorModel.find({ _id: { $in: doctorIds } }, { name: 1 }).lean()
      : [];

    const doctorNameMap = new Map(doctorsById.map((doctor) => [String(doctor._id), doctor.name]));

    const patientsPerDoctor = patientCounts.map((item) => ({
      doctorId: String(item._id),
      doctorName: doctorNameMap.get(String(item._id)) || 'Unknown Doctor',
      patients: item.patients,
    }));

    return res.json({ totalDoctors, totalPatients, patientsPerDoctor, monthlyPatients });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Dashboard unavailable' });
  }
});

export default router;
