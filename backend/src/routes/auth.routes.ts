import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/db.js';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as any;
  if (!user) {
    return res.status(401).json({ error: 'Invalid email credentials' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid password credentials' });
  }

  let institution = null;
  if (user.institution_id) {
    institution = db.prepare(`SELECT * FROM institutions WHERE id = ?`).get(user.institution_id);
  }

  let student = null;
  if (user.student_id) {
    student = db.prepare(`SELECT * FROM students WHERE id = ?`).get(user.student_id);
  }

  const tokenUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    institutionId: user.institution_id,
    studentId: user.student_id,
  };

  const token = generateToken(tokenUser);

  return res.json({
    token,
    user: {
      ...tokenUser,
      institution,
      student,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id) as any;
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let institution = null;
  if (user.institution_id) {
    institution = db.prepare(`SELECT * FROM institutions WHERE id = ?`).get(user.institution_id);
  }

  let student = null;
  if (user.student_id) {
    student = db.prepare(`SELECT * FROM students WHERE id = ?`).get(user.student_id);
  }

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      institutionId: user.institution_id,
      studentId: user.student_id,
      institution,
      student,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/demo-accounts
router.get('/demo-accounts', (req: Request, res: Response) => {
  return res.json([
    {
      role: 'AICTE_ADMIN',
      name: 'Dr. Ramesh Chandra',
      designation: 'AICTE Regulatory Director',
      email: 'aicte.admin@aicte-india.org',
      password: 'admin123',
      description: 'National overview, institutional intake audits, anomaly intelligence, conflict network, regulatory AI copilot.',
    },
    {
      role: 'INSTITUTION_ADMIN',
      name: 'Prof. Subhasis Banerjee',
      designation: 'Registrar, Tech Institute of Technology, Kolkata (College A)',
      email: 'admin@tit-kolkata.edu.in',
      password: 'admin123',
      description: 'College A dashboard, 500 student records, CSE intake violation alert, Smart bulk upload wizard, admission simulator.',
    },
    {
      role: 'INSTITUTION_ADMIN',
      name: 'Dr. Radhakrishnan Nair',
      designation: 'Dean Admissions, Apex National Engineering College, Bengaluru (College B)',
      email: 'admin@apex-bengaluru.edu.in',
      password: 'admin123',
      description: 'College B dashboard, transfer verification case, cross-institution conflict resolution.',
    },
    {
      role: 'STUDENT',
      name: 'Rahul Sharma',
      designation: 'Student (Transfer Conflict Case)',
      email: 'rahul.sharma@student.apaar.gov.in',
      password: 'student123',
      description: 'Dual-college active enrolment conflict, student record correction request workflow.',
    },
    {
      role: 'STUDENT',
      name: 'Priya Das',
      designation: 'Student (Verifiable Credential & Privacy)',
      email: 'priya.das@student.apaar.gov.in',
      password: 'student123',
      description: 'Smart Digital Enrolment Passport, cryptographic QR verification, third-party consent dashboard.',
    },
  ]);
});

export default router;
