const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'grades.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    year INTEGER NOT NULL CHECK(year BETWEEN 1 AND 4),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    score REAL NOT NULL CHECK(score BETWEEN 0 AND 100),
    grade TEXT GENERATED ALWAYS AS (
      CASE
        WHEN score >= 95 THEN 'A+'
        WHEN score >= 90 THEN 'A'
        WHEN score >= 85 THEN 'B+'
        WHEN score >= 80 THEN 'B'
        WHEN score >= 75 THEN 'C+'
        WHEN score >= 70 THEN 'C'
        WHEN score >= 65 THEN 'D+'
        WHEN score >= 60 THEN 'D'
        ELSE 'F'
      END
    ) STORED,
    semester TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TRIGGER IF NOT EXISTS update_student_timestamp
  AFTER UPDATE ON students
  BEGIN
    UPDATE students SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
`);

// Insert sample data if tables are empty
const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get();
if (studentCount.count === 0) {
  const insertStudent = db.prepare(
    'INSERT INTO students (student_id, name, department, year) VALUES (?, ?, ?, ?)'
  );
  const insertGrade = db.prepare(
    'INSERT INTO grades (student_id, subject, score, semester) VALUES (?, ?, ?, ?)'
  );

  const insertSampleData = db.transaction(() => {
    const s1 = insertStudent.run('2022001', '김민준', '컴퓨터공학과', 3);
    const s2 = insertStudent.run('2022002', '이서연', '소프트웨어학과', 3);
    const s3 = insertStudent.run('2023001', '박지호', '정보보안학과', 2);
    const s4 = insertStudent.run('2021001', '최수아', '컴퓨터공학과', 4);
    const s5 = insertStudent.run('2024001', '정현우', '인공지능학과', 1);

    insertGrade.run(s1.lastInsertRowid, '데이터베이스', 88, '2024-1');
    insertGrade.run(s1.lastInsertRowid, '웹프로그래밍', 92, '2024-1');
    insertGrade.run(s1.lastInsertRowid, '알고리즘', 76, '2024-1');

    insertGrade.run(s2.lastInsertRowid, '데이터베이스', 95, '2024-1');
    insertGrade.run(s2.lastInsertRowid, '운영체제', 83, '2024-1');
    insertGrade.run(s2.lastInsertRowid, '자료구조', 91, '2024-1');

    insertGrade.run(s3.lastInsertRowid, '네트워크', 78, '2024-1');
    insertGrade.run(s3.lastInsertRowid, '데이터베이스', 65, '2024-1');

    insertGrade.run(s4.lastInsertRowid, '소프트웨어공학', 97, '2024-1');
    insertGrade.run(s4.lastInsertRowid, '머신러닝', 89, '2024-1');
    insertGrade.run(s4.lastInsertRowid, '웹프로그래밍', 93, '2024-1');

    insertGrade.run(s5.lastInsertRowid, '프로그래밍기초', 72, '2024-1');
    insertGrade.run(s5.lastInsertRowid, '수학', 68, '2024-1');
  });

  insertSampleData();
}

module.exports = db;
