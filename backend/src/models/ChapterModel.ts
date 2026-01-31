import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/db.js';

export interface Chapter {
    chapter_id?: number;
    course_id: number;
    chapter_name: string;
    chapter_order?: number;
    created_at?: Date;
}

export const getChaptersByCourseId = async (courseId: number): Promise<Chapter[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM chapters WHERE course_id = ? ORDER BY chapter_order ASC',
        [courseId]
    );
    return rows as Chapter[];
};

export const createChapter = async (chapter: Chapter): Promise<number> => {
    const { course_id, chapter_name } = chapter;

    // Auto-calculate order if not provided
    let order = chapter.chapter_order;
    if (!order) {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT MAX(chapter_order) as maxOrder FROM chapters WHERE course_id = ?',
            [course_id]
        );
        order = (rows[0]?.maxOrder || 0) + 1;
    }

    const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO chapters (course_id, chapter_name, chapter_order) VALUES (?, ?, ?)',
        [course_id, chapter_name, order]
    );
    return result.insertId;
};

export const reorderChapters = async (courseId: number, chapterIds: number[]): Promise<boolean> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (let i = 0; i < chapterIds.length; i++) {
            await connection.query(
                'UPDATE chapters SET chapter_order = ? WHERE chapter_id = ? AND course_id = ?',
                [i + 1, chapterIds[i], courseId]
            );
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const updateChapter = async (id: number, chapter: Partial<Chapter>): Promise<boolean> => {
    const fields = [];
    const values = [];

    if (chapter.chapter_name) { fields.push('chapter_name = ?'); values.push(chapter.chapter_name); }
    if (chapter.chapter_order) { fields.push('chapter_order = ?'); values.push(chapter.chapter_order); }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE chapters SET ${fields.join(', ')} WHERE chapter_id = ?`;

    const [result] = await pool.query<ResultSetHeader>(sql, values);
    return result.affectedRows > 0;
};

export const deleteChapter = async (id: number): Promise<boolean> => {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM chapters WHERE chapter_id = ?', [id]);
    return result.affectedRows > 0;
};
