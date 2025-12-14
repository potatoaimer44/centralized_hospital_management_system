# Complete Development Prompt: Secure AI-Integrated Medical Records Management System

## Project Overview

Build a secure, centralized web-based medical record management system for teenagers in Kathmandu Valley with AI-driven audit log analysis and record matching capabilities. The system enables multiple hospitals to access and manage patient records while maintaining strict security and privacy controls.

---

## Technical Stack

### Frontend
- **Framework**: React.js with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux or Context API
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **UI Components**: shadcn/ui or Material-UI

### Backend
- **Framework**: Python Django (Django REST Framework)
- **Alternative**: Flask with Flask-RESTful
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Password Hashing**: bcrypt
- **CORS**: django-cors-headers

### Database
- **Primary Database**: PostgreSQL 15
- **Deployment**: Docker container
- **ORM**: Django ORM / SQLAlchemy

### AI/ML
- **Language**: Python 3.10+
- **Libraries**: 
  - scikit-learn (anomaly detection, record matching)
  - pandas (data processing)
  - numpy (numerical operations)
  - joblib (model persistence)
- **Algorithms**:
  - Isolation Forest / One-Class SVM (audit log analysis)
  - Fuzzy matching / Levenshtein distance (record matching)

### DevOps & Deployment
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (reverse proxy)
- **WSGI Server**: Gunicorn (for Django)
- **SSL/TLS**: Let's Encrypt or self-signed certificates

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                 React Frontend                       │
│  (Admin, Doctor, Nurse, Patient Dashboards)         │
└─────────────────────────────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────┐
│              Nginx Reverse Proxy                     │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│           Django REST API Backend                    │
│  - Authentication & Authorization                    │
│  - CRUD Operations                                   │
│  - Business Logic                                    │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│ PostgreSQL   │ │  AI Service │ │ Redis Cache  │
│  (Docker)    │ │  (Python)   │ │  (Optional)  │
└──────────────┘ └─────────────┘ └──────────────┘
```

---

## Database Schema Design

### 1. Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'patient')),
    hospital_id INTEGER REFERENCES hospitals(id),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Hospitals Table
```sql
CREATE TABLE hospitals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    district VARCHAR(50) DEFAULT 'Kathmandu',
    phone VARCHAR(15),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Patients Table
```sql
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    blood_group VARCHAR(5),
    address VARCHAR(255),
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(15),
    guardian_relation VARCHAR(50),
    emergency_contact VARCHAR(15),
    allergies TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Medical Records Table
```sql
CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES users(id),
    hospital_id INTEGER REFERENCES hospitals(id),
    visit_date TIMESTAMP NOT NULL,
    chief_complaint TEXT,
    diagnosis TEXT,
    prescription TEXT,
    lab_results TEXT,
    treatment_plan TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Vital Signs Table
```sql
CREATE TABLE vital_signs (
    id SERIAL PRIMARY KEY,
    medical_record_id INTEGER REFERENCES medical_records(id) ON DELETE CASCADE,
    recorded_by INTEGER REFERENCES users(id),
    temperature DECIMAL(4,2),
    blood_pressure VARCHAR(10),
    pulse_rate INTEGER,
    respiratory_rate INTEGER,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(4,2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    patient_id INTEGER REFERENCES patients(id),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);
```

### 7. Access Requests Table
```sql
CREATE TABLE access_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id),
    patient_id INTEGER REFERENCES patients(id),
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    approved_by INTEGER REFERENCES users(id),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);
```

### 8. Security Alerts Table
```sql
CREATE TABLE security_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id INTEGER REFERENCES users(id),
    description TEXT,
    anomaly_score DECIMAL(5,4),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);
```

### 9. Record Matches Table (AI Record Matching)
```sql
CREATE TABLE record_matches (
    id SERIAL PRIMARY KEY,
    patient_id_1 INTEGER REFERENCES patients(id),
    patient_id_2 INTEGER REFERENCES patients(id),
    match_score DECIMAL(5,4),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    reviewed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);
```

---

## Docker Configuration

