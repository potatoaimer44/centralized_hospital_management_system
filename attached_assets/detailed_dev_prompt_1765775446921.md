# Simplified Development Guide: Secure Medical Records System for Teenagers

## Project Overview
Build a web-based medical record management system for teenagers in Kathmandu Valley with AI-powered security monitoring and record matching. Multiple hospitals access one centralized database.

---

## Tech Stack (Keep It Simple)

**Frontend:** React.js + Tailwind CSS  
**Backend:** Python Django + Django REST Framework  
**Database:** PostgreSQL (in Docker)  
**AI/ML:** Python (scikit-learn, pandas)  
**Authentication:** JWT tokens

---

## Docker Setup

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: medrecord_db
    environment:
      POSTGRES_DB: medrecord_db
      POSTGRES_USER: meduser
      POSTGRES_PASSWORD: medpass123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: medrecord_backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://meduser:medpass123@postgres:5432/medrecord_db
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

### Backend Dockerfile
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

### requirements.txt
```
Django==4.2.7
djangorestframework==4.14.0
djangorestframework-simplejwt==5.3.0
django-cors-headers==4.3.1
psycopg2-binary==2.9.9
scikit-learn==1.3.2
pandas==2.1.3
fuzzywuzzy==0.18.0
python-Levenshtein==0.23.0
```

---

## Database Design (5 Core Tables)

### 1. Users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20),  -- 'admin', 'doctor', 'nurse', 'patient'
    full_name VARCHAR(100),
    hospital_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Hospitals
```sql
CREATE TABLE hospitals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    address VARCHAR(255),
    phone VARCHAR(15)
);
```

### 3. Patients
```sql
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    date_of_birth DATE,
    gender VARCHAR(10),
    address VARCHAR(255),
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(15),
    allergies TEXT
);
```

### 4. Medical_Records
```sql
CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    doctor_id INTEGER REFERENCES users(id),
    hospital_id INTEGER REFERENCES hospitals(id),
    visit_date TIMESTAMP,
    diagnosis TEXT,
    prescription TEXT,
    notes TEXT
);
```

### 5. Audit_Logs
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100),
    patient_id INTEGER,
    timestamp TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(50)
);
```

---

## API Endpoints (Simplified)

### Authentication
```
POST /api/auth/login/          - Login (get JWT token)
POST /api/auth/register/       - Register user
```

### Patients
```
GET    /api/patients/          - List patients
POST   /api/patients/          - Add new patient
GET    /api/patients/{id}/     - View patient details
PUT    /api/patients/{id}/     - Update patient
GET    /api/patients/search/   - Search across hospitals
```

### Medical Records
```
GET    /api/records/           - List records
POST   /api/records/           - Add new record (doctor only)
GET    /api/records/{id}/      - View record details
```

### Admin Features
```
GET    /api/users/             - List all users (admin only)
POST   /api/users/             - Create user (admin only)
GET    /api/audit-logs/        - View audit logs (admin only)
GET    /api/ai/alerts/         - View AI security alerts (admin only)
```

### AI Features
```
POST   /api/ai/analyze-logs/   - Run AI audit analysis
POST   /api/ai/match-records/  - Find duplicate patient records
```

---

## Frontend Pages (4 Dashboards)

### 1. Admin Dashboard
- User management table (add/remove doctors, nurses)
- Hospital list
- Security alerts from AI
- Audit log viewer

### 2. Doctor Dashboard
- Patient list (assigned patients)
- Search bar (find patients from other hospitals)
- Add medical record form
- View patient history

### 3. Nurse Dashboard
- Patient list (assigned patients)
- Add vital signs form
- View records (limited editing)

### 4. Patient Dashboard
- View own medical records
- See visit history
- View who accessed their records (audit log)

---

## AI Implementation (Simplified)

### AI Feature 1: Audit Log Anomaly Detection

**What it detects:**
- Doctor accessing too many records quickly
- Unusual login times (e.g., 3 AM)
- Cross-hospital access patterns
- Accessing unrelated patients

**Simple Implementation:**
```python
# ai_service/audit_analyzer.py
from sklearn.ensemble import IsolationForest
import pandas as pd

def analyze_logs(logs_df):
    # Create simple features
    features = pd.DataFrame({
        'hour': logs_df['timestamp'].dt.hour,
        'records_accessed': logs_df.groupby('user_id').size(),
        'is_cross_hospital': (logs_df['user_hospital'] != logs_df['patient_hospital']).astype(int)
    })
    
    # Train model
    model = IsolationForest(contamination=0.05)
    predictions = model.fit_predict(features)
    
    # Return anomalies
    anomalies = logs_df[predictions == -1]
    return anomalies
```

### AI Feature 2: Record Matching

**What it does:**
- Matches patients by name, DOB, phone
- Finds duplicates across hospitals

**Simple Implementation:**
```python
# ai_service/record_matcher.py
from fuzzywuzzy import fuzz

