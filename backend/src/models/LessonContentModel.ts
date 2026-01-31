import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/db.js';

export interface LessonContent {
    content_id?: number;
    lesson_id: number;
    content_type: 'theory' | 'code';
    content_order?: number; // Optional now, auto-calculated if missing
    content_title?: string;
    body: string;
    code_language?: string;
    code_explanation?: string;
    created_at?: Date;
}

export const getContentByLessonId = async (lessonId: number): Promise<LessonContent[]> => {
    const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM lesson_contents WHERE lesson_id = ? ORDER BY content_order ASC',
        [lessonId]
    );
    return rows as LessonContent[];
};

export const createContent = async (content: LessonContent): Promise<number> => {
    const { lesson_id, content_type, content_title, body, code_language, code_explanation } = content;

    // Auto-calculate order if not provided
    let order = content.content_order;
    if (!order) {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT MAX(content_order) as maxOrder FROM lesson_contents WHERE lesson_id = ?',
            [lesson_id]
        );
        order = (rows[0]?.maxOrder || 0) + 1;
    }

    const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO lesson_contents (lesson_id, content_type, content_order, content_title, body, code_language, code_explanation) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [lesson_id, content_type, order, content_title, body, code_language, code_explanation]
    );
    return result.insertId;
};

export const reorderContents = async (lessonId: number, contentIds: number[]): Promise<boolean> => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (let i = 0; i < contentIds.length; i++) {
            await connection.query(
                'UPDATE lesson_contents SET content_order = ? WHERE content_id = ? AND lesson_id = ?',
                [i + 1, contentIds[i], lessonId]
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

export const updateContent = async (id: number, content: Partial<LessonContent>): Promise<boolean> => {
    const fields = [];
    const values = [];

    if (content.content_type) { fields.push('content_type = ?'); values.push(content.content_type); }
    if (content.content_order) { fields.push('content_order = ?'); values.push(content.content_order); }
    if (content.content_title !== undefined) { fields.push('content_title = ?'); values.push(content.content_title); }
    if (content.body) { fields.push('body = ?'); values.push(content.body); }
    if (content.code_language !== undefined) { fields.push('code_language = ?'); values.push(content.code_language); }
    if (content.code_explanation !== undefined) { fields.push('code_explanation = ?'); values.push(content.code_explanation); }

    if (fields.length === 0) return false;

    values.push(id);
    const sql = `UPDATE lesson_contents SET ${fields.join(', ')} WHERE content_id = ?`;

    const [result] = await pool.query<ResultSetHeader>(sql, values);
    return result.affectedRows > 0;
};

export const deleteContent = async (id: number): Promise<boolean> => {
    const [result] = await pool.query<ResultSetHeader>('DELETE FROM lesson_contents WHERE content_id = ?', [id]);
    return result.affectedRows > 0;
};
