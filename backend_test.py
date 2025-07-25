#!/usr/bin/env python3
"""
Backend API Testing for Hospital Maternity Patient Tracker
Tests all patient management, vital signs, and statistics endpoints
"""

import requests
import json
from datetime import datetime, date
from typing import Dict, Any
import sys

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading backend URL: {e}")
        return None

BASE_URL = get_backend_url()
if not BASE_URL:
    print("❌ Could not get backend URL from frontend/.env")
    sys.exit(1)

API_URL = f"{BASE_URL}/api"
print(f"🔗 Testing API at: {API_URL}")

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def success(self, test_name: str):
        self.passed += 1
        print(f"✅ {test_name}")
    
    def failure(self, test_name: str, error: str):
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        print(f"❌ {test_name}: {error}")
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n📊 Test Summary: {self.passed}/{total} passed")
        if self.errors:
            print("\n🚨 Failures:")
            for error in self.errors:
                print(f"  - {error}")

results = TestResults()

# Test data
test_patient_data = {
    "patient_id": "MAT2025001",
    "full_name": "Sarah Johnson",
    "birthdate": "1995-03-15",
    "address": "123 Main Street, Springfield",
    "ward_number": "Ward-A",
    "bed_number": "A-101",
    "admission_date": "2025-01-15",
    "diagnosis": "Pregnancy - 38 weeks gestation",
    "high_risk": "No",
    "discharged": "No",
    "notes": "First pregnancy, no complications"
}

test_patient_data_2 = {
    "patient_id": "MAT2025002", 
    "full_name": "Maria Rodriguez",
    "birthdate": "1988-07-22",
    "address": "456 Oak Avenue, Springfield",
    "ward_number": "Ward-B",
    "bed_number": "B-205",
    "admission_date": "2025-01-16",
    "diagnosis": "High-risk pregnancy - gestational diabetes",
    "high_risk": "Yes",
    "discharged": "No",
    "notes": "Requires blood sugar monitoring"
}

created_patient_ids = []
created_vital_signs_ids = []

