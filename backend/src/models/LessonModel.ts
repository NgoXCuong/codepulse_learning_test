import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/db.js';

export interface Lesson {
    lesson_id?: number;
    chapter_id: number;
    lesson_name: string;
    lesson_order?: number;
    created_at?: Date;
}

export const getLessonsByChapterId = async (chapterId: number): Promise<Lesson[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM lessons WHERE chapter_id = ? ORDER BY lesson_order ASC',
        [chapterId]
    );
    return rows as Lesson[];
};

export const createLesson = async (lesson: Lesson): Promise<number> => {
    const { chapter_id, lesson_name, lesson_order } = lesson;
    const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO lessons (chapter_id, lesson_name, lesson_order) VALUES (?, ?, ?)',
        [chapter_id, lesson_name, lesson_order || 1]
    );
    return result.insertId;
};

export const updateLesson = async (id: number, lesson: Partial<Lesson>): Promise<boolean> => {
    const fields = [];
    const values = [];

    if (lesson.lesson_name) { fields.push('lesson_name = ?'); values.push(lesson.lesson_name); }
    if (lesson.lesson_order) { fields.push('lesson_order = ?'); values.push(lesson.lesson_order); }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE lessons SET ${fields.join(', ')} WHERE lesson_id = ?`;

    const [result] = await pool.query<ResultSetHeader>(sql, values);
    return result.affectedRows > 0;
};

export const deleteLesson = async (id: number): Promise<boolean> => {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM lessons WHERE lesson_id = ?', [id]);
    return result.affectedRows > 0;
};