### docker-compose.yml
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: medrecord_db
    environment:
      POSTGRES_DB: medrecord_db
      POSTGRES_USER: medrecord_user
      POSTGRES_PASSWORD: secure_password_here
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - medrecord_network
    restart: unless-stopped

  # Django Backend
  backend:
    build: ./backend
    container_name: medrecord_backend
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - ./backend:/app
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://medrecord_user:secure_password_here@postgres:5432/medrecord_db
      - SECRET_KEY=your-secret-key-here
      - DEBUG=False
      - ALLOWED_HOSTS=localhost,127.0.0.1
    depends_on:
      - postgres
    networks:
      - medrecord_network
    restart: unless-stopped

  # AI Service (Optional: separate container)
  ai_service:
    build: ./ai_service
    container_name: medrecord_ai
    volumes:
      - ./ai_service:/app
      - ./models:/app/models
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://medrecord_user:secure_password_here@postgres:5432/medrecord_db
    depends_on:
      - postgres
    networks:
      - medrecord_network
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: medrecord_nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - static_volume:/app/staticfiles
      - media_volume:/app/media
      - ./frontend/build:/usr/share/nginx/html
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - medrecord_network
    restart: unless-stopped

  # Redis Cache (Optional)
  redis:
    image: redis:7-alpine
    container_name: medrecord_redis
    ports:
      - "6379:6379"
    networks:
      - medrecord_network
    restart: unless-stopped

volumes:
  postgres_data:
  static_volume:
  media_volume:

networks:
  medrecord_network:
    driver: bridge
```

### Backend Dockerfile (backend/Dockerfile)
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### Backend requirements.txt
```
Django==4.2.7
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0
django-cors-headers==4.3.1
psycopg2-binary==2.9.9
gunicorn==21.2.0
python-decouple==3.8
bcrypt==4.1.1
scikit-learn==1.3.2
pandas==2.1.3
numpy==1.26.2
joblib==1.3.2
fuzzywuzzy==0.18.0
python-Levenshtein==0.23.0
celery==5.3.4
redis==5.0.1
```

### AI Service Dockerfile (ai_service/Dockerfile)
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy AI service files
COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

### AI Service requirements.txt
```
Flask==3.0.0
scikit-learn==1.3.2
pandas==2.1.3
numpy==1.26.2
joblib==1.3.2
fuzzywuzzy==0.18.0
python-Levenshtein==0.23.0
psycopg2-binary==2.9.9
python-decouple==3.8
```

---

## API Endpoints Design

### Authentication Endpoints
```
POST   /api/auth/register/          - Register new user
POST   /api/auth/login/             - Login (get JWT tokens)
POST   /api/auth/refresh/           - Refresh access token
POST   /api/auth/logout/            - Logout (blacklist token)
GET    /api/auth/me/                - Get current user info
PUT    /api/auth/change-password/   - Change password
```

### User Management (Admin only)
```
GET    /api/users/                  - List all users
POST   /api/users/                  - Create new user
GET    /api/users/{id}/             - Get user details
PUT    /api/users/{id}/             - Update user
DELETE /api/users/{id}/             - Deactivate user
```

### Hospital Management
```
GET    /api/hospitals/              - List hospitals
POST   /api/hospitals/              - Create hospital (admin)
GET    /api/hospitals/{id}/         - Get hospital details
PUT    /api/hospitals/{id}/         - Update hospital (admin)
```

### Patient Management
```
GET    /api/patients/               - List patients (filtered by role)
POST   /api/patients/               - Register new patient
GET    /api/patients/{id}/          - Get patient details
PUT    /api/patients/{id}/          - Update patient info
GET    /api/patients/search/        - Search patients across hospitals
GET    /api/patients/{id}/history/  - Get complete medical history
```

### Medical Records
```
GET    /api/records/                - List medical records
POST   /api/records/                - Create new record (doctor only)
GET    /api/records/{id}/           - Get record details
PUT    /api/records/{id}/           - Update record (doctor only)
DELETE /api/records/{id}/           - Delete record (admin only)
```

### Vital Signs
```
GET    /api/vitals/                 - List vital signs
POST   /api/vitals/                 - Record vital signs (doctor/nurse)
GET    /api/vitals/{id}/            - Get vital sign details
```

### Access Requests
```
GET    /api/access-requests/        - List access requests
POST   /api/access-requests/        - Request patient access
PUT    /api/access-requests/{id}/approve/  - Approve request (admin)
PUT    /api/access-requests/{id}/deny/     - Deny request (admin)
```

### Audit Logs
```
GET    /api/audit-logs/             - View audit logs (admin)
GET    /api/audit-logs/my-access/   - Patient views who accessed their records
GET    /api/audit-logs/stats/       - Get access statistics
```

### AI Endpoints
```
POST   /api/ai/analyze-logs/        - Trigger audit log analysis
GET    /api/ai/security-alerts/     - Get AI-generated alerts (admin)
POST   /api/ai/match-records/       - Find duplicate records
PUT    /api/ai/confirm-match/{id}/  - Confirm record match
```

### Dashboard & Reports
```
GET    /api/dashboard/stats/        - Get dashboard statistics
GET    /api/reports/patient/{id}/   - Generate patient report (PDF)
GET    /api/reports/hospital/{id}/  - Generate hospital report
```

---

## Frontend Structure

### Component Hierarchy

```
src/
├── components/
│   ├── common/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ErrorBoundary.jsx
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── PrivateRoute.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── UserManagement.jsx
│   │   ├── HospitalManagement.jsx
│   │   ├── SecurityAlerts.jsx
│   │   └── AuditLogs.jsx
│   ├── doctor/
│   │   ├── DoctorDashboard.jsx
│   │   ├── PatientList.jsx
│   │   ├── PatientDetails.jsx
│   │   ├── MedicalRecordForm.jsx
│   │   └── PatientSearch.jsx
│   ├── nurse/
│   │   ├── NurseDashboard.jsx
│   │   ├── VitalSignsForm.jsx
│   │   └── PatientCareNotes.jsx
│   └── patient/
│       ├── PatientDashboard.jsx
│       ├── MedicalHistory.jsx
│       ├── AccessLog.jsx
│       └── ProfileSettings.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── PatientDetailPage.jsx
│   ├── NotFoundPage.jsx
│   └── UnauthorizedPage.jsx
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── patientService.js
│   ├── recordService.js
│   └── auditService.js
├── store/
│   ├── authSlice.js
│   ├── patientSlice.js
│   └── store.js
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   └── validators.js
├── App.jsx
└── index.js
```

---

## AI Implementation Details

### 1. Audit Log Anomaly Detection

#### File: `ai_service/audit_analyzer.py`

```python
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
from datetime import datetime, timedelta

