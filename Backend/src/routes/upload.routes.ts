import { Router } from 'express';

const router = Router();

router.get('/limits', (_req, res) => {
  res.json({
    maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 10),
    allowedExtensions: ['.pdf', '.docx', '.txt', '.zip']
  });
});

export default router;
