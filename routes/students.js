const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all students with average grade
router.get('/', (req, res) => {
  try {
    const { search, department, year } = req.query;
    let query = `
      SELECT s.*,
        ROUND(AVG(g.score), 2) as avg_score,
        COUNT(g.id) as subject_count
      FROM students s
      LEFT JOIN grades g ON s.id = g.student_id
    `;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push("(s.name LIKE ? OR s.student_id LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (department) {
      conditions.push("s.department = ?");
      params.push(department);
    }
    if (year) {
      conditions.push("s.year = ?");
      params.push(year);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' GROUP BY s.id ORDER BY s.student_id';

    const students = db.prepare(query).all(...params);
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single student
router.get('/:id', (req, res) => {
  try {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: '학생을 찾을 수 없습니다.' });
    const grades = db.prepare('SELECT * FROM grades WHERE student_id = ? ORDER BY semester, subject').all(req.params.id);
    res.json({ success: true, data: { ...student, grades } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create student
router.post('/', (req, res) => {
  try {
    const { student_id, name, department, year } = req.body;
    if (!student_id || !name || !department || !year) {
      return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
    }
    const result = db.prepare(
      'INSERT INTO students (student_id, name, department, year) VALUES (?, ?, ?, ?)'
    ).run(student_id, name, department, parseInt(year));
    const newStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newStudent, message: '학생이 추가되었습니다.' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: '이미 존재하는 학번입니다.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update student
router.put('/:id', (req, res) => {
  try {
    const { student_id, name, department, year } = req.body;
    if (!student_id || !name || !department || !year) {
      return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
    }
    const result = db.prepare(
      'UPDATE students SET student_id = ?, name = ?, department = ?, year = ? WHERE id = ?'
    ).run(student_id, name, department, parseInt(year), req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: '학생을 찾을 수 없습니다.' });
    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated, message: '학생 정보가 수정되었습니다.' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: '이미 존재하는 학번입니다.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE student
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: '학생을 찾을 수 없습니다.' });
    res.json({ success: true, message: '학생이 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