class AuditLogAnalyzer:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        
    def prepare_features(self, logs_df):
        """
        Extract features from audit logs
        """
        features = pd.DataFrame()
        
        # Time-based features
        features['hour'] = logs_df['timestamp'].dt.hour
        features['day_of_week'] = logs_df['timestamp'].dt.dayofweek
        features['is_weekend'] = (logs_df['timestamp'].dt.dayofweek >= 5).astype(int)
        
        # User activity features
        features['records_accessed'] = logs_df.groupby('user_id')['patient_id'].transform('count')
        features['unique_patients'] = logs_df.groupby('user_id')['patient_id'].transform('nunique')
        
        # Calculate access rate safely
        user_time_diff = (
            logs_df.groupby('user_id')['timestamp'].transform('max') - 
            logs_df.groupby('user_id')['timestamp'].transform('min')
        ).dt.total_seconds()
        user_time_diff = user_time_diff.replace(0, 1)  # Avoid division by zero
        features['access_rate'] = features['records_accessed'] / user_time_diff
        
        # Cross-hospital access
        features['cross_hospital_access'] = (
            logs_df['user_hospital'] != logs_df['patient_hospital']
        ).astype(int)
        
        # Action type encoding
        action_dummies = pd.get_dummies(logs_df['action'], prefix='action')
        features = pd.concat([features, action_dummies], axis=1)
        
        return features
    
    def train_model(self, logs_df, contamination=0.05):
        """
        Train anomaly detection model
        """
        features = self.prepare_features(logs_df)
        features_scaled = self.scaler.fit_transform(features)
        
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        self.model.fit(features_scaled)
        
        # Save model
        joblib.dump(self.model, 'models/audit_model.pkl')
        joblib.dump(self.scaler, 'models/audit_scaler.pkl')
        
    def detect_anomalies(self, logs_df):
        """
        Detect anomalies in new logs
        """
        if self.model is None:
            self.model = joblib.load('models/audit_model.pkl')
            self.scaler = joblib.load('models/audit_scaler.pkl')
        
        features = self.prepare_features(logs_df)
        features_scaled = self.scaler.transform(features)
        
        # Predict anomalies (-1 for anomalies, 1 for normal)
        predictions = self.model.predict(features_scaled)
        anomaly_scores = self.model.decision_function(features_scaled)
        
        # Create alerts for anomalies
        alerts = []
        for idx, (pred, score) in enumerate(zip(predictions, anomaly_scores)):
            if pred == -1:
                alert = {
                    'user_id': logs_df.iloc[idx]['user_id'],
                    'timestamp': logs_df.iloc[idx]['timestamp'],
                    'anomaly_score': abs(score),
                    'severity': self._calculate_severity(score),
                    'description': self._generate_description(logs_df.iloc[idx])
                }
                alerts.append(alert)
        
        return alerts
    
    def _calculate_severity(self, score):
        """Calculate alert severity based on anomaly score"""
        abs_score = abs(score)
        if abs_score > 0.5:
            return 'critical'
        elif abs_score > 0.3:
            return 'high'
        elif abs_score > 0.1:
            return 'medium'
        else:
            return 'low'
    
    def _generate_description(self, log_row):
        """Generate human-readable alert description"""
        return f"Unusual access pattern detected for user {log_row['user_id']} accessing patient {log_row['patient_id']}"
