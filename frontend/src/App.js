import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [patients, setPatients] = useState([]);
  const [vitalSigns, setVitalSigns] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHighRisk, setFilterHighRisk] = useState(false);
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
  const fetchVitalSigns = async () => {
    try {
      const response = await axios.get(`${API}/vital-signs?limit=50`);
      setVitalSigns(response.data);
    } catch (error) {
      console.error('Error fetching vital signs:', error);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchStats();
    fetchVitalSigns();
  }, [searchQuery, filterHighRisk, filterWard]);

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.ward_statistics.map((ward) => (
              <div key={ward._id} className="bg-gray-100 p-4 rounded text-center">
                <p className="font-semibold">Ward {ward._id}</p>
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
      
      {/* Search and Filters */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <option value="1">Ward 1</option>
            <option value="2">Ward 2</option>
            <option value="3">Ward 3</option>
            <option value="4">Ward 4</option>
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
                {patient.high_risk === 'Yes' && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                    HIGH RISK
                  </span>
                )}
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">ID:</span> {patient.patient_id}</p>
                <p><span className="font-medium">Age:</span> {patient.age} years</p>
                <p><span className="font-medium">Ward:</span> {patient.ward_number} | <span className="font-medium">Bed:</span> {patient.bed_number}</p>
                <p><span className="font-medium">Diagnosis:</span> {patient.diagnosis}</p>
                <p><span className="font-medium">Admitted:</span> {new Date(patient.admission_date).toLocaleDateString()}</p>
                {patient.discharged === 'Yes' && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                    DISCHARGED
                  </span>
                )}
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={() => setCurrentView('add-vital-signs')}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  Log Vitals
                </button>
                <button className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Ward Number *</label>
              <select
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.ward_number}
                onChange={(e) => setFormData({...formData, ward_number: e.target.value})}
              >
                <option value="">Select Ward</option>
                <option value="1">Ward 1</option>
                <option value="2">Ward 2</option>
                <option value="3">Ward 3</option>
                <option value="4">Ward 4</option>
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

  // Vital Signs List Component
  const VitalSignsList = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Recent Vital Signs</h2>
      
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vitalSigns.map((vital) => (
                <tr key={vital.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vital.patient_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">W{vital.ward_number} / B{vital.bed_number}</div>
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
      case 'vital-signs':
        return <VitalSignsList />;
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