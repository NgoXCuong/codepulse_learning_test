import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import pool from './config/db.js';

import courseRoutes from './routes/courseRoutes.js';
import chapterRoutes from './routes/chapterRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import lessonContentRoutes from './routes/lessonContentRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';

// Cấu hình đường dẫn cho ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// --- 2. API Routes ---
app.use('/api/courses', courseRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/contents', lessonContentRoutes);
app.use('/api/exercises', exerciseRoutes);

// --- 3. Xử lý lỗi tập trung (Error Handling) ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('🔥 Lỗi hệ thống:', err.stack);
    res.status(500).send('Có lỗi xảy ra, vui lòng thử lại sau!');
});

// --- 4. Khởi động Server ---
app.listen(PORT, () => {
    console.log(`
    🚀 CodePulse Backend is running!
    -----------------------------------------
    🏠 Admin: http://localhost:${PORT}
    🏠 Client:  http://localhost:${PORT}/home.html
    -----------------------------------------
    `);
});