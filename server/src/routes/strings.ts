import { Router } from 'express';
import { pool, type ExerciseStringRow, type ExerciseTranslationRow } from '../db.js';
import {
  exerciseStringSchema,
  exerciseStringTranslationSchema,
  bulkStringImportSchema,
  type ExerciseStringPayload,
  type ExerciseStringTranslationPayload
} from '../utils/validation.js';
import { requireRole } from '../auth.js';

const router = Router();

/**
 * GET /api/strings
 * Get all exercise strings, optionally filtered by context
 */
router.get('/', async (req, res, next) => {
  try {
    const context = req.query.context as string | undefined;
    
    let query = 'SELECT * FROM exercise_strings';
    const params: string[] = [];
    
    if (context) {
      query += ' WHERE context = $1';
      params.push(context);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query<ExerciseStringRow>(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/strings/:id
 * Get a specific exercise string by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query<ExerciseStringRow>(
      'SELECT * FROM exercise_strings WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'String not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/strings
 * Create a new exercise string (requires partner or moderator role)
 */
router.post('/', requireRole('partner'), async (req, res, next) => {
  try {
    const payload = exerciseStringSchema.parse(req.body);
    
    const result = await pool.query<ExerciseStringRow>(
      `INSERT INTO exercise_strings (id, context, source_text, source_lang)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [payload.id, payload.context || null, payload.sourceText, payload.sourceLang]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/strings/:id/translations
 * Get all translations for a specific string
 */
router.get('/:id/translations', async (req, res, next) => {
  try {
    const { id } = req.params;
    const lang = req.query.lang as string | undefined;
    
    let query = 'SELECT * FROM exercise_translations WHERE string_id = $1';
    const params: string[] = [id];
    
    if (lang) {
      query += ' AND lang = $2';
      params.push(lang);
    }
    
    const result = await pool.query<ExerciseTranslationRow>(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/strings/:id/translations
 * Add or update a translation for a specific string (requires partner or moderator role)
 */
router.post('/:id/translations', requireRole('partner'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = exerciseStringTranslationSchema.parse({ ...req.body, stringId: id });
    
    // Check if string exists
    const stringCheck = await pool.query(
      'SELECT id FROM exercise_strings WHERE id = $1',
      [id]
    );
    
    if (stringCheck.rows.length === 0) {
      return res.status(404).json({ message: 'String not found' });
    }
    
    // Upsert translation
    const result = await pool.query<ExerciseTranslationRow>(
      `INSERT INTO exercise_translations (string_id, lang, translated_text, translation_method)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (string_id, lang) 
       DO UPDATE SET 
         translated_text = EXCLUDED.translated_text,
         translation_method = EXCLUDED.translation_method,
         updated_at = NOW()
       RETURNING *`,
      [payload.stringId, payload.lang, payload.translatedText, payload.translationMethod]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/strings/translations/:lang
 * Get all translations for a specific language
 */
router.get('/translations/:lang', async (req, res, next) => {
  try {
    const { lang } = req.params;
    
    if (!['en', 'de', 'es', 'nl'].includes(lang)) {
      return res.status(400).json({ message: 'Invalid language code' });
    }
    
    const result = await pool.query<ExerciseTranslationRow>(
      'SELECT * FROM exercise_translations WHERE lang = $1',
      [lang]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/strings/bulk
 * Bulk import strings and translations (requires moderator role)
 */
router.post('/bulk', requireRole('moderator'), async (req, res, next) => {
  try {
    const payload = bulkStringImportSchema.parse(req.body);
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert strings
      const insertedStrings: ExerciseStringRow[] = [];
      for (const stringData of payload.strings) {
        const result = await client.query<ExerciseStringRow>(
          `INSERT INTO exercise_strings (id, context, source_text, source_lang)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
             source_text = EXCLUDED.source_text,
             updated_at = NOW()
           RETURNING *`,
          [stringData.id, stringData.context || null, stringData.sourceText, stringData.sourceLang]
        );
        insertedStrings.push(result.rows[0]);
      }
      
      // Insert translations if provided
      const insertedTranslations: ExerciseTranslationRow[] = [];
      if (payload.translations) {
        for (const translation of payload.translations) {
          const result = await client.query<ExerciseTranslationRow>(
            `INSERT INTO exercise_translations (string_id, lang, translated_text, translation_method)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (string_id, lang) DO UPDATE SET
               translated_text = EXCLUDED.translated_text,
               translation_method = EXCLUDED.translation_method,
               updated_at = NOW()
             RETURNING *`,
            [translation.stringId, translation.lang, translation.translatedText, translation.translationMethod]
          );
          insertedTranslations.push(result.rows[0]);
        }
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        strings: insertedStrings,
        translations: insertedTranslations
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/strings/:id
 * Delete an exercise string and all its translations (requires moderator role)
 */
router.delete('/:id', requireRole('moderator'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM exercise_strings WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'String not found' });
    }
    
    res.json({ message: 'String and translations deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export const stringsRouter = router;
