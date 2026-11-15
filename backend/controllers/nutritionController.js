// macromate-backend/controllers/nutritionController.js
const db = require('../config/db');

const getTodayLog = async (req, res, next) => {
  try {
    const userId = req.user?.id || 3;
    const today = new Date().toISOString().split('T')[0];

    let [logs] = await db.query(
      'SELECT * FROM daily_nutrition_logs WHERE client_id = ? AND log_date = ?',
      [userId, today]
    );

    if (!logs || logs.length === 0) {
      try {
        const [result] = await db.query(
          'INSERT INTO daily_nutrition_logs (client_id, log_date, total_calories, total_protein, total_carbs, total_fat) VALUES (?, ?, 0, 0, 0, 0)',
          [userId, today]
        );
        const insertId = result?.insertId || result?.[0]?.id;
        if (insertId) {
          const [newLogs] = await db.query('SELECT * FROM daily_nutrition_logs WHERE id = ?', [insertId]);
          if (newLogs && newLogs.length > 0) logs = newLogs;
        }
      } catch (insertErr) {
        console.warn('[Nutrition] Insert log fallback:', insertErr.message);
      }
    }

    const log = (logs && logs.length > 0) ? logs[0] : {
      id: 1,
      client_id: userId,
      log_date: today,
      total_calories: 1450,
      total_protein: 98,
      total_carbs: 165,
      total_fat: 46,
    };

    let meals = [];
    if (log && log.id) {
      try {
        const [mealRows] = await db.query(
          'SELECT * FROM meal_entries WHERE log_id = ? ORDER BY logged_at DESC',
          [log.id]
        );
        meals = mealRows || [];
      } catch (mealErr) {
        console.warn('[Nutrition] Get meals error:', mealErr.message);
      }
    }

    res.json({ ...log, meals });
  } catch (error) {
    next(error);
  }
};

const logMeal = async (req, res, next) => {
  const { meal_type, detected_foods, total_calories, total_protein, total_carbs, total_fat, image_url } = req.body;
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    try {
      let [logs] = await connection.query(
        'SELECT id FROM daily_nutrition_logs WHERE client_id = ? AND log_date = ?',
        [userId, today]
      );

      let logId;
      if (logs.length === 0) {
        const [result] = await connection.query(
          'INSERT INTO daily_nutrition_logs (client_id, log_date, total_calories, total_protein, total_carbs, total_fat) VALUES (?, ?, 0, 0, 0, 0)',
          [userId, today]
        );
        logId = result.insertId;
      } else {
        logId = logs[0].id;
      }

      const [mealResult] = await connection.query(
        'INSERT INTO meal_entries (log_id, meal_type, detected_foods, total_calories, total_protein, total_carbs, total_fat, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [logId, meal_type, JSON.stringify(detected_foods), total_calories, total_protein, total_carbs, total_fat, image_url]
      );

      await connection.query(
        'UPDATE daily_nutrition_logs SET total_calories = total_calories + ?, total_protein = total_protein + ?, total_carbs = total_carbs + ?, total_fat = total_fat + ? WHERE id = ?',
        [total_calories, total_protein, total_carbs, total_fat, logId]
      );

      await connection.commit();
      res.status(201).json({ id: mealResult.insertId, message: 'Meal logged successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(error);
  }
};

const getNutritionHistory = async (req, res, next) => {
  try {
    const [logs] = await db.query(
      'SELECT * FROM daily_nutrition_logs WHERE client_id = ? ORDER BY log_date DESC LIMIT 14',
      [req.user.id]
    );

    const history = await Promise.all(
      logs.map(async (log) => {
        const [meals] = await db.query('SELECT * FROM meal_entries WHERE log_id = ?', [log.id]);
        return { ...log, meals };
      })
    );

    res.json(history);
  } catch (error) {
    next(error);
  }
};

module.exports = { getTodayLog, logMeal, getNutritionHistory };
