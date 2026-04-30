# web2
# 학생 성적 관리 시스템 (Student Grade Management System)

데이터베이스 프로그래밍 프로젝트 — Node.js + SQLite를 활용한 학생 성적 관리 웹 애플리케이션

## 📋 프로젝트 개요

학생 성적을 등록·조회·수정·삭제(CRUD)할 수 있는 웹 기반 관리 시스템입니다.

## 🛠️ 기술 스택

| 구분 | 기술 |
|------|------|
| 백엔드 | Node.js, Express.js |
| 데이터베이스 | SQLite (better-sqlite3) |
| 프론트엔드 | HTML5, CSS3, Vanilla JavaScript |
| API 방식 | RESTful API |

## 🗄️ 데이터베이스 설계

### students 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | 자동 증가 기본키 |
| student_id | TEXT UNIQUE | 학번 |
| name | TEXT | 학생 이름 |
| department | TEXT | 학과 |
| year | INTEGER | 학년 (1~4) |
| created_at | DATETIME | 등록일시 |
| updated_at | DATETIME | 수정일시 |

### grades 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | 자동 증가 기본키 |
| student_id | INTEGER FK | 학생 ID (외래키) |
| subject | TEXT | 과목명 |
| score | REAL | 점수 (0~100) |
| grade | TEXT GENERATED | 등급 (자동 계산) |
| semester | TEXT | 학기 |
| created_at | DATETIME | 등록일시 |

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 서버 실행
npm start

# 개발 모드 (파일 변경 시 자동 재시작)
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 📡 API 명세

### Students API

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/students` | 전체 학생 목록 조회 (검색/필터 지원) |
| GET | `/api/students/:id` | 특정 학생 조회 |
| POST | `/api/students` | 학생 추가 |
| PUT | `/api/students/:id` | 학생 정보 수정 |
| DELETE | `/api/students/:id` | 학생 삭제 |

### Grades API

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/grades/student/:studentId` | 학생 성적 조회 |
| POST | `/api/grades` | 성적 추가 |
| PUT | `/api/grades/:id` | 성적 수정 |
| DELETE | `/api/grades/:id` | 성적 삭제 |
| GET | `/api/grades/stats/summary` | 통계 조회 |

## ✨ 주요 기능

- **학생 관리**: 학생 추가, 수정, 삭제, 검색, 학과/학년 필터
- **성적 관리**: 과목별 성적 추가, 수정, 삭제
- **자동 등급 계산**: 점수에 따라 A+~F 자동 산출
- **통계 대시보드**: 성적 분포, 우수 학생 Top 5, 과목별 평균
- **샘플 데이터**: 서버 시작 시 자동 삽입

## 📊 등급 기준

| 점수 | 등급 |
|------|------|
| 95 이상 | A+ |
| 90 이상 | A |
| 85 이상 | B+ |
| 80 이상 | B |
| 75 이상 | C+ |
| 70 이상 | C |
| 65 이상 | D+ |
| 60 이상 | D |
| 60 미만 | F |