def test_api_root():
    """Test API root endpoint"""
    try:
        response = requests.get(f"{API_URL}/")
        if response.status_code == 200:
            data = response.json()
            if "Hospital Maternity Patient Tracker API" in data.get("message", ""):
                results.success("API Root Endpoint")
                return True
            else:
                results.failure("API Root Endpoint", f"Unexpected message: {data}")
        else:
            results.failure("API Root Endpoint", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("API Root Endpoint", str(e))
    return False

def test_create_patient():
    """Test patient creation with age auto-calculation"""
    try:
        response = requests.post(f"{API_URL}/patients", json=test_patient_data)
        if response.status_code == 200:
            patient = response.json()
            created_patient_ids.append(patient["id"])
            
            # Verify age calculation (born 1995-03-15, should be ~29-30 years old)
            expected_age = 2025 - 1995  # Approximate age
            if abs(patient["age"] - expected_age) <= 1:
                results.success("Patient Creation with Age Calculation")
                return patient
            else:
                results.failure("Patient Creation", f"Age calculation incorrect: got {patient['age']}, expected ~{expected_age}")
        else:
            results.failure("Patient Creation", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Patient Creation", str(e))
    return None

def test_create_second_patient():
    """Test creating second patient for filtering tests"""
    try:
        response = requests.post(f"{API_URL}/patients", json=test_patient_data_2)
        if response.status_code == 200:
            patient = response.json()
            created_patient_ids.append(patient["id"])
            results.success("Second Patient Creation")
            return patient
        else:
            results.failure("Second Patient Creation", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Second Patient Creation", str(e))
    return None

def test_duplicate_patient_id():
    """Test duplicate patient ID rejection"""
    try:
        response = requests.post(f"{API_URL}/patients", json=test_patient_data)
        if response.status_code == 400:
            results.success("Duplicate Patient ID Rejection")
        else:
            results.failure("Duplicate Patient ID Rejection", f"Expected 400, got {response.status_code}")
    except Exception as e:
        results.failure("Duplicate Patient ID Rejection", str(e))

def test_get_all_patients():
    """Test getting all patients"""
    try:
        response = requests.get(f"{API_URL}/patients")
        if response.status_code == 200:
            patients = response.json()
            if len(patients) >= 2:  # Should have our test patients
                results.success("Get All Patients")
                return patients
            else:
                results.failure("Get All Patients", f"Expected at least 2 patients, got {len(patients)}")
        else:
            results.failure("Get All Patients", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Get All Patients", str(e))
    return []

def test_search_patients():
    """Test patient search functionality"""
    # Test search by name
    try:
        response = requests.get(f"{API_URL}/patients?search=Sarah")
        if response.status_code == 200:
            patients = response.json()
            if len(patients) >= 1 and any("Sarah" in p["full_name"] for p in patients):
                results.success("Patient Search by Name")
            else:
                results.failure("Patient Search by Name", f"No patients found with 'Sarah' in name")
        else:
            results.failure("Patient Search by Name", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Patient Search by Name", str(e))

    # Test search by patient ID
    try:
        response = requests.get(f"{API_URL}/patients?search=MAT2025001")
        if response.status_code == 200:
            patients = response.json()
            if len(patients) >= 1 and any("MAT2025001" in p["patient_id"] for p in patients):
                results.success("Patient Search by ID")
            else:
                results.failure("Patient Search by ID", f"No patients found with ID 'MAT2025001'")
        else:
            results.failure("Patient Search by ID", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Patient Search by ID", str(e))

    # Test search by ward
    try:
        response = requests.get(f"{API_URL}/patients?search=Ward-A")
        if response.status_code == 200:
            patients = response.json()
            if len(patients) >= 1 and any("Ward-A" in p["ward_number"] for p in patients):
                results.success("Patient Search by Ward")
            else:
                results.failure("Patient Search by Ward", f"No patients found in 'Ward-A'")
        else:
            results.failure("Patient Search by Ward", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Patient Search by Ward", str(e))

def test_filter_patients():
    """Test patient filtering functionality"""
    # Test high-risk filter
    try:
        response = requests.get(f"{API_URL}/patients?high_risk=true")
        if response.status_code == 200:
            patients = response.json()
            if len(patients) >= 1 and all(p["high_risk"] == "Yes" for p in patients):
                results.success("Patient Filter by High Risk")
            else:
                results.failure("Patient Filter by High Risk", f"Filter not working correctly")
        else:
            results.failure("Patient Filter by High Risk", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Patient Filter by High Risk", str(e))

    # Test non-high-risk filter
    try:
        response = requests.get(f"{API_URL}/patients?high_risk=false")
        if response.status_code == 200:
            patients = response.json()
            if len(patients) >= 1 and all(p["high_risk"] == "No" for p in patients):
                results.success("Patient Filter by Non-High Risk")
            else:
                results.failure("Patient Filter by Non-High Risk", f"Filter not working correctly")
        else:
            results.failure("Patient Filter by Non-High Risk", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Patient Filter by Non-High Risk", str(e))

    # Test discharged filter
    try:
        response = requests.get(f"{API_URL}/patients?discharged=false")
        if response.status_code == 200:
            patients = response.json()
            if len(patients) >= 2 and all(p["discharged"] == "No" for p in patients):
                results.success("Patient Filter by Discharge Status")
            else:
                results.failure("Patient Filter by Discharge Status", f"Filter not working correctly")
        else:
            results.failure("Patient Filter by Discharge Status", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Patient Filter by Discharge Status", str(e))

    # Test ward filter
    try:
        response = requests.get(f"{API_URL}/patients?ward=Ward-B")
        if response.status_code == 200:
            patients = response.json()
            if len(patients) >= 1 and all(p["ward_number"] == "Ward-B" for p in patients):
                results.success("Patient Filter by Ward")
            else:
                results.failure("Patient Filter by Ward", f"Filter not working correctly")
        else:
            results.failure("Patient Filter by Ward", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Patient Filter by Ward", str(e))

def test_get_patient_by_id():
    """Test getting individual patient by ID"""
    if not created_patient_ids:
        results.failure("Get Patient by ID", "No patient IDs available")
        return
    
    try:
        patient_id = created_patient_ids[0]
        response = requests.get(f"{API_URL}/patients/{patient_id}")
        if response.status_code == 200:
            patient = response.json()
            if patient["id"] == patient_id:
                results.success("Get Patient by ID")
            else:
                results.failure("Get Patient by ID", f"Wrong patient returned")
        else:
            results.failure("Get Patient by ID", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Get Patient by ID", str(e))

def test_update_patient():
    """Test patient update functionality"""
    if not created_patient_ids:
        results.failure("Update Patient", "No patient IDs available")
        return
    
    try:
        patient_id = created_patient_ids[0]
        update_data = {
            "diagnosis": "Pregnancy - 39 weeks gestation, labor started",
            "notes": "Patient in active labor"
        }
        response = requests.put(f"{API_URL}/patients/{patient_id}", json=update_data)
        if response.status_code == 200:
            patient = response.json()
            if patient["diagnosis"] == update_data["diagnosis"] and patient["notes"] == update_data["notes"]:
                results.success("Update Patient")
            else:
                results.failure("Update Patient", f"Update not reflected correctly")
        else:
            results.failure("Update Patient", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Update Patient", str(e))

def test_create_vital_signs():
    """Test vital signs creation with patient auto-fill"""
    if not created_patient_ids:
        results.failure("Create Vital Signs", "No patient IDs available")
        return None
    
    try:
        vital_signs_data = {
            "patient_id": created_patient_ids[0],
            "monitoring_datetime": "2025-01-17T10:30:00",
            "blood_pressure": "120/80",
            "heart_rate": 85,
            "temperature": 37.2,
            "respiratory_rate": 18,
            "spo2": 98,
            "pain_score": 3,
            "iv_fluids_type": "D5LR",
            "iv_fluids_volume": 1000,
            "iv_fluids_status": "running",
            "iv_medications": "Oxytocin 10 units in 500ml NS",
            "oral_intake": "Water 200ml",
            "urine_output": 150,
            "other_output": "None",
            "additional_notes": "Patient comfortable, contractions regular"
        }
        
        response = requests.post(f"{API_URL}/vital-signs", json=vital_signs_data)
        if response.status_code == 200:
            vital_signs = response.json()
            created_vital_signs_ids.append(vital_signs["id"])
            
            # Verify auto-fill functionality
            if (vital_signs["patient_name"] == "Sarah Johnson" and 
                vital_signs["ward_number"] == "Ward-A" and 
                vital_signs["bed_number"] == "A-101"):
                results.success("Create Vital Signs with Auto-fill")
                return vital_signs
            else:
                results.failure("Create Vital Signs", f"Auto-fill not working correctly")
        else:
            results.failure("Create Vital Signs", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Create Vital Signs", str(e))
    return None

def test_create_vital_signs_invalid_patient():
    """Test vital signs creation with invalid patient ID"""
    try:
        vital_signs_data = {
            "patient_id": "invalid-patient-id",
            "monitoring_datetime": "2025-01-17T10:30:00",
            "blood_pressure": "120/80",
            "heart_rate": 85,
            "temperature": 37.2,
            "respiratory_rate": 18,
            "spo2": 98,
            "pain_score": 3
        }
        
        response = requests.post(f"{API_URL}/vital-signs", json=vital_signs_data)
        if response.status_code == 404:
            results.success("Vital Signs Invalid Patient Rejection")
        else:
            results.failure("Vital Signs Invalid Patient Rejection", f"Expected 404, got {response.status_code}")
    except Exception as e:
        results.failure("Vital Signs Invalid Patient Rejection", str(e))

def test_get_vital_signs():
    """Test getting vital signs with filtering"""
    try:
        response = requests.get(f"{API_URL}/vital-signs")
        if response.status_code == 200:
            vital_signs = response.json()
            if len(vital_signs) >= 1:
                results.success("Get All Vital Signs")
            else:
                results.failure("Get All Vital Signs", f"No vital signs found")
        else:
            results.failure("Get All Vital Signs", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Get All Vital Signs", str(e))

    # Test filter by patient ID
    if created_patient_ids:
        try:
            patient_id = created_patient_ids[0]
            response = requests.get(f"{API_URL}/vital-signs?patient_id={patient_id}")
            if response.status_code == 200:
                vital_signs = response.json()
                if len(vital_signs) >= 1 and all(vs["patient_id"] == patient_id for vs in vital_signs):
                    results.success("Filter Vital Signs by Patient ID")
                else:
                    results.failure("Filter Vital Signs by Patient ID", f"Filter not working correctly")
            else:
                results.failure("Filter Vital Signs by Patient ID", f"Status {response.status_code}: {response.text}")
        except Exception as e:
            results.failure("Filter Vital Signs by Patient ID", str(e))

    # Test filter by ward
    try:
        response = requests.get(f"{API_URL}/vital-signs?ward=Ward-A")
        if response.status_code == 200:
            vital_signs = response.json()
            if len(vital_signs) >= 1 and all(vs["ward_number"] == "Ward-A" for vs in vital_signs):
                results.success("Filter Vital Signs by Ward")
            else:
                results.failure("Filter Vital Signs by Ward", f"Filter not working correctly")
        else:
            results.failure("Filter Vital Signs by Ward", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Filter Vital Signs by Ward", str(e))

def test_get_vital_signs_by_id():
    """Test getting individual vital signs by ID"""
    if not created_vital_signs_ids:
        results.failure("Get Vital Signs by ID", "No vital signs IDs available")
        return
    
    try:
        vital_signs_id = created_vital_signs_ids[0]
        response = requests.get(f"{API_URL}/vital-signs/{vital_signs_id}")
        if response.status_code == 200:
            vital_signs = response.json()
            if vital_signs["id"] == vital_signs_id:
                results.success("Get Vital Signs by ID")
            else:
                results.failure("Get Vital Signs by ID", f"Wrong vital signs returned")
        else:
            results.failure("Get Vital Signs by ID", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Get Vital Signs by ID", str(e))

def test_statistics_overview():
    """Test statistics overview endpoint"""
    try:
        response = requests.get(f"{API_URL}/stats/overview")
        if response.status_code == 200:
            stats = response.json()
            required_fields = ["total_patients", "high_risk_patients", "discharged_patients", "ward_statistics", "recent_vital_signs"]
            
            if all(field in stats for field in required_fields):
                # Verify counts make sense
                if (stats["total_patients"] >= 2 and 
                    stats["high_risk_patients"] >= 1 and
                    isinstance(stats["ward_statistics"], list)):
                    results.success("Statistics Overview")
                else:
                    results.failure("Statistics Overview", f"Statistics values don't match expected data")
            else:
                missing = [f for f in required_fields if f not in stats]
                results.failure("Statistics Overview", f"Missing fields: {missing}")
        else:
            results.failure("Statistics Overview", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Statistics Overview", str(e))

def test_delete_vital_signs():
    """Test deleting vital signs"""
    if not created_vital_signs_ids:
        results.failure("Delete Vital Signs", "No vital signs IDs available")
        return
    
    try:
        vital_signs_id = created_vital_signs_ids[0]
        response = requests.delete(f"{API_URL}/vital-signs/{vital_signs_id}")
        if response.status_code == 200:
            # Verify it's actually deleted
            get_response = requests.get(f"{API_URL}/vital-signs/{vital_signs_id}")
            if get_response.status_code == 404:
                results.success("Delete Vital Signs")
                created_vital_signs_ids.remove(vital_signs_id)
            else:
                results.failure("Delete Vital Signs", f"Vital signs not actually deleted")
        else:
            results.failure("Delete Vital Signs", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Delete Vital Signs", str(e))

def test_delete_patient():
    """Test deleting patient (should also delete associated vital signs)"""
    if not created_patient_ids:
        results.failure("Delete Patient", "No patient IDs available")
        return
    
    try:
        # Use the second patient to avoid affecting other tests
        patient_id = created_patient_ids[-1] if len(created_patient_ids) > 1 else created_patient_ids[0]
        response = requests.delete(f"{API_URL}/patients/{patient_id}")
        if response.status_code == 200:
            # Verify it's actually deleted
            get_response = requests.get(f"{API_URL}/patients/{patient_id}")
            if get_response.status_code == 404:
                results.success("Delete Patient")
                created_patient_ids.remove(patient_id)
            else:
                results.failure("Delete Patient", f"Patient not actually deleted")
        else:
            results.failure("Delete Patient", f"Status {response.status_code}: {response.text}")
    except Exception as e:
        results.failure("Delete Patient", str(e))

def cleanup():
    """Clean up test data"""
    print("\n🧹 Cleaning up test data...")
    
    # Delete remaining vital signs
    for vs_id in created_vital_signs_ids[:]:
        try:
            requests.delete(f"{API_URL}/vital-signs/{vs_id}")
            created_vital_signs_ids.remove(vs_id)
        except:
            pass
    
    # Delete remaining patients
    for patient_id in created_patient_ids[:]:
        try:
            requests.delete(f"{API_URL}/patients/{patient_id}")
            created_patient_ids.remove(patient_id)
        except:
            pass

def main():
    """Run all tests"""
    print("🏥 Hospital Maternity Patient Tracker - Backend API Tests")
    print("=" * 60)
    
    # Basic connectivity
    if not test_api_root():
        print("❌ API not accessible, stopping tests")
        return
    
    # Patient Management Tests
    print("\n👥 Testing Patient Management APIs...")
    patient1 = test_create_patient()
    patient2 = test_create_second_patient()
    test_duplicate_patient_id()
    test_get_all_patients()
    test_search_patients()
    test_filter_patients()
    test_get_patient_by_id()
    test_update_patient()
    
    # Vital Signs Tests
    print("\n📊 Testing Vital Signs APIs...")
    test_create_vital_signs()
    test_create_vital_signs_invalid_patient()
    test_get_vital_signs()
    test_get_vital_signs_by_id()
    
    # Statistics Tests
    print("\n📈 Testing Statistics APIs...")
    test_statistics_overview()
    
    # Deletion Tests
    print("\n🗑️ Testing Deletion APIs...")
    test_delete_vital_signs()
    test_delete_patient()
    
    # Cleanup
    cleanup()
    
    # Results
    results.summary()
    
    return results.failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)