const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all grades for a student
router.get('/student/:studentId', (req, res) => {
  try {
    const grades = db.prepare(
      'SELECT * FROM grades WHERE student_id = ? ORDER BY semester, subject'
    ).all(req.params.studentId);
    res.json({ success: true, data: grades });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add grade
router.post('/', (req, res) => {
  try {
    const { student_id, subject, score, semester } = req.body;
    if (!student_id || !subject || score === undefined || !semester) {
      return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
    }
    if (score < 0 || score > 100) {
      return res.status(400).json({ success: false, message: '점수는 0~100 사이여야 합니다.' });
    }
    const student = db.prepare('SELECT id FROM students WHERE id = ?').get(student_id);
    if (!student) return res.status(404).json({ success: false, message: '학생을 찾을 수 없습니다.' });

    const result = db.prepare(
      'INSERT INTO grades (student_id, subject, score, semester) VALUES (?, ?, ?, ?)'
    ).run(student_id, subject, parseFloat(score), semester);
    const newGrade = db.prepare('SELECT * FROM grades WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newGrade, message: '성적이 추가되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update grade
router.put('/:id', (req, res) => {
  try {
    const { subject, score, semester } = req.body;
    if (!subject || score === undefined || !semester) {
      return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
    }
    if (score < 0 || score > 100) {
      return res.status(400).json({ success: false, message: '점수는 0~100 사이여야 합니다.' });
    }
    const result = db.prepare(
      'UPDATE grades SET subject = ?, score = ?, semester = ? WHERE id = ?'
    ).run(subject, parseFloat(score), semester, req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: '성적을 찾을 수 없습니다.' });
    const updated = db.prepare('SELECT * FROM grades WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated, message: '성적이 수정되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE grade
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM grades WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: '성적을 찾을 수 없습니다.' });
    res.json({ success: true, message: '성적이 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET statistics
router.get('/stats/summary', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(DISTINCT s.id) as total_students,
        COUNT(g.id) as total_grades,
        ROUND(AVG(g.score), 2) as overall_avg,
        MAX(g.score) as highest_score,
        MIN(g.score) as lowest_score
      FROM students s
      LEFT JOIN grades g ON s.id = g.student_id
    `).get();

    const gradeDistribution = db.prepare(`
      SELECT grade, COUNT(*) as count
      FROM grades
      GROUP BY grade
      ORDER BY grade
    `).all();

    const topStudents = db.prepare(`
      SELECT s.name, s.student_id, s.department,
        ROUND(AVG(g.score), 2) as avg_score
      FROM students s
      JOIN grades g ON s.id = g.student_id
      GROUP BY s.id
      ORDER BY avg_score DESC
      LIMIT 5
    `).all();

    const subjectAverages = db.prepare(`
      SELECT subject, ROUND(AVG(score), 2) as avg_score, COUNT(*) as count
      FROM grades
      GROUP BY subject
      ORDER BY avg_score DESC
    `).all();

    res.json({
      success: true,
      data: { stats, gradeDistribution, topStudents, subjectAverages }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
