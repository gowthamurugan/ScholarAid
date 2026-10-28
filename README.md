# ScholarAid: A Smart System for Scholarship Discovery and Application Support

**ScholarAid** is an enterprise-grade, responsive full-stack web application developed for scholarship discovery, deterministic eligibility evaluation, 5-point application readiness scoring, administrator review queue workflows, and targeted announcement broadcasting.

---

## 1. System Architecture & Tech Stack

- **Frontend:** React 18 (Vite, JavaScript, React Router 6, Lucide Icons)
- **Styling:** Custom CSS Design System (Accessible contrast, responsive breakpoints, cards, tables, badges, and modals)
- **Authentication:** Firebase Authentication (with fallback local session emulation for testing without live credentials)
- **Database:** Firebase Realtime Database with strict role-based access rules (`database.rules.json`)
- **Backend Server:** Node.js / Express server for protected Google Gemini AI discovery, web search grounding, and recipient calculation
- **Testing:** Vitest unit test suite covering 10 centralized eligibility cases and 8 readiness score cases
- **Hosting / Deployment:** Firebase Hosting ready (`firebase.json`)

---

## 2. Key Modules & Features

### A. Student Portal
1. **Secure Registration & Profile:** Captures GPA, Social Category, Degree Course, Family Annual Income, State Name, Department, Current Year, Income Certificate Issue Date, Aadhaar-Bank Seeding status, and Name consistency across documents.
2. **Approved Scholarships Directory:** Lists only administratively vetted scholarships. Evaluates real-time eligibility status on each card with detailed explanations for failing criteria or missing profile fields.
3. **Eligible Scholarships View:** Filtered view displaying only scholarships where the student meets 100% of the criteria according to the Centralized Eligibility Engine.
4. **5-Point Scholarship Readiness Score:** Evaluates profile completeness, certificate age against validity limits (e.g. 180 days), DBT bank linking, name match, and deadline currency. Returns advisory `Ready X/5` score with actionable remediation instructions.
5. **Direct Official Portal Navigation:** Safely opens authenticated external provider sites (e.g., National Scholarship Portal, State DCE) with `noopener,noreferrer`.
6. **Application Tracking:** Allows students to maintain self-reported statuses (`Eligible`, `Opened link`, `Submitted`) with mandatory disclaimer notices.
7. **Targeted Announcements & Notifications:** Real-time unread notification badge and announcements specifically matching the student's eligibility profile.

### B. Administrator Portal
1. **Dedicated Administrator Entry:** Protected `/admin/login` requiring verified administrative database privileges (prevents student self-escalation).
2. **AI-Assisted Discovery Workflow:** Queries Google Gemini 1.5/2.0 API via protected server endpoints to extract candidate scholarships directly into `Pending` status.
3. **Manual Entry Fallback:** Allows manual scholarship authoring if AI discovery or internet access is limited.
4. **Pending Candidate Review Queue:** Administrator audits candidate fields, inspects real-time **Student Eligibility Impact Counts**, edits criteria, and approves or rejects records.
5. **Scholarship Directory Management:** Oversees Approved and Rejected scholarships, updates criteria, and manages publication states.
6. **Targeted Announcements:** Evaluates student database with the Centralized Eligibility Engine and broadcasts notifications strictly to students who qualify.
7. **Application Status Monitoring:** Separate monitoring dashboard tracking student-reported application logs with summary metrics and filters.

---

## 3. Centralized Eligibility Engine

The application implements a single pure JavaScript function (`src/utils/eligibilityEngine.js`) used identically across:
- Student Approved Cards
- Eligible Scholarships Filter
- Administrator Eligibility Impact Counter
- Targeted Announcement Recipient Resolution

### Criteria Rules:
1. **GPA:** Student GPA $\ge$ Scholarship Minimum GPA.
2. **Category:** Student Category matches Scholarship Category (unless "Any").
3. **Course:** Student Course matches Scholarship Course (unless "Any").
4. **Family Income:** Student Annual Family Income $\le$ Scholarship Maximum Income.
5. **State:** Student State Name matches Scholarship State (unless "Any").

If any field is missing from the student profile, the engine outputs `Cannot determine eligibility` with the exact missing fields listed.

---

## 4. 5-Point Readiness Score

The readiness calculator (`src/utils/readinessCalculator.js`) assesses 5 distinct checks (1 point each $\to$ `Ready X/5`):
1. **Profile Completeness:** All 12 required academic, personal, and banking profile fields are present.
2. **Income Certificate Validity:** Certificate issue date is within scholarship-specific validity limit (e.g. $\le 180$ days).
3. **Bank Account Linked to Aadhaar:** Confirmed for Direct Benefit Transfer (DBT/NPCI seeded).
4. **Name Consistency:** Character-by-character match across academic certificates and identity cards.
5. **Active Deadline:** Scholarship closing date has not elapsed.

> **Advisory Disclaimer:** The readiness score is advisory. It is not an eligibility guarantee, document verification, application submission confirmation, or assurance of scholarship approval.

---

## 5. Getting Started & Installation

### Prerequisites
- Node.js (v18 or higher recommended; v20 LTS included)
- npm (v9 or higher)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd "S5 miniproject"

# Install dependencies
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` to configure your credentials:
```env
# Frontend Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Server-Side AI Discovery (Required for live Gemini discovery)
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
```

*Note:* If Firebase credentials are not provided, ScholarAid automatically activates **High-Fidelity Demonstration Mode** populated with realistic sample student profiles, scholarships, and applications, allowing immediate evaluation of all 20 pages!

---

## 6. Running the Application

### Start Frontend (Vite Development Server)
```bash
npm run dev
```
The frontend will start at `http://localhost:5173`.

### Start Backend Discovery Server
```bash
npm run server
```
The server will start at `http://localhost:5000`.

### Run Unit Tests
```bash
npm test
```
Executes the comprehensive Vitest suite covering all 18 test cases for eligibility and readiness.

### Production Build
```bash
npm run build
```
Generates production-optimized static assets in the `dist/` directory.

---

## 7. Firebase Setup & Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Authentication** $\to$ **Email/Password** sign-in provider.
3. Enable **Realtime Database**.
4. In the Realtime Database **Rules** tab, paste the contents of `database.rules.json` and click **Publish**.
5. Deploy to Firebase Hosting:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## 8. Sample Demonstration Accounts

For local demonstration and evaluation, the following pre-configured profiles are available:

| Role | Email | Password | Scenario / Characteristics |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@scholaraid.edu` | `admin-secret-2026` | Full administrative review queue, AI search, and monitoring access |
| **Student** | `ananya.sharma@demo.ac.in` | `demo-password-123` | Eligible for STEM & Kerala merit awards (GPA 3.85, ₹3.2L income) |
| **Student** | `rahul.verma@demo.ac.in` | `demo-password-123` | Demonstrates low GPA rejection reasons (GPA 2.80) |
| **Student** | `priya.nair@demo.ac.in` | `demo-password-123` | Demonstrates high income ceiling rejection reasons (₹8.5L income) |
| **Student** | `karthik.s@demo.ac.in` | `demo-password-123` | Demonstrates incomplete profile handling and readiness warnings |

---

## 9. Academic Transparency & Disclaimer Notice

1. **Document Verification:** ScholarAid is an advisory decision-support platform. It does not perform biometric authentication or physical document verification.
2. **Official Portals:** All applications must be submitted on official state/central portals. ScholarAid never captures portal passwords or simulates third-party submissions.
3. **Status Tracking:** Application status records are student-reported and explicitly labelled as unverified against external portal databases.
