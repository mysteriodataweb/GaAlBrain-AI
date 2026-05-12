import { randomBytes, randomUUID, timingSafeEqual, pbkdf2Sync } from 'crypto';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../db/database';
import { isMemoryMode } from '../config/runtime';
import { memoryStore } from '../db/memoryStore';
import { requireAuth, signAuthToken } from '../middleware/auth.middleware';
import { UserRole } from '../types';

const router = Router();
const useMemoryStore = () => isMemoryMode();
const getParamId = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['student', 'teacher', 'professional']).default('student')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name, email, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const id = randomUUID();

  if (useMemoryStore()) {
    const existing = memoryStore.usersByEmail.get(normalizedEmail);
    if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });

    const user = {
      id,
      name,
      email: normalizedEmail,
      role,
      password_hash: hashPassword(password),
      created_at: new Date().toISOString()
    };
    memoryStore.users.set(id, user);
    memoryStore.usersByEmail.set(normalizedEmail, user);

    const token = signAuthToken({ id, email: normalizedEmail, role });
    return res.status(201).json({ token, user: { id, name, email: normalizedEmail, role } });
  }

  try {
    await db.prepare('INSERT INTO users (id, name, email, role, password_hash) VALUES (?, ?, ?, ?, ?)').run(
      id,
      name,
      normalizedEmail,
      role,
      hashPassword(password)
    );

    const token = signAuthToken({ id, email: normalizedEmail, role });
    res.status(201).json({ token, user: { id, name, email: normalizedEmail, role } });
  } catch (error: any) {
    if (String(error.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (useMemoryStore()) {
    const user = memoryStore.usersByEmail.get(parsed.data.email.toLowerCase());
    if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = signAuthToken({ id: user.id, email: user.email, role: user.role as UserRole });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  }

  const user = await db
    .prepare('SELECT id, name, email, role, password_hash FROM users WHERE email = ?')
    .get(parsed.data.email.toLowerCase()) as any;

  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  const token = signAuthToken({ id: user.id, email: user.email, role: user.role as UserRole });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  if (useMemoryStore()) {
    const user = memoryStore.users.get(req.user!.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at } });
  }

  const user = await db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user!.id);
  res.json({ user });
});

router.get('/:id', async (req: Request, res: Response) => {
  const id = getParamId(req.params.id);
  if (!id) return res.status(400).json({ error: 'userId manquant' });

  if (useMemoryStore()) {
    const user = memoryStore.users.get(id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at } });
  }

  const user = await db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({ user });
});

router.post('/classes', requireAuth, async (req: Request, res: Response) => {
  if (useMemoryStore()) return res.status(501).json({ error: 'Classes indisponibles en mode NO_DB' });
  if (req.user!.role !== 'teacher') return res.status(403).json({ error: 'Rôle enseignant requis' });
  const parsed = z.object({ name: z.string().min(2) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const id = randomUUID();
  await db.prepare('INSERT INTO classes (id, teacher_id, name) VALUES (?, ?, ?)').run(id, req.user!.id, parsed.data.name);
  res.status(201).json({ id, name: parsed.data.name });
});

router.post('/classes/:classId/members', requireAuth, async (req: Request, res: Response) => {
  if (useMemoryStore()) return res.status(501).json({ error: 'Classes indisponibles en mode NO_DB' });
  const parsed = z.object({ studentId: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const cls = await db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.classId) as any;
  if (!cls) return res.status(404).json({ error: 'Classe introuvable' });
  if (cls.teacher_id !== req.user!.id) return res.status(403).json({ error: 'Accès refusé' });

  await db.prepare('INSERT IGNORE INTO class_members (class_id, student_id) VALUES (?, ?)').run(
    req.params.classId,
    parsed.data.studentId
  );
  res.status(201).json({ ok: true });
});

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = pbkdf2Sync(password, salt, 120000, 32, 'sha256');
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

export default router;