```

### 2. Record Matching Algorithm

#### File: `ai_service/record_matcher.py`

```python
import pandas as pd
from fuzzywuzzy import fuzz
from datetime import datetime, timedelta

class RecordMatcher:
    def __init__(self, threshold=80):
        self.threshold = threshold
    
    def calculate_match_score(self, patient1, patient2):
        """
        Calculate similarity score between two patient records
        """
        scores = []
        weights = []
        
        # Name matching (40% weight)
        name_score = fuzz.token_sort_ratio(
            patient1['full_name'].lower(),
            patient2['full_name'].lower()
        )
        scores.append(name_score)
        weights.append(0.4)
        
        # Date of birth matching (30% weight)
        if patient1['date_of_birth'] == patient2['date_of_birth']:
            dob_score = 100
        else:
            # Allow for small date variations (data entry errors)
            date_diff = abs((patient1['date_of_birth'] - patient2['date_of_birth']).days)
            dob_score = max(0, 100 - (date_diff * 10))
        scores.append(dob_score)
        weights.append(0.3)
        
        # Phone number matching (15% weight)
        if patient1['phone'] and patient2['phone']:
            phone_score = fuzz.ratio(
                patient1['phone'].replace('-', '').replace(' ', ''),
                patient2['phone'].replace('-', '').replace(' ', '')
            )
        else:
            phone_score = 0
        scores.append(phone_score)
        weights.append(0.15)
        
        # Address matching (10% weight)
        if patient1['address'] and patient2['address']:
            address_score = fuzz.token_set_ratio(
                patient1['address'].lower(),
                patient2['address'].lower()
            )
        else:
            address_score = 0
        scores.append(address_score)
        weights.append(0.10)
        
        # Gender matching (5% weight)
        gender_score = 100 if patient1['gender'] == patient2['gender'] else 0
        scores.append(gender_score)
        weights.append(0.05)
        
        # Weighted average
        final_score = sum(s * w for s, w in zip(scores, weights))
        
        return final_score
    
    def find_matches(self, new_patient, existing_patients):
        """
        Find potential matches for a new patient
        """
        matches = []
        
        for existing in existing_patients:
            score = self.calculate_match_score(new_patient, existing)
            
            if score >= self.threshold:
                matches.append({
                    'patient_id': existing['id'],
                    'match_score': score / 100,  # Normalize to 0-1
                    'patient_name': existing['full_name'],
                    'patient_dob': existing['date_of_birth'],
                    'hospital': existing['hospital_name']
                })
        
        # Sort by score (highest first)
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return matches
```

### 3. AI Service Flask API

#### File: `ai_service/app.py`

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from audit_analyzer import AuditLogAnalyzer
from record_matcher import RecordMatcher
import psycopg2
from psycopg2.extras import RealDictCursor
import os

app = Flask(__name__)
CORS(app)

# Database connection
def get_db_connection():
    conn = psycopg2.connect(
        os.getenv('DATABASE_URL'),
        cursor_factory=RealDictCursor
    )
    return conn

# Initialize AI models
audit_analyzer = AuditLogAnalyzer()
record_matcher = RecordMatcher(threshold=80)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'AI Service'})

@app.route('/ai/analyze-logs', methods=['POST'])
def analyze_audit_logs():
    """
    Analyze recent audit logs for anomalies
    """
    try:
        # Get recent logs from database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get logs from last 24 hours
        query = """
            SELECT 
                al.id, al.user_id, al.action, al.patient_id, 
                al.timestamp, al.ip_address,
                u.hospital_id as user_hospital,
                p.hospital_id as patient_hospital
            FROM audit_logs al
            JOIN users u ON al.user_id = u.id
            LEFT JOIN patients p ON al.patient_id = p.id
            WHERE al.timestamp >= NOW() - INTERVAL '24 hours'
            ORDER BY al.timestamp DESC
        """
        
        cursor.execute(query)
        logs = cursor.fetchall()
        cursor.close()
        conn.close()
        
        if not logs:
            return jsonify({'alerts': [], 'message': 'No logs to analyze'})
        
        # Convert to DataFrame
        logs_df = pd.DataFrame(logs)
        logs_df['timestamp'] = pd.to_datetime(logs_df['timestamp'])
        
        # Detect anomalies
        alerts = audit_analyzer.detect_anomalies(logs_df)
        
        # Save alerts to database
        if alerts:
            conn = get_db_connection()
            cursor = conn.cursor()
            for alert in alerts:
                cursor.execute("""
                    INSERT INTO security_alerts 
                    (alert_type, severity, user_id, description, anomaly_score, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    'audit_anomaly',
                    alert['severity'],
                    alert['user_id'],
                    alert['description'],
                    alert['anomaly_score'],
                    alert['timestamp']
                ))
            conn.commit()
            cursor.close()
            conn.close()
        
        return jsonify({
            'success': True,
            'alerts_generated': len(alerts),
            'alerts': alerts
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/match-records', methods=['POST'])
def match_records():
    """
    Find duplicate patient records
    """
    try:
        data = request.json
        new_patient = data.get('patient')
        
        if not new_patient:
            return jsonify({'success': False, 'error': 'Patient data required'}), 400
        
        # Get existing patients from database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                p.id, u.full_name, p.date_of_birth, u.phone, 
                p.address, p.gender, h.name as hospital_name
            FROM patients p
            JOIN users u ON p.user_id = u.id
            JOIN hospitals h ON u.hospital_id = h.id
            WHERE p.id != %s
        """
        
        cursor.execute(query, (new_patient.get('id', 0),))
        existing_patients = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert date strings to datetime
        new_patient['date_of_birth'] = pd.to_datetime(new_patient['date_of_birth'])
        for patient in existing_patients:
            patient['date_of_birth'] = pd.to_datetime(patient['date_of_birth'])
        
        # Find matches
        matches = record_matcher.find_matches(new_patient, existing_patients)
        
        # Save potential matches to database
        if matches:
            conn = get_db_connection()
            cursor = conn.cursor()
            for match in matches:
                cursor.execute("""
                    INSERT INTO record_matches 
                    (patient_id_1, patient_id_2, match_score, status)
                    VALUES (%s, %s, %s, 'pending')
                    ON CONFLICT DO NOTHING
                """, (
                    new_patient['id'],
                    match['patient_id'],
                    match['match_score']
                ))
            conn.commit()
            cursor.close()
            conn.close()
        
        return jsonify({
            'success': True,
            'matches_found': len(matches),
            'matches': matches
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/ai/train-audit-model', methods=['POST'])
def train_audit_model():
    