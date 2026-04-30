// State
let students = [];
let currentStudentId = null;
let editingStudent = null;
let editingGradeId = null;

// DOM helpers
const $ = id => document.getElementById(id);
const toast = (msg, type = 'success') => {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${msg}`;
  $('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
};

// API helper
async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  return res.json();
}

// Tab navigation
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  $(`section-${name}`).classList.add('active');
  document.querySelector(`[data-tab="${name}"]`).classList.add('active');
  if (name === 'students') loadStudents();
  if (name === 'stats') loadStats();
}

// ─── STUDENTS ────────────────────────────────────────────────────────────────

async function loadStudents() {
  const search = $('search-input').value.trim();
  const dept = $('filter-dept').value;
  const year = $('filter-year').value;

  let url = '/api/students?';
  if (search) url += `search=${encodeURIComponent(search)}&`;
  if (dept) url += `department=${encodeURIComponent(dept)}&`;
  if (year) url += `year=${year}&`;

  const res = await api(url);
  if (!res.success) return toast(res.message, 'error');
  students = res.data;
  renderStudentTable(students);
}

function renderStudentTable(data) {
  const tbody = $('student-tbody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">📋</div><p>등록된 학생이 없습니다.</p><button class="btn btn-primary" onclick="openAddStudentModal()">+ 학생 추가</button></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(s => `
    <tr>
      <td><strong>${s.student_id}</strong></td>
      <td>${s.name}</td>
      <td>${s.department}</td>
      <td><span class="badge badge-info">${s.year}학년</span></td>
      <td>${s.avg_score != null ? `<strong>${s.avg_score}</strong>` : '<span style="color:var(--text-muted)">-</span>'}</td>
      <td>${s.subject_count}과목</td>
      <td style="display:flex;gap:.4rem;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm" onclick="openGradesModal(${s.id}, '${escHtml(s.name)}')">📊 성적</button>
        <button class="btn btn-primary btn-sm" onclick="openEditStudentModal(${s.id})">✏️ 수정</button>
        <button class="btn btn-danger btn-sm" onclick="deleteStudent(${s.id}, '${escHtml(s.name)}')">🗑️ 삭제</button>
      </td>
    </tr>
  `).join('');
}

function escHtml(str) {
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// Add Student
function openAddStudentModal() {
  editingStudent = null;
  $('student-modal-title').textContent = '학생 추가';
  $('student-form').reset();
  openModal('student-modal');
}

async function openEditStudentModal(id) {
  const res = await api(`/api/students/${id}`);
  if (!res.success) return toast(res.message, 'error');
  editingStudent = res.data;
  $('student-modal-title').textContent = '학생 정보 수정';
  $('field-student-id').value = res.data.student_id;
  $('field-name').value = res.data.name;
  $('field-department').value = res.data.department;
  $('field-year').value = res.data.year;
  openModal('student-modal');
}

async function saveStudent() {
  const data = {
    student_id: $('field-student-id').value.trim(),
    name: $('field-name').value.trim(),
    department: $('field-department').value.trim(),
    year: $('field-year').value
  };
  if (!data.student_id || !data.name || !data.department || !data.year) {
    return toast('모든 필드를 입력해주세요.', 'error');
  }
  const res = editingStudent
    ? await api(`/api/students/${editingStudent.id}`, { method: 'PUT', body: data })
    : await api('/api/students', { method: 'POST', body: data });
  if (!res.success) return toast(res.message, 'error');
  toast(res.message);
  closeModal('student-modal');
  loadStudents();
}

async function deleteStudent(id, name) {
  if (!confirm(`"${name}" 학생을 삭제하시겠습니까?\n(모든 성적 정보도 함께 삭제됩니다.)`)) return;
  const res = await api(`/api/students/${id}`, { method: 'DELETE' });
  if (!res.success) return toast(res.message, 'error');
  toast(res.message);
  loadStudents();
}

// ─── GRADES ──────────────────────────────────────────────────────────────────

async function openGradesModal(studentId, studentName) {
  currentStudentId = studentId;
  $('grades-modal-title').textContent = `${studentName} 성적 관리`;
  $('grade-form').reset();
  $('grade-student-id').value = studentId;
  editingGradeId = null;
  await loadGradesForStudent(studentId);
  openModal('grades-modal');
}

async function loadGradesForStudent(studentId) {
  const res = await api(`/api/grades/student/${studentId}`);
  if (!res.success) return toast(res.message, 'error');
  renderGradesTable(res.data);
}

function renderGradesTable(grades) {
  const tbody = $('grades-tbody');
  if (!grades.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted)">등록된 성적이 없습니다.</td></tr>`;
    return;
  }
  tbody.innerHTML = grades.map(g => `
    <tr>
      <td>${g.subject}</td>
      <td><strong>${g.score}</strong></td>
      <td><span class="badge badge-${g.grade.replace('+','plus')}">${g.grade}</span></td>
      <td>${g.semester}</td>
      <td style="display:flex;gap:.4rem">
        <button class="btn btn-outline btn-sm" onclick="editGrade(${g.id},'${escHtml(g.subject)}',${g.score},'${g.semester}')">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteGrade(${g.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function editGrade(id, subject, score, semester) {
  editingGradeId = id;
  $('grade-subject').value = subject;
  $('grade-score').value = score;
  $('grade-semester').value = semester;
  $('save-grade-btn').textContent = '성적 수정';
  $('cancel-edit-grade-btn').style.display = '';
}

function cancelEditGrade() {
  editingGradeId = null;
  $('grade-form').reset();
  $('grade-student-id').value = currentStudentId;
  $('save-grade-btn').textContent = '성적 추가';
  $('cancel-edit-grade-btn').style.display = 'none';
}

async function saveGrade() {
  const subject = $('grade-subject').value.trim();
  const score = parseFloat($('grade-score').value);
  const semester = $('grade-semester').value.trim();
  if (!subject || isNaN(score) || !semester) return toast('모든 필드를 입력해주세요.', 'error');
  if (score < 0 || score > 100) return toast('점수는 0~100 사이여야 합니다.', 'error');

  const res = editingGradeId
    ? await api(`/api/grades/${editingGradeId}`, { method: 'PUT', body: { subject, score, semester } })
    : await api('/api/grades', { method: 'POST', body: { student_id: currentStudentId, subject, score, semester } });

  if (!res.success) return toast(res.message, 'error');
  toast(res.message);
  cancelEditGrade();
  loadGradesForStudent(currentStudentId);
}

async function deleteGrade(id) {
  if (!confirm('이 성적을 삭제하시겠습니까?')) return;
  const res = await api(`/api/grades/${id}`, { method: 'DELETE' });
  if (!res.success) return toast(res.message, 'error');
  toast(res.message);
  loadGradesForStudent(currentStudentId);
}

// ─── STATS ───────────────────────────────────────────────────────────────────

async function loadStats() {
  const res = await api('/api/grades/stats/summary');
  if (!res.success) return toast(res.message, 'error');
  const { stats, gradeDistribution, topStudents, subjectAverages } = res.data;

  $('stat-students').textContent = stats.total_students ?? 0;
  $('stat-grades').textContent = stats.total_grades ?? 0;
  $('stat-avg').textContent = stats.overall_avg ?? '-';
  $('stat-high').textContent = stats.highest_score ?? '-';

  // Grade distribution
  const maxCount = Math.max(...gradeDistribution.map(g => g.count), 1);
  const colors = { 'A+': '#059669', 'A': '#10b981', 'B+': '#3b82f6', 'B': '#60a5fa', 'C+': '#f59e0b', 'C': '#fbbf24', 'D+': '#ef4444', 'D': '#f87171', 'F': '#94a3b8' };
  $('grade-distribution').innerHTML = gradeDistribution.map(g => `
    <div class="grade-bar">
      <span class="label">${g.grade}</span>
      <div class="bar-wrap"><div class="bar" style="width:${(g.count/maxCount*100).toFixed(1)}%;background:${colors[g.grade]||'#94a3b8'}"></div></div>
      <span class="count">${g.count}</span>
    </div>
  `).join('');

  // Top students
  $('top-students').innerHTML = topStudents.length ? topStudents.map((s, i) => `
    <tr>
      <td><span class="badge" style="background:#fef3c7;color:#92400e">${i+1}위</span></td>
      <td><strong>${s.name}</strong></td>
      <td>${s.student_id}</td>
      <td>${s.department}</td>
      <td><strong style="color:var(--primary)">${s.avg_score}</strong></td>
    </tr>
  `).join('') : `<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">데이터 없음</td></tr>`;

  // Subject averages
  $('subject-averages').innerHTML = subjectAverages.length ? subjectAverages.map(s => `
    <tr>
      <td><strong>${s.subject}</strong></td>
      <td>${s.count}명</td>
      <td><strong>${s.avg_score}</strong></td>
    </tr>
  `).join('') : `<tr><td colspan="3" style="text-align:center;color:var(--text-muted)">데이터 없음</td></tr>`;
}

// ─── MODAL HELPERS ────────────────────────────────────────────────────────────

function openModal(id) {
  $(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  $(id).classList.remove('active');
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

// ─── INIT ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  showSection('students');

  // Search debounce
  let debounce;
  $('search-input').addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(loadStudents, 300);
  });
});
