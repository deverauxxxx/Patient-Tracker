import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Ward list
const WARDS = ["Post op", "Gyne", "Ward 1", "Ward 2", "Ward 3", "Isolation room"];

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [vitalSigns, setVitalSigns] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHighRisk, setFilterHighRisk] = useState(false);
  const [filterDischarged, setFilterDischarged] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch patients
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterHighRisk) params.append('high_risk', 'true');
      if (filterDischarged) params.append('discharged', filterDischarged === 'yes' ? 'true' : 'false');
      if (filterWard) params.append('ward', filterWard);
      
      const response = await axios.get(`${API}/patients?${params}`);
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch overview stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats/overview`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch vital signs
  const fetchVitalSigns = async (patientId = null) => {
    try {
      const params = new URLSearchParams();
      if (patientId) params.append('patient_id', patientId);
      
      const response = await axios.get(`${API}/vital-signs?${params}&limit=50`);
      setVitalSigns(response.data);
    } catch (error) {
      console.error('Error fetching vital signs:', error);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchStats();
    fetchVitalSigns();
  }, [searchQuery, filterHighRisk, filterDischarged, filterWard]);

  // Navigation Component
  const Navigation = () => (
    <nav className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">🏥 Maternity Patient Tracker</h1>
        <div className="space-x-4">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 rounded ${currentView === 'dashboard' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('patients')}
            className={`px-4 py-2 rounded ${currentView === 'patients' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
          >
            Patients
          </button>
          <button
            onClick={() => setCurrentView('add-patient')}
            className={`px-4 py-2 rounded ${currentView === 'add-patient' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
          >
            Add Patient
          </button>
          <button
            onClick={() => setCurrentView('vital-signs')}
            className={`px-4 py-2 rounded ${currentView === 'vital-signs' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
          >
            Vital Signs
          </button>
        </div>
      </div>
    </nav>
  );

  // Dashboard Component
  const Dashboard = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Overview</h2>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-100 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-blue-800">Total Patients</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total_patients}</p>
          </div>
          <div className="bg-red-100 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-red-800">High Risk</h3>
            <p className="text-3xl font-bold text-red-600">{stats.high_risk_patients}</p>
          </div>
          <div className="bg-green-100 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-green-800">Discharged</h3>
            <p className="text-3xl font-bold text-green-600">{stats.discharged_patients}</p>
          </div>
          <div className="bg-purple-100 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-purple-800">Vital Records</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.recent_vital_signs}</p>
          </div>
        </div>
      )}

      {/* Ward Statistics */}
      {stats && stats.ward_statistics && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Ward Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.ward_statistics.map((ward) => (
              <div key={ward._id} className="bg-gray-100 p-4 rounded text-center">
                <p className="font-semibold">{ward._id}</p>
                <p className="text-2xl font-bold text-blue-600">{ward.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Patient List Component
  const PatientList = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Patient List</h2>
      
      {/* Advanced Search and Filters */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by name, ID, or ward..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterWard}
            onChange={(e) => setFilterWard(e.target.value)}
          >
            <option value="">All Wards</option>
            {WARDS.map(ward => (
              <option key={ward} value={ward}>{ward}</option>
            ))}
          </select>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterDischarged}
            onChange={(e) => setFilterDischarged(e.target.value)}
          >
            <option value="">All Patients</option>
            <option value="no">Active Only</option>
            <option value="yes">Discharged Only</option>
          </select>
          <label className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-gray-300">
            <input
              type="checkbox"
              checked={filterHighRisk}
              onChange={(e) => setFilterHighRisk(e.target.checked)}
              className="form-checkbox h-5 w-5 text-red-600"
            />
            <span>High Risk Only</span>
          </label>
        </div>
      </div>

      {/* Patient Cards */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading patients...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <div key={patient.id} className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${
              patient.high_risk === 'Yes' ? 'border-red-500' : 'border-blue-500'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{patient.full_name}</h3>
                <div className="flex flex-col space-y-1">
                  {patient.high_risk === 'Yes' && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                      HIGH RISK
                    </span>
                  )}
                  {patient.discharged === 'Yes' && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                      DISCHARGED
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">ID:</span> {patient.patient_id}</p>
                <p><span className="font-medium">Age:</span> {patient.age} years</p>
                <p><span className="font-medium">Ward:</span> {patient.ward_number} | <span className="font-medium">Bed:</span> {patient.bed_number}</p>
                <p><span className="font-medium">Diagnosis:</span> {patient.diagnosis}</p>
                <p><span className="font-medium">Admitted:</span> {new Date(patient.admission_date).toLocaleDateString()}</p>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={() => {
                    setSelectedPatient(patient);
                    setCurrentView('add-vital-signs');
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  Log Vitals
                </button>
                <button 
                  onClick={() => {
                    setSelectedPatient(patient);
                    setCurrentView('edit-patient');
                  }}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Add Patient Form Component
  const AddPatientForm = () => {
    const [formData, setFormData] = useState({
      patient_id: '',
      full_name: '',
      birthdate: '',
      address: '',
      ward_number: '',
      bed_number: '',
      admission_date: new Date().toISOString().split('T')[0],
      diagnosis: '',
      high_risk: 'No',
      notes: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await axios.post(`${API}/patients`, formData);
        alert('Patient added successfully!');
        setFormData({
          patient_id: '',
          full_name: '',
          birthdate: '',
          address: '',
          ward_number: '',
          bed_number: '',
          admission_date: new Date().toISOString().split('T')[0],
          diagnosis: '',
          high_risk: 'No',
          notes: ''
        });
        fetchPatients();
        fetchStats();
      } catch (error) {
        console.error('Error adding patient:', error);
        alert('Error adding patient. Please check all fields and try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Patient</h2>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient ID *</label>
              <input
                type="text"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.patient_id}
                onChange={(e) => setFormData({...formData, patient_id: e.target.value})}
                placeholder="e.g., MAT2025001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Birth Date *</label>
              <input
                type="date"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.birthdate}
                onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ward *</label>
              <select
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.ward_number}
                onChange={(e) => setFormData({...formData, ward_number: e.target.value})}
              >
                <option value="">Select Ward</option>
                {WARDS.map(ward => (
                  <option key={ward} value={ward}>{ward}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bed Number *</label>
              <input
                type="text"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.bed_number}
                onChange={(e) => setFormData({...formData, bed_number: e.target.value})}
                placeholder="e.g., A01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admission Date *</label>
              <input
                type="date"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.admission_date}
                onChange={(e) => setFormData({...formData, admission_date: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <textarea
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis *</label>
              <textarea
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
                value={formData.diagnosis}
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                placeholder="Primary diagnosis and relevant medical conditions"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">High Risk Status</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.high_risk}
                onChange={(e) => setFormData({...formData, high_risk: e.target.value})}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any additional notes or observations"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Adding Patient...' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Edit Patient Form Component
  const EditPatientForm = () => {
    const [formData, setFormData] = useState({
      full_name: selectedPatient?.full_name || '',
      address: selectedPatient?.address || '',
      ward_number: selectedPatient?.ward_number || '',
      bed_number: selectedPatient?.bed_number || '',
      admission_date: selectedPatient?.admission_date || '',
      diagnosis: selectedPatient?.diagnosis || '',
      high_risk: selectedPatient?.high_risk || 'No',
      discharged: selectedPatient?.discharged || 'No',
      notes: selectedPatient?.notes || ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        await axios.put(`${API}/patients/${selectedPatient.id}`, formData);
        alert('Patient updated successfully!');
        fetchPatients();
        fetchStats();
        setCurrentView('patients');
        setSelectedPatient(null);
      } catch (error) {
        console.error('Error updating patient:', error);
        alert('Error updating patient. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (!selectedPatient) {
      return (
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">No patient selected for editing.</p>
            <button 
              onClick={() => setCurrentView('patients')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Patients
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Edit Patient: {selectedPatient.full_name}</h2>
          <button 
            onClick={() => setCurrentView('patients')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Back to List
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 p-3 bg-gray-100 rounded">
              <p><strong>Patient ID:</strong> {selectedPatient.patient_id}</p>
              <p><strong>Age:</strong> {selectedPatient.age} years</p>
              <p><strong>Birth Date:</strong> {new Date(selectedPatient.birthdate).toLocaleDateString()}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ward *</label>
              <select
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.ward_number}
                onChange={(e) => setFormData({...formData, ward_number: e.target.value})}
              >
                <option value="">Select Ward</option>
                {WARDS.map(ward => (
                  <option key={ward} value={ward}>{ward}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bed Number *</label>
              <input
                type="text"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.bed_number}
                onChange={(e) => setFormData({...formData, bed_number: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admission Date *</label>
              <input
                type="date"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.admission_date}
                onChange={(e) => setFormData({...formData, admission_date: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <textarea
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis *</label>
              <textarea
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
                value={formData.diagnosis}
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">High Risk Status</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.high_risk}
                onChange={(e) => setFormData({...formData, high_risk: e.target.value})}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discharge Status</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.discharged}
                onChange={(e) => setFormData({...formData, discharged: e.target.value})}
              >
                <option value="No">Not Discharged</option>
                <option value="Yes">Discharged</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>
          
          <div className="mt-6 flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Updating Patient...' : 'Update Patient'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentView('patients');
                setSelectedPatient(null);
              }}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Vital Signs Logging Form Component
  const VitalSignsLoggingForm = () => {
    const [formData, setFormData] = useState({
      patient_id: selectedPatient?.id || '',
      monitoring_datetime: new Date().toISOString().slice(0, 16),
      blood_pressure: '',
      heart_rate: '',
      temperature: '',
      respiratory_rate: '',
      spo2: '',
      pain_score: '0',
      iv_fluids_type: '',
      iv_fluids_volume: '',
      iv_fluids_status: 'running',
      iv_medications: '',
      oral_intake: '',
      urine_output: '',
      other_output: '',
      additional_notes: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const submitData = {
          ...formData,
          heart_rate: parseInt(formData.heart_rate),
          temperature: parseFloat(formData.temperature),
          respiratory_rate: parseInt(formData.respiratory_rate),
          spo2: parseInt(formData.spo2),
          pain_score: parseInt(formData.pain_score),
          iv_fluids_volume: formData.iv_fluids_volume ? parseInt(formData.iv_fluids_volume) : null,
          urine_output: formData.urine_output ? parseInt(formData.urine_output) : null
        };

        await axios.post(`${API}/vital-signs`, submitData);
        alert('Vital signs recorded successfully!');
        setFormData({
          patient_id: selectedPatient?.id || '',
          monitoring_datetime: new Date().toISOString().slice(0, 16),
          blood_pressure: '',
          heart_rate: '',
          temperature: '',
          respiratory_rate: '',
          spo2: '',
          pain_score: '0',
          iv_fluids_type: '',
          iv_fluids_volume: '',
          iv_fluids_status: 'running',
          iv_medications: '',
          oral_intake: '',
          urine_output: '',
          other_output: '',
          additional_notes: ''
        });
        fetchVitalSigns();
        setCurrentView('vital-signs');
      } catch (error) {
        console.error('Error recording vital signs:', error);
        alert('Error recording vital signs. Please check all fields and try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Log Vital Signs {selectedPatient ? `- ${selectedPatient.full_name}` : ''}
          </h2>
          <button 
            onClick={() => setCurrentView('patients')}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Back to Patients
          </button>
        </div>

        {selectedPatient && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><strong>Patient:</strong> {selectedPatient.full_name}</div>
              <div><strong>ID:</strong> {selectedPatient.patient_id}</div>
              <div><strong>Ward:</strong> {selectedPatient.ward_number}</div>
              <div><strong>Bed:</strong> {selectedPatient.bed_number}</div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
          {/* Basic Vitals */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">📊 Basic Vital Signs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.monitoring_datetime}
                  onChange={(e) => setFormData({...formData, monitoring_datetime: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Blood Pressure *</label>
                <input
                  type="text"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.blood_pressure}
                  onChange={(e) => setFormData({...formData, blood_pressure: e.target.value})}
                  placeholder="e.g., 120/80"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Heart Rate (bpm) *</label>
                <input
                  type="number"
                  required
                  min="30"
                  max="200"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.heart_rate}
                  onChange={(e) => setFormData({...formData, heart_rate: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Temperature (°C) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min="30"
                  max="45"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.temperature}
                  onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Respiratory Rate *</label>
                <input
                  type="number"
                  required
                  min="8"
                  max="60"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.respiratory_rate}
                  onChange={(e) => setFormData({...formData, respiratory_rate: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SpO2 (%) *</label>
                <input
                  type="number"
                  required
                  min="70"
                  max="100"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.spo2}
                  onChange={(e) => setFormData({...formData, spo2: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Pain Assessment */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">😣 Pain Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pain Score (0-10) *</label>
                <select
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.pain_score}
                  onChange={(e) => setFormData({...formData, pain_score: e.target.value})}
                >
                  {[0,1,2,3,4,5,6,7,8,9,10].map(score => (
                    <option key={score} value={score}>
                      {score} - {score === 0 ? 'No pain' : score <= 3 ? 'Mild' : score <= 6 ? 'Moderate' : 'Severe'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* IV Fluids */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">💧 IV Fluids</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IV Fluids Type</label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.iv_fluids_type}
                  onChange={(e) => setFormData({...formData, iv_fluids_type: e.target.value})}
                  placeholder="e.g., D5LR, Normal Saline"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Volume (ml)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.iv_fluids_volume}
                  onChange={(e) => setFormData({...formData, iv_fluids_volume: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.iv_fluids_status}
                  onChange={(e) => setFormData({...formData, iv_fluids_status: e.target.value})}
                >
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="stopped">Stopped</option>
                </select>
              </div>
            </div>
          </div>

          {/* Medications */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">💊 Medications</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IV Medications</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                value={formData.iv_medications}
                onChange={(e) => setFormData({...formData, iv_medications: e.target.value})}
                placeholder="Name, dose, time given (e.g., Oxytocin 10IU, 0800hrs)"
              />
            </div>
          </div>

          {/* Intake & Output */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">🥤 Intake & Output</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Oral Intake</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  value={formData.oral_intake}
                  onChange={(e) => setFormData({...formData, oral_intake: e.target.value})}
                  placeholder="e.g., 250ml water, 50% meal consumed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urine Output (ml)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.urine_output}
                  onChange={(e) => setFormData({...formData, urine_output: e.target.value})}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Other Output</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  value={formData.other_output}
                  onChange={(e) => setFormData({...formData, other_output: e.target.value})}
                  placeholder="e.g., Vomitus 100ml, Stool - normal consistency"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">📝 Additional Notes</h3>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
              value={formData.additional_notes}
              onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
              placeholder="Any additional observations, concerns, or notes"
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Recording Vital Signs...' : 'Record Vital Signs'}
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('patients')}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Vital Signs List Component (Enhanced)
  const VitalSignsList = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Recent Vital Signs</h2>
        <button 
          onClick={() => setCurrentView('add-vital-signs')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Vital Signs
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ward/Bed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vitals</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IV/Meds</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vitalSigns.map((vital) => (
                <tr key={vital.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vital.patient_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vital.ward_number} / {vital.bed_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(vital.monitoring_datetime).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      BP: {vital.blood_pressure} | HR: {vital.heart_rate} | T: {vital.temperature}°C
                    </div>
                    <div className="text-sm text-gray-500">
                      RR: {vital.respiratory_rate} | SpO2: {vital.spo2}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      vital.pain_score >= 7 ? 'bg-red-100 text-red-800' :
                      vital.pain_score >= 4 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {vital.pain_score}/10
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {vital.iv_fluids_type && (
                        <div>IV: {vital.iv_fluids_type} {vital.iv_fluids_volume}ml ({vital.iv_fluids_status})</div>
                      )}
                      {vital.iv_medications && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          Meds: {vital.iv_medications}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return <PatientList />;
      case 'add-patient':
        return <AddPatientForm />;
      case 'edit-patient':
        return <EditPatientForm />;
      case 'vital-signs':
        return <VitalSignsList />;
      case 'add-vital-signs':
        return <VitalSignsLoggingForm />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      {renderCurrentView()}
    </div>
  );
}

export default App;