def find_matches(new_patient, existing_patients):
    matches = []
    
    for existing in existing_patients:
        # Calculate similarity scores
        name_score = fuzz.token_sort_ratio(
            new_patient['name'].lower(),
            existing['name'].lower()
        )
        
        dob_match = (new_patient['dob'] == existing['dob'])
        
        # Combined score
        if name_score > 80 and dob_match:
            matches.append({
                'patient_id': existing['id'],
                'score': name_score / 100,
                'name': existing['name']
            })
    
    return matches
```

---

## Security Features (Essential)

### 1. JWT Authentication
```python
# Django view example
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient(request, patient_id):
    # Check if user has permission
    if request.user.role not in ['admin', 'doctor']:
        return Response({'error': 'Unauthorized'}, status=403)
    
    patient = Patient.objects.get(id=patient_id)
    return Response(patient_data)
```

### 2. Audit Logging
```python
# Automatic logging function
def log_access(user_id, action, patient_id):
    AuditLog.objects.create(
        user_id=user_id,
        action=action,
        patient_id=patient_id,
        timestamp=timezone.now()
    )

# Use in views
@api_view(['GET'])
def view_patient_record(request, patient_id):
    log_access(request.user.id, 'VIEW_RECORD', patient_id)
    # ... rest of code
```

### 3. Role-Based Access
```python
# Permission helper
def can_access_record(user, patient):
    if user.role == 'admin':
        return True
    if user.role == 'patient':
        return patient.user_id == user.id
    if user.role in ['doctor', 'nurse']:
        return patient.hospital_id == user.hospital_id
    return False
```

---

## Development Steps (8-10 Weeks)

### Week 1-2: Setup & Basic Features
1. Set up Docker with PostgreSQL
2. Create Django project
3. Build database models
4. Create API endpoints for auth and patients
5. Build React login page

### Week 3-4: Core Functionality
1. Implement all CRUD operations
2. Build doctor/nurse/patient dashboards
3. Add role-based permissions
4. Create patient search feature

### Week 5-6: Security
1. Add audit logging to all views
2. Create audit log viewer for admin
3. Patient access transparency page
4. Test role permissions thoroughly

### Week 7-8: AI Integration
1. Collect sample audit log data
2. Train anomaly detection model
3. Build AI analysis endpoint
4. Create security alerts page
5. Implement record matching algorithm

### Week 9-10: Testing & Documentation
1. Test all features
2. Fix bugs
3. Write thesis documentation
4. Prepare demo

---

## Sample Code Structure

```
project/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── api/
│   │   ├── models.py       # Database models
│   │   ├── views.py        # API endpoints
│   │   ├── serializers.py  # Data formatting
│   │   └── permissions.py  # Access control
│   └── ai_service/
│       ├── audit_analyzer.py
│       └── record_matcher.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── NurseDashboard.jsx
│   │   │   └── PatientDashboard.jsx
│   │   ├── services/
│   │   │   └── api.js      # API calls
│   │   └── App.jsx
│   └── package.json
└── docker-compose.yml
```

---

## Key Deliverables for Thesis

1. **Working web application** with 4 dashboards
2. **AI model 1:** Audit log anomaly detection (trained and integrated)
3. **AI model 2:** Patient record matching algorithm
4. **Database:** PostgreSQL with 5+ tables
5. **Security:** JWT auth, audit logging, role-based access
6. **Documentation:** Code comments, API docs, user manual
7. **Testing:** Screenshots/videos of all features working
8. **Thesis report:** Research questions answered with implementation details

---

## Tips for Success

✓ **Start simple** - Get basic CRUD working first  
✓ **Test as you go** - Don't wait until the end  
✓ **Use existing libraries** - Don't reinvent the wheel  
✓ **Focus on core features** - Skip "nice to have" features  
✓ **Document everything** - Screenshots, code comments  
✓ **Ask for help** - Stack Overflow, ChatGPT, professors  

---

## What You DON'T Need to Build

❌ Appointment scheduling  
❌ Payment processing  
❌ Email notifications  
❌ Mobile app  
❌ Real-time chat  
❌ Advanced reporting/analytics  
❌ File upload for images/PDFs (unless time permits)

Focus on: **Security + AI + Core Medical Records**

---

## Final Checklist Before Submission

- [ ] All 4 user roles can log in
- [ ] Doctors can add/view medical records
- [ ] Nurses can view records (limited access)
- [ ] Patients can view their own records
- [ ] Admin can see audit logs
- [ ] AI detects suspicious access patterns
- [ ] AI finds duplicate patient records
- [ ] Database runs in Docker
- [ ] Code is on GitHub
- [ ] Demo video recorded
- [ ] Thesis document completed