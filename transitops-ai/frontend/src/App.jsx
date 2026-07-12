import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Milestone, 
  Wrench, 
  CircleDollarSign, 
  BarChart3, 
  LogOut, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Sparkles, 
  Download, 
  Lock, 
  Mail, 
  Key,
  ShieldAlert,
  Settings,
  Calendar,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';

// API BASE URL is empty because Vite proxies requests to port 5000 in development
const API_URL = '';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('transitops_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      localStorage.removeItem('transitops_user');
      return null;
    }
  });

  
  const [currentTab, setCurrentTab] = useState('Dashboard');
  const [statsData, setStatsData] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [matchmakerData, setMatchmakerData] = useState({ matches: [] });
  
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  
  // Modals / Forms States
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    registration_number: '', model: '', vehicle_type: 'Van', capacity: '', odometer: '', acquisition_cost: '', region: 'North', status: 'Available'
  });
  
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [driverForm, setDriverForm] = useState({
    name: '', license_number: '', license_category: 'Class A', license_expiry: '', contact_number: '', safety_score: 95, status: 'Available'
  });
  
  const [showTripModal, setShowTripModal] = useState(false);
  const [tripForm, setTripForm] = useState({
    source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '', revenue: ''
  });
  
  const [showCompleteTripModal, setShowCompleteTripModal] = useState(false);
  const [completingTrip, setCompletingTrip] = useState(null);
  const [completionForm, setCompletionForm] = useState({
    actual_distance: '', odometer: '', fuel_litres: '', fuel_cost: '', revenue: '', expenses: []
  });
  
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintForm, setMaintForm] = useState({
    vehicle_id: '', maintenance_type: 'Routine Service', description: '', start_date: new Date().toISOString().substring(0, 10), expected_completion: '', cost: ''
  });
  const [showCompleteMaintModal, setShowCompleteMaintModal] = useState(false);
  const [completingMaint, setCompletingMaint] = useState(null);
  const [completeMaintForm, setCompleteMaintForm] = useState({ cost: '', completion_date: new Date().toISOString().substring(0, 10) });

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    vehicle_id: '', trip_id: '', expense_type: 'Toll', amount: '', description: '', date: new Date().toISOString().substring(0, 10)
  });

  const [vehicleFilter, setVehicleFilter] = useState('');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState('');

  // ----------------------------------------------------
  // ALERTS & LOADERS
  // ----------------------------------------------------
  const showAlert = (type, message, details = null) => {
    setAlert({ type, message, details });
    setTimeout(() => setAlert(null), 8000);
  };

  // Fetch all data
  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      
      const [statsRes, vehiclesRes, driversRes, tripsRes, maintRes, expensesRes, reportsRes, matchRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/stats`),
        fetch(`${API_URL}/api/vehicles`),
        fetch(`${API_URL}/api/drivers`),
        fetch(`${API_URL}/api/trips`),
        fetch(`${API_URL}/api/maintenance`),
        fetch(`${API_URL}/api/expenses`),
        fetch(`${API_URL}/api/reports`),
        fetch(`${API_URL}/api/matchmaker`)
      ]);
      
      if (statsRes.ok) setStatsData(await statsRes.json());
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
      if (driversRes.ok) setDrivers(await driversRes.json());
      if (tripsRes.ok) setTrips(await tripsRes.json());
      if (maintRes.ok) setMaintenance(await maintRes.json());
      if (expensesRes.ok) {
        const expData = await expensesRes.json();
        setExpenses(expData.expenses);
        setFuelLogs(expData.fuel_logs);
      }
      if (reportsRes.ok) setReportsData(await reportsRes.json());
      if (matchRes.ok) setMatchmakerData(await matchRes.json());

    } catch (err) {
      showAlert('error', 'Failed to connect to backend server. Is backend running?', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  // Handle Login
  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('transitops_user', JSON.stringify(data.user));
        setCurrentTab('Dashboard');
        showAlert('success', `Welcome back, ${data.user.name}! Logged in as ${data.user.role}.`);
      } else {
        showAlert('error', data.error || 'Authentication failed');
      }
    } catch (err) {
      showAlert('error', 'Login server error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('transitops_user');
    showAlert('success', 'Successfully logged out.');
  };

  // RBAC Permission check helper
  const checkPermission = (action) => {
    if (!user) return false;
    const role = user.role;
    
    // Permissions:
    // Fleet Manager: Vehicles, drivers, maintenance
    // Dispatcher: Create and manage trips
    // Financial Analyst: Fuel, expenses, reports
    if (role === 'Fleet Manager') {
      return ['Dashboard', 'Vehicles', 'Drivers', 'Maintenance', 'ViewVehicles', 'ViewDrivers', 'ManageVehicles', 'ManageDrivers', 'ManageMaintenance'].includes(action);
    }
    if (role === 'Dispatcher') {
      return ['Dashboard', 'Trips', 'ViewVehicles', 'ViewDrivers', 'ManageTrips', 'ViewTrips'].includes(action);
    }
    if (role === 'Financial Analyst') {
      return ['Dashboard', 'Expenses', 'Reports', 'ViewExpenses', 'ViewReports', 'ManageExpenses', 'ViewVehicles', 'ViewDrivers', 'ViewTrips'].includes(action);
    }
    return false;
  };

  // ----------------------------------------------------
  // VEHICLE CRUD
  // ----------------------------------------------------
  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!checkPermission('ManageVehicles')) {
      showAlert('error', 'Access Denied: You do not have permission to manage vehicles.');
      return;
    }
    setLoading(true);
    try {
      const method = editingVehicle ? 'PUT' : 'POST';
      const url = editingVehicle ? `${API_URL}/api/vehicles/${editingVehicle.id}` : `${API_URL}/api/vehicles`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleForm)
      });
      const data = await res.json();
      
      if (res.ok) {
        showAlert('success', `Vehicle ${vehicleForm.registration_number} saved successfully!`);
        setShowVehicleModal(false);
        setEditingVehicle(null);
        setVehicleForm({ registration_number: '', model: '', vehicle_type: 'Van', capacity: '', odometer: '', acquisition_cost: '', region: 'North', status: 'Available' });
        fetchAllData();
      } else {
        showAlert('error', data.error || 'Failed to save vehicle');
      }
    } catch (err) {
      showAlert('error', 'Vehicle service error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetireVehicle = async (id, reg) => {
    if (!checkPermission('ManageVehicles')) {
      showAlert('error', 'Access Denied: You do not have permission to retire vehicles.');
      return;
    }
    if (!confirm(`Are you sure you want to retire vehicle ${reg}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/vehicles/${id}/retire`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', `Vehicle ${reg} retired.`);
        fetchAllData();
      } else {
        showAlert('error', data.error || 'Failed to retire vehicle');
      }
    } catch (err) {
      showAlert('error', 'Vehicle service error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // DRIVER CRUD
  // ----------------------------------------------------
  const handleSaveDriver = async (e) => {
    e.preventDefault();
    if (!checkPermission('ManageDrivers')) {
      showAlert('error', 'Access Denied: You do not have permission to manage drivers.');
      return;
    }
    setLoading(true);
    try {
      const method = editingDriver ? 'PUT' : 'POST';
      const url = editingDriver ? `${API_URL}/api/drivers/${editingDriver.id}` : `${API_URL}/api/drivers`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverForm)
      });
      const data = await res.json();
      
      if (res.ok) {
        showAlert('success', `Driver ${driverForm.name} saved successfully!`);
        setShowDriverModal(false);
        setEditingDriver(null);
        setDriverForm({ name: '', license_number: '', license_category: 'Class A', license_expiry: '', contact_number: '', safety_score: 95, status: 'Available' });
        fetchAllData();
      } else {
        showAlert('error', data.error || 'Failed to save driver');
      }
    } catch (err) {
      showAlert('error', 'Driver service error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // TRIP PROCESSORS & DISPATCH
  // ----------------------------------------------------
  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!checkPermission('ManageTrips')) {
      showAlert('error', 'Access Denied: You do not have permission to create trips.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripForm)
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', `Trip draft from ${tripForm.source} to ${tripForm.destination} created!`);
        setShowTripModal(false);
        setTripForm({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '', revenue: '' });
        fetchAllData();
      } else {
        showAlert('error', data.error || 'Failed to create trip');
      }
    } catch (err) {
      showAlert('error', 'Trip service error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchTrip = async (id, tripDesc) => {
    if (!checkPermission('ManageTrips')) {
      showAlert('error', 'Access Denied: You do not have permission to dispatch trips.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/trips/${id}/dispatch`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', `Trip ${id} successfully dispatched! Status transitioned to On Trip.`);
        fetchAllData();
      } else {
        showAlert('error', 'Cannot dispatch trip.', data.details || [data.error]);
      }
    } catch (err) {
      showAlert('error', 'Dispatch engine error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTrip = async (id) => {
    if (!checkPermission('ManageTrips')) {
      showAlert('error', 'Access Denied: You do not have permission to cancel trips.');
      return;
    }
    if (!confirm('Are you sure you want to cancel this trip? Assigned vehicle and driver will be released.')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/trips/${id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', `Trip ${id} has been cancelled.`);
        fetchAllData();
      } else {
        showAlert('error', data.error || 'Failed to cancel trip');
      }
    } catch (err) {
      showAlert('error', 'Trip service error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTrip = async (e) => {
    e.preventDefault();
    if (!checkPermission('ManageTrips')) {
      showAlert('error', 'Access Denied: You do not have permission to complete trips.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/trips/${completingTrip.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completionForm)
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', `Trip ${completingTrip.id} completed successfully! Vehicle and driver released to Available.`);
        setShowCompleteTripModal(false);
        setCompletingTrip(null);
        setCompletionForm({ actual_distance: '', odometer: '', fuel_litres: '', fuel_cost: '', revenue: '', expenses: [] });
        fetchAllData();
      } else {
        showAlert('error', data.error || 'Failed to complete trip');
      }
    } catch (err) {
      showAlert('error', 'Trip service error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // MAINTENANCE PROCESSORS
  // ----------------------------------------------------
  const handleStartMaintenance = async (e) => {
    e.preventDefault();
    if (!checkPermission('ManageMaintenance')) {
      showAlert('error', 'Access Denied: You do not have permission to manage maintenance.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintForm)
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', 'Maintenance record created. Vehicle status transitioned to In Shop.');
        setShowMaintModal(false);
        setMaintForm({ vehicle_id: '', maintenance_type: 'Routine Service', description: '', start_date: new Date().toISOString().substring(0, 10), expected_completion: '', cost: '' });
        fetchAllData();
      } else {
        showAlert('error', data.error || 'Failed to start maintenance');
      }
    } catch (err) {
      showAlert('error', 'Maintenance service error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMaint = async (e) => {
    e.preventDefault();
    if (!checkPermission('ManageMaintenance')) {
      showAlert('error', 'Access Denied: You do not have permission to close maintenance.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/maintenance/${completingMaint.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeMaintForm)
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', 'Maintenance completed successfully. Vehicle returned to Available.');
        setShowCompleteMaintModal(false);
        setCompletingMaint(null);
        setCompleteMaintForm({ cost: '', completion_date: new Date().toISOString().substring(0, 10) });
        fetchAllData();
      } else {
        showAlert('error', data.error || 'Failed to complete maintenance');
      }
    } catch (err) {
      showAlert('error', 'Maintenance service error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMaint = async (id) => {
    if (!checkPermission('ManageMaintenance')) {
      showAlert('error', 'Access Denied: You do not have permission to manage maintenance.');
      return;
    }
    if (!confirm('Are you sure you want to cancel this maintenance? Vehicle status will return to Available.')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/maintenance/${id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', 'Maintenance cancelled. Vehicle returned to Available.');
        fetchAllData();
      } else {
        showAlert('error', data.error || 'Failed to cancel maintenance');
      }
    } catch (err) {
      showAlert('error', 'Maintenance service error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // EXPENSES PROCESSORS
  // ----------------------------------------------------
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!checkPermission('ManageExpenses')) {
      showAlert('error', 'Access Denied: You do not have permission to record expenses.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      });
      const data = await res.json();
      if (res.ok) {
        showAlert('success', 'Expense recorded successfully!');
        setShowExpenseModal(false);
        setExpenseForm({ vehicle_id: '', trip_id: '', expense_type: 'Toll', amount: '', description: '', date: new Date().toISOString().substring(0, 10) });
        fetchAllData();
      } else {
        showAlert('error', data.error || 'Failed to save expense');
      }
    } catch (err) {
      showAlert('error', 'Expense service error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // CSV EXPORT GENERATOR
  // ----------------------------------------------------
  const handleExportCSV = (type) => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (type === 'vehicles') {
      headers = ['ID', 'Registration Number', 'Model', 'Type', 'Capacity (kg)', 'Odometer (km)', 'Acquisition Cost ($)', 'Region', 'Status'];
      rows = vehicles.map(v => [v.id, v.registration_number, v.model, v.vehicle_type, v.capacity, v.odometer, v.acquisition_cost, v.region, v.status]);
      filename = 'transitops_vehicles.csv';
    } else if (type === 'drivers') {
      headers = ['ID', 'Name', 'License Number', 'Category', 'Expiry Date', 'Contact Number', 'Safety Score', 'Status'];
      rows = drivers.map(d => [d.id, d.name, d.license_number, d.license_category, d.license_expiry, d.contact_number, d.safety_score, d.status]);
      filename = 'transitops_drivers.csv';
    } else if (type === 'trips') {
      headers = ['ID', 'Source', 'Destination', 'Vehicle ID', 'Driver ID', 'Cargo Weight (kg)', 'Planned Dist (km)', 'Actual Dist (km)', 'Revenue ($)', 'Status', 'Start Date', 'Completion Date'];
      rows = trips.map(t => [t.id, t.source, t.destination, t.vehicle_id, t.driver_id, t.cargo_weight, t.planned_distance, t.actual_distance || '', t.revenue, t.status, t.start_date || '', t.completion_date || '']);
      filename = 'transitops_trips.csv';
    } else if (type === 'expenses') {
      headers = ['ID', 'Vehicle ID', 'Trip ID', 'Type', 'Amount ($)', 'Description', 'Date'];
      rows = expenses.map(e => [e.id, e.vehicle_id, e.trip_id || 'N/A', e.expense_type, e.amount, e.description, e.date]);
      filename = 'transitops_expenses.csv';
    }

    if (rows.length === 0) {
      showAlert('error', 'No data available to export.');
      return;
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert('success', `Exported ${filename} successfully!`);
  };

  // ----------------------------------------------------
  // LOGIN SCREEN
  // ----------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        {/* Decorative ambient background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md p-8 glass-panel border-slate-800/80 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-400 mb-3 glow-blue">
              <Truck size={32} />
            </div>
            <h1 className="text-3xl font-extrabold font-sans tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-emerald-400 bg-clip-text text-transparent">
              TransitOps AI
            </h1>
            <p className="text-sm text-slate-400 mt-2 font-light">
              Intelligent Fleet Dispatch & Decision Support
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleLogin(formData.get('email'), formData.get('password'));
          }} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Mail size={16} /></span>
                <input required type="email" name="email" className="w-full glass-input pl-10" placeholder="user@transitops.com" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Key size={16} /></span>
                <input required type="password" name="password" className="w-full glass-input pl-10" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Login Shortcuts */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">Demo Quick Login</h3>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => handleLogin('manager@transitops.com', 'manager123')} className="py-2 px-3 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 rounded-lg text-xs text-left flex items-center justify-between text-slate-300 transition-colors">
                <div>
                  <span className="font-semibold block text-slate-200">Fleet Manager</span>
                  <span className="text-[10px] text-slate-500">Manage vehicles, drivers, maintenance</span>
                </div>
                <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-900/50 rounded-full font-mono text-[10px]">manager123</span>
              </button>

              <button onClick={() => handleLogin('dispatcher@transitops.com', 'dispatcher123')} className="py-2 px-3 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 rounded-lg text-xs text-left flex items-center justify-between text-slate-300 transition-colors">
                <div>
                  <span className="font-semibold block text-slate-200">Dispatcher</span>
                  <span className="text-[10px] text-slate-500">Create, dispatch, and cancel trips</span>
                </div>
                <span className="px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-900/50 rounded-full font-mono text-[10px]">dispatcher123</span>
              </button>

              <button onClick={() => handleLogin('analyst@transitops.com', 'analyst123')} className="py-2 px-3 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 rounded-lg text-xs text-left flex items-center justify-between text-slate-300 transition-colors">
                <div>
                  <span className="font-semibold block text-slate-200">Financial Analyst</span>
                  <span className="text-[10px] text-slate-500">Monitor fuel logs, expenses, ROI reports</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900/50 rounded-full font-mono text-[10px]">analyst123</span>
              </button>
            </div>
          </div>
        </div>

        {alert && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-slate-900 border border-red-900/40 text-slate-100 p-4 rounded-xl shadow-2xl animate-bounce">
            <XCircle className="text-red-500" />
            <div>
              <p className="font-semibold text-sm">{alert.message}</p>
              {alert.details && <p className="text-xs text-slate-400 mt-1">{alert.details}</p>}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN SYSTEM DESKTOP LAYOUT
  // ----------------------------------------------------
  const sidebarTabs = [
    { name: 'Dashboard', icon: LayoutDashboard, access: 'Dashboard' },
    { name: 'Vehicles', icon: Truck, access: 'ViewVehicles' },
    { name: 'Drivers', icon: Users, access: 'ViewDrivers' },
    { name: 'Trips', icon: Milestone, access: 'ViewTrips' },
    { name: 'Maintenance', icon: Wrench, access: 'ManageMaintenance' },
    { name: 'Expenses', icon: CircleDollarSign, access: 'ViewExpenses' },
    { name: 'Reports', icon: BarChart3, access: 'ViewReports' }
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900/60 border-r border-slate-800/80 flex flex-col justify-between flex-shrink-0 z-20">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl glow-blue">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-200 bg-clip-text text-transparent">
                TransitOps AI
              </h2>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Hackathon MVP</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {sidebarTabs.map((tab) => {
              const Icon = tab.icon;
              const hasAccess = checkPermission(tab.access);
              const isActive = currentTab === tab.name;
              
              return (
                <button
                  key={tab.name}
                  disabled={!hasAccess}
                  onClick={() => setCurrentTab(tab.name)}
                  className={`w-full flex items-center justify-between py-2.5 px-4 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400 font-semibold shadow-inner shadow-blue-900/5 glow-blue' 
                      : hasAccess
                        ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'
                        : 'text-slate-600 cursor-not-allowed opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span className="text-sm">{tab.name}</span>
                  </div>
                  {!hasAccess && <Lock size={12} className="text-slate-600" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card Profile & Logout */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center gap-3 px-2 py-1 bg-slate-950/40 rounded-xl border border-slate-800/40">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-blue-400 border border-blue-900/30">
              {user.name.split(' ').map(n=>n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <span className="block text-xs font-semibold text-slate-200 truncate">{user.name}</span>
              <span className="block text-[10px] text-blue-400 font-mono font-medium truncate">{user.role}</span>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-900/60 text-red-400 rounded-lg text-xs font-semibold transition-all">
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT SCREEN */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10">
        
        {/* Top Header Controls */}
        <header className="h-16 border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold font-sans text-slate-100">{currentTab}</h1>
            {loading && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 text-slate-400 rounded border border-slate-800 text-[10px] animate-pulse">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                Processing...
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-mono">
              System Time: {new Date().toISOString().substring(0, 16).replace('T', ' ')}
            </span>
            <button onClick={fetchAllData} className="p-1.5 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* Global Notifications Panel */}
        {alert && (
          <div className="m-8 mb-0 p-4 rounded-xl border flex gap-3 animate-fade-in relative z-40 bg-slate-900 border-slate-800">
            {alert.type === 'success' ? (
              <CheckCircle2 className="text-emerald-500 flex-shrink-0" />
            ) : alert.type === 'error' ? (
              <XCircle className="text-red-500 flex-shrink-0" />
            ) : (
              <AlertTriangle className="text-amber-500 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-200">{alert.message}</h4>
              {alert.details && (
                <div className="mt-2 text-xs text-slate-400 font-mono space-y-1 bg-slate-950/60 p-2 rounded-lg max-h-40 overflow-y-auto">
                  {Array.isArray(alert.details) ? (
                    alert.details.map((d, i) => <div key={i}>• {d}</div>)
                  ) : (
                    <div>{alert.details}</div>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => setAlert(null)} className="text-xs text-slate-500 hover:text-slate-300">Dismiss</button>
          </div>
        )}

        {/* Dynamic Pages Area */}
        <div className="p-8 flex-1">
          {currentTab === 'Dashboard' && statsData && (
            <div className="space-y-8 animate-fade-in">
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="glass-card p-5">
                  <div className="flex justify-between items-start text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Fleet Strength</span>
                    <Truck size={18} className="text-blue-500" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-slate-100">{statsData.stats.totalVehicles}</span>
                    <span className="text-xs text-slate-500">Vehicles total</span>
                  </div>
                  <div className="mt-2 flex gap-2 text-[10px] text-slate-500 font-medium">
                    <span className="px-1.5 py-0.5 bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 rounded">{statsData.stats.availableVehicles} Available</span>
                    <span className="px-1.5 py-0.5 bg-amber-950/50 text-amber-400 border border-amber-900/30 rounded">{statsData.stats.inShopVehicles} In Shop</span>
                  </div>
                </div>

                <div className="glass-card p-5">
                  <div className="flex justify-between items-start text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Active Operations</span>
                    <Milestone size={18} className="text-indigo-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-slate-100">{statsData.stats.activeTrips}</span>
                    <span className="text-xs text-slate-500">Trips running</span>
                  </div>
                  <div className="mt-2 flex gap-2 text-[10px] text-slate-500 font-medium">
                    <span className="px-1.5 py-0.5 bg-blue-950/50 text-blue-400 border border-blue-900/30 rounded">{statsData.stats.onTripVehicles} Vehicles on Trip</span>
                  </div>
                </div>

                <div className="glass-card p-5">
                  <div className="flex justify-between items-start text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Active Drivers</span>
                    <Users size={18} className="text-purple-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-slate-100">{statsData.stats.totalDrivers}</span>
                    <span className="text-xs text-slate-500">Drivers total</span>
                  </div>
                  <div className="mt-2 flex gap-2 text-[10px] text-slate-500 font-medium">
                    <span className="px-1.5 py-0.5 bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 rounded">{statsData.stats.availableDrivers} Available</span>
                    <span className="px-1.5 py-0.5 bg-red-950/50 text-red-400 border border-red-900/30 rounded">{statsData.stats.suspendedDrivers} Suspended</span>
                  </div>
                </div>

                <div className="glass-card p-5 relative overflow-hidden glow-blue">
                  <div className="flex justify-between items-start text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Fleet Utilization</span>
                    <Sparkles size={18} className="text-yellow-400 animate-pulse" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-slate-100">{statsData.stats.fleetUtilization}%</span>
                    <span className="text-xs text-slate-500">Utilization Rate</span>
                  </div>
                  <div className="mt-3 w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full" style={{ width: `${statsData.stats.fleetUtilization}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Operations Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Status Distribution */}
                <div className="glass-panel p-6 lg:col-span-1 flex flex-col justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Vehicle Status Distribution</h3>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statsData.charts.statusDistribution}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statsData.charts.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Monthly Fuel Costs */}
                <div className="glass-panel p-6 lg:col-span-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Monthly Fuel Expenses ($)</h3>
                  <div className="h-64">
                    {statsData.charts.monthlyFuelData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statsData.charts.monthlyFuelData}>
                          <XAxis dataKey="month" stroke="#64748b" tickLine={false} />
                          <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                          <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500 text-sm">No completed fuel logs found.</div>
                    )}
                  </div>
                </div>

                {/* 3. Cost by Vehicle */}
                <div className="glass-panel p-6 lg:col-span-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Operational Cost Breakdown by Vehicle ($)</h3>
                  <div className="h-72">
                    {statsData.charts.operationalCostByVehicle.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statsData.charts.operationalCostByVehicle}>
                          <XAxis dataKey="reg" stroke="#64748b" tickLine={false} />
                          <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                          <Legend />
                          <Bar dataKey="fuel" stackId="a" fill="#3b82f6" name="Fuel Cost" />
                          <Bar dataKey="maintenance" stackId="a" fill="#f59e0b" name="Maintenance" />
                          <Bar dataKey="other" stackId="a" fill="#8b5cf6" name="Other Expenses" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500 text-sm">No active expense reports found.</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* VEHICLES PAGE */}
          {currentTab === 'Vehicles' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Search size={16} /></span>
                    <input type="text" value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} className="w-full glass-input pl-10" placeholder="Search registration or model..." />
                  </div>
                  <select value={vehicleStatusFilter} onChange={(e) => setVehicleStatusFilter(e.target.value)} className="glass-input">
                    <option value="">All Statuses</option>
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                {checkPermission('ManageVehicles') && (
                  <button onClick={() => { setEditingVehicle(null); setVehicleForm({ registration_number: '', model: '', vehicle_type: 'Van', capacity: '', odometer: '', acquisition_cost: '', region: 'North', status: 'Available' }); setShowVehicleModal(true); }} className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/10 flex items-center gap-2 text-sm transition-all">
                    <Plus size={16} />
                    <span>Register Vehicle</span>
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="glass-panel overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900/30">
                      <th className="py-4 px-6">Registration</th>
                      <th className="py-4 px-6">Model</th>
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6 text-right">Capacity (kg)</th>
                      <th className="py-4 px-6 text-right">Odometer (km)</th>
                      <th className="py-4 px-6 text-right">Acq. Cost</th>
                      <th className="py-4 px-6">Region</th>
                      <th className="py-4 px-6">Status</th>
                      {checkPermission('ManageVehicles') && <th className="py-4 px-6 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {vehicles
                      .filter(v => {
                        const matchesText = v.registration_number.toLowerCase().includes(vehicleFilter.toLowerCase()) || v.model.toLowerCase().includes(vehicleFilter.toLowerCase());
                        const matchesStatus = vehicleStatusFilter === '' || v.status === vehicleStatusFilter;
                        return matchesText && matchesStatus;
                      })
                      .map(v => (
                        <tr key={v.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-blue-400">{v.registration_number}</td>
                          <td className="py-4 px-6 font-medium text-slate-200">{v.model}</td>
                          <td className="py-4 px-6 text-slate-400">{v.vehicle_type}</td>
                          <td className="py-4 px-6 text-right font-mono">{v.capacity.toLocaleString()}</td>
                          <td className="py-4 px-6 text-right font-mono">{v.odometer.toLocaleString()}</td>
                          <td className="py-4 px-6 text-right font-mono">${v.acquisition_cost.toLocaleString()}</td>
                          <td className="py-4 px-6 text-slate-400">{v.region}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              v.status === 'Available' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/40' :
                              v.status === 'On Trip' ? 'bg-blue-950/60 text-blue-400 border-blue-900/40' :
                              v.status === 'In Shop' ? 'bg-amber-950/60 text-amber-400 border-amber-900/40' :
                              'bg-red-950/60 text-red-400 border-red-900/40'
                            }`}>
                              {v.status}
                            </span>
                          </td>
                          {checkPermission('ManageVehicles') && (
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                <button disabled={v.status === 'Retired'} onClick={() => { setEditingVehicle(v); setVehicleForm(v); setShowVehicleModal(true); }} className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-xs transition-colors disabled:opacity-45">
                                  Edit
                                </button>
                                <button disabled={v.status === 'Retired' || v.status === 'On Trip'} onClick={() => handleRetireVehicle(v.id, v.registration_number)} className="py-1 px-2.5 bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/30 rounded font-semibold text-xs transition-colors disabled:opacity-45">
                                  Retire
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DRIVERS PAGE */}
          {currentTab === 'Drivers' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500"><Search size={16} /></span>
                    <input type="text" value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} className="w-full glass-input pl-10" placeholder="Search driver name or DL..." />
                  </div>
                  <select value={driverStatusFilter} onChange={(e) => setDriverStatusFilter(e.target.value)} className="glass-input">
                    <option value="">All Statuses</option>
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                {checkPermission('ManageDrivers') && (
                  <button onClick={() => { setEditingDriver(null); setDriverForm({ name: '', license_number: '', license_category: 'Class A', license_expiry: '', contact_number: '', safety_score: 95, status: 'Available' }); setShowDriverModal(true); }} className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/10 flex items-center gap-2 text-sm transition-all">
                    <Plus size={16} />
                    <span>Register Driver</span>
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="glass-panel overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900/30">
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">License Details</th>
                      <th className="py-4 px-6">License Expiry</th>
                      <th className="py-4 px-6">Contact Number</th>
                      <th className="py-4 px-6 text-center">Safety Score</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">System Warnings</th>
                      {checkPermission('ManageDrivers') && <th className="py-4 px-6 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {drivers
                      .filter(d => {
                        const matchesText = d.name.toLowerCase().includes(driverFilter.toLowerCase()) || d.license_number.toLowerCase().includes(driverFilter.toLowerCase());
                        const matchesStatus = driverStatusFilter === '' || d.status === driverStatusFilter;
                        return matchesText && matchesStatus;
                      })
                      .map(d => (
                        <tr key={d.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-4 px-6 font-semibold text-slate-200">{d.name}</td>
                          <td className="py-4 px-6 font-mono text-xs">
                            <span className="block text-slate-300">{d.license_number}</span>
                            <span className="text-slate-500 text-[10px]">{d.license_category}</span>
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-350">{d.license_expiry}</td>
                          <td className="py-4 px-6 text-slate-400">{d.contact_number}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-2 py-0.5 font-mono font-bold rounded ${
                              d.safety_score >= 90 ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/30' :
                              d.safety_score >= 75 ? 'text-amber-400 bg-amber-950/40 border border-amber-900/30' :
                              'text-red-400 bg-red-950/40 border border-red-900/30'
                            }`}>
                              {d.safety_score}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              d.status === 'Available' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/40' :
                              d.status === 'On Trip' ? 'bg-blue-950/60 text-blue-400 border-blue-900/40' :
                              d.status === 'Off Duty' ? 'bg-slate-900 text-slate-400 border-slate-800' :
                              'bg-red-950/60 text-red-400 border-red-900/40 animate-pulse'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {d.warning ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded border text-[11px] font-medium ${
                                d.isExpired || d.status === 'Suspended' 
                                  ? 'bg-red-950/60 text-red-400 border-red-900/40' 
                                  : 'bg-amber-950/60 text-amber-400 border-amber-900/40'
                              }`}>
                                <AlertTriangle size={12} />
                                {d.warning}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          {checkPermission('ManageDrivers') && (
                            <td className="py-4 px-6 text-center">
                              <button onClick={() => { setEditingDriver(d); setDriverForm(d); setShowDriverModal(true); }} className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-xs transition-colors">
                                Edit
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TRIPS PAGE */}
          {currentTab === 'Trips' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <select value={tripStatusFilter} onChange={(e) => setTripStatusFilter(e.target.value)} className="glass-input">
                    <option value="">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {checkPermission('ManageTrips') && (
                  <button onClick={() => { setTripForm({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '', revenue: '' }); setShowTripModal(true); }} className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/10 flex items-center gap-2 text-sm transition-all">
                    <Plus size={16} />
                    <span>Create Trip Record</span>
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="glass-panel overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900/30">
                      <th className="py-4 px-6">Trip ID</th>
                      <th className="py-4 px-6">Route</th>
                      <th className="py-4 px-6">Assigned Assets</th>
                      <th className="py-4 px-6 text-right">Cargo</th>
                      <th className="py-4 px-6 text-right">Distance</th>
                      <th className="py-4 px-6 text-right">Est. Revenue</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {trips
                      .filter(t => tripStatusFilter === '' || t.status === tripStatusFilter)
                      .map(t => {
                        const veh = vehicles.find(v => v.id === t.vehicle_id);
                        const drv = drivers.find(d => d.id === t.driver_id);
                        
                        return (
                          <tr key={t.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="py-4 px-6 font-mono font-bold text-slate-300">{t.id}</td>
                            <td className="py-4 px-6">
                              <span className="block font-medium text-slate-200">{t.source}</span>
                              <span className="text-slate-500 text-xs">to {t.destination}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="block font-mono text-xs text-blue-400 font-bold">{veh ? veh.registration_number : 'Unknown'}</span>
                              <span className="text-slate-400 text-xs">{drv ? drv.name : 'Unknown'}</span>
                            </td>
                            <td className="py-4 px-6 text-right font-mono">{t.cargo_weight.toLocaleString()} kg</td>
                            <td className="py-4 px-6 text-right font-mono">
                              {t.actual_distance ? `${t.actual_distance} km (act)` : `${t.planned_distance} km (plan)`}
                            </td>
                            <td className="py-4 px-6 text-right font-mono text-emerald-400 font-semibold">${t.revenue.toLocaleString()}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                t.status === 'Draft' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                                t.status === 'Dispatched' ? 'bg-blue-950/60 text-blue-400 border-blue-900/40 animate-pulse' :
                                t.status === 'Completed' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/40' :
                                'bg-red-950/60 text-red-400 border-red-900/40'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-1.5">
                                {t.status === 'Draft' && checkPermission('ManageTrips') && (
                                  <button onClick={() => handleDispatchTrip(t.id)} className="py-1 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-xs transition-colors">
                                    Dispatch
                                  </button>
                                )}
                                {t.status === 'Dispatched' && checkPermission('ManageTrips') && (
                                  <>
                                    <button onClick={() => { setCompletingTrip(t); setCompletionForm({ actual_distance: t.planned_distance, odometer: veh ? veh.odometer + t.planned_distance : '', fuel_litres: '', fuel_cost: '', revenue: t.revenue, expenses: [] }); setShowCompleteTripModal(true); }} className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs transition-colors">
                                      Complete
                                    </button>
                                    <button onClick={() => handleCancelTrip(t.id)} className="py-1 px-2.5 bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/30 rounded font-semibold text-xs transition-colors">
                                      Cancel
                                    </button>
                                  </>
                                )}
                                {(t.status === 'Completed' || t.status === 'Cancelled') && (
                                  <span className="text-slate-500 text-xs italic">Finalized</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MAINTENANCE PAGE */}
          {currentTab === 'Maintenance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-end">
                {checkPermission('ManageMaintenance') && (
                  <button onClick={() => { setMaintForm({ vehicle_id: '', maintenance_type: 'Routine Service', description: '', start_date: new Date().toISOString().substring(0, 10), expected_completion: '', cost: '' }); setShowMaintModal(true); }} className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/10 flex items-center gap-2 text-sm transition-all">
                    <Plus size={16} />
                    <span>Record Maintenance</span>
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="glass-panel overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900/30">
                      <th className="py-4 px-6">Vehicle</th>
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6">Description</th>
                      <th className="py-4 px-6">Start Date</th>
                      <th className="py-4 px-6">Completion Date</th>
                      <th className="py-4 px-6 text-right">Cost</th>
                      <th className="py-4 px-6">Status</th>
                      {checkPermission('ManageMaintenance') && <th className="py-4 px-6 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {maintenance.map(m => {
                      const veh = vehicles.find(v => v.id === m.vehicle_id);
                      return (
                        <tr key={m.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-blue-400">{veh ? veh.registration_number : 'Unknown'}</td>
                          <td className="py-4 px-6 font-semibold text-slate-200">{m.maintenance_type}</td>
                          <td className="py-4 px-6 text-slate-400">{m.description || '—'}</td>
                          <td className="py-4 px-6 font-mono">{m.start_date}</td>
                          <td className="py-4 px-6 font-mono">{m.completion_date || 'In Progress'}</td>
                          <td className="py-4 px-6 text-right font-mono text-amber-400">${m.cost.toLocaleString()}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              m.status === 'Active' ? 'bg-amber-950/60 text-amber-400 border-amber-900/40 animate-pulse' :
                              m.status === 'Completed' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/40' :
                              'bg-red-950/60 text-red-400 border-red-900/40'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                          {checkPermission('ManageMaintenance') && (
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-1.5">
                                {m.status === 'Active' ? (
                                  <>
                                    <button onClick={() => { setCompletingMaint(m); setCompleteMaintForm({ cost: m.cost, completion_date: new Date().toISOString().substring(0, 10) }); setShowCompleteMaintModal(true); }} className="py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs transition-colors">
                                      Close
                                    </button>
                                    <button onClick={() => handleCancelMaint(m.id)} className="py-1 px-2 bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-900/30 rounded font-semibold text-xs transition-colors">
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-slate-500 text-xs italic">Closed</span>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EXPENSES PAGE */}
          {currentTab === 'Expenses' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-end">
                {checkPermission('ManageExpenses') && (
                  <button onClick={() => { setExpenseForm({ vehicle_id: '', trip_id: '', expense_type: 'Toll', amount: '', description: '', date: new Date().toISOString().substring(0, 10) }); setShowExpenseModal(true); }} className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/10 flex items-center gap-2 text-sm transition-all">
                    <Plus size={16} />
                    <span>Record Expense</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Fuel Logs */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <Sparkles size={18} className="text-blue-400" />
                    <span>Fuel Dispensation Ledger</span>
                  </h3>
                  <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900/30">
                          <th className="py-3 px-4">Vehicle</th>
                          <th className="py-3 px-4">Trip</th>
                          <th className="py-3 px-4 text-right">Volume</th>
                          <th className="py-3 px-4 text-right">Cost</th>
                          <th className="py-3 px-4 text-right">Odometer</th>
                          <th className="py-3 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                        {fuelLogs.map(log => {
                          const veh = vehicles.find(v => v.id === log.vehicle_id);
                          return (
                            <tr key={log.id} className="hover:bg-slate-900/10">
                              <td className="py-3 px-4 text-blue-400 font-bold">{veh ? veh.registration_number : 'Unknown'}</td>
                              <td className="py-3 px-4 text-slate-400">{log.trip_id}</td>
                              <td className="py-3 px-4 text-right">{log.litres} L</td>
                              <td className="py-3 px-4 text-right text-emerald-400 font-semibold">${log.cost}</td>
                              <td className="py-3 px-4 text-right">{log.odometer.toLocaleString()} km</td>
                              <td className="py-3 px-4 text-slate-500">{log.date}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Operations Expenses */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                    <CircleDollarSign size={18} className="text-purple-400" />
                    <span>Ancillary Incident Expenses</span>
                  </h3>
                  <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900/30">
                          <th className="py-3 px-4">Vehicle</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                        {expenses.map(exp => {
                          const veh = vehicles.find(v => v.id === exp.vehicle_id);
                          return (
                            <tr key={exp.id} className="hover:bg-slate-900/10">
                              <td className="py-3 px-4 text-blue-400 font-bold">{veh ? veh.registration_number : 'Unknown'}</td>
                              <td className="py-3 px-4 text-slate-200 font-semibold">{exp.expense_type}</td>
                              <td className="py-3 px-4 text-slate-400 font-sans">{exp.description || '—'}</td>
                              <td className="py-3 px-4 text-right text-purple-400 font-semibold">${exp.amount}</td>
                              <td className="py-3 px-4 text-slate-500">{exp.date}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS PAGE */}
          {currentTab === 'Reports' && reportsData && (
            <div className="space-y-8 animate-fade-in">
              {/* Grand summary row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="glass-card p-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Revenue (Completed)</span>
                  <span className="text-3xl font-extrabold font-mono text-emerald-400 mt-2 block">${reportsData.fleetWide.grandTotalRevenue.toLocaleString()}</span>
                </div>
                <div className="glass-card p-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Grand Operational Cost</span>
                  <span className="text-3xl font-extrabold font-mono text-purple-400 mt-2 block">${reportsData.fleetWide.grandTotalOperationalCost.toLocaleString()}</span>
                  <div className="mt-2 flex gap-2 text-[10px] text-slate-500 font-mono">
                    <span>Fuel: ${reportsData.fleetWide.totalFuelCost}</span>
                    <span>Maint: ${reportsData.fleetWide.totalMaintCost}</span>
                    <span>Other: ${reportsData.fleetWide.totalOtherCost}</span>
                  </div>
                </div>
                <div className="glass-card p-5 glow-emerald">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Grand Net Profit</span>
                  <span className={`text-3xl font-extrabold font-mono mt-2 block ${reportsData.fleetWide.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${reportsData.fleetWide.totalNetProfit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* CSV Export Panel */}
              <div className="glass-panel p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Export Operational Ledger (CSV)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button onClick={() => handleExportCSV('vehicles')} className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:border-slate-700 transition-colors">
                    <Download size={14} className="text-blue-400" />
                    <span>Vehicles Directory</span>
                  </button>
                  <button onClick={() => handleExportCSV('drivers')} className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:border-slate-700 transition-colors">
                    <Download size={14} className="text-purple-400" />
                    <span>Drivers Directory</span>
                  </button>
                  <button onClick={() => handleExportCSV('trips')} className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:border-slate-700 transition-colors">
                    <Download size={14} className="text-indigo-400" />
                    <span>Trips Log</span>
                  </button>
                  <button onClick={() => handleExportCSV('expenses')} className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:border-slate-700 transition-colors">
                    <Download size={14} className="text-emerald-400" />
                    <span>Expenses Log</span>
                  </button>
                </div>
              </div>

              {/* Table ROI and Efficiency */}
              <div className="glass-panel overflow-hidden">
                <div className="p-5 border-b border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Vehicle Efficiency & Investment Return</h3>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900/30">
                      <th className="py-4 px-6">Vehicle</th>
                      <th className="py-4 px-6">Acq. Cost</th>
                      <th className="py-4 px-6 text-right">Total Op. Cost</th>
                      <th className="py-4 px-6 text-right">Revenue</th>
                      <th className="py-4 px-6 text-right">Fuel efficiency</th>
                      <th className="py-4 px-6 text-center">ROI (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {reportsData.vehicles.map(rep => (
                      <tr key={rep.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-4 px-6">
                          <span className="block font-mono font-bold text-blue-400">{rep.registration_number}</span>
                          <span className="text-[11px] text-slate-500">{rep.model}</span>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-350">${rep.acquisition_cost.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right font-mono text-purple-400 font-medium">${rep.totalOperationalCost.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right font-mono text-emerald-400 font-semibold">${rep.totalRevenue.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right font-mono text-blue-400">
                          {rep.fuelEfficiency > 0 ? `${rep.fuelEfficiency} km/L` : '—'}
                          <span className="block text-[10px] text-slate-500">{rep.fuelLitres} L / {rep.totalDistance} km</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                            rep.roi > 0 ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/30' :
                            rep.roi < 0 ? 'text-red-400 bg-red-950/40 border border-red-900/30' :
                            'text-slate-400 bg-slate-900'
                          }`}>
                            {rep.roi > 0 ? `+${rep.roi}%` : `${rep.roi}%`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ----------------------------------------------------
          MODALS / FORMS LAYER
         ---------------------------------------------------- */}
      {/* VEHICLE ADD/EDIT MODAL */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-6 border-slate-800 shadow-2xl relative">
            <h2 className="text-xl font-bold font-sans text-slate-200 mb-6">{editingVehicle ? 'Edit Vehicle Profile' : 'Register New Vehicle'}</h2>
            
            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Registration Number</label>
                  <input required type="text" value={vehicleForm.registration_number} onChange={(e) => setVehicleForm({...vehicleForm, registration_number: e.target.value.toUpperCase()})} className="w-full glass-input" placeholder="e.g. VAN-05" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Model Name</label>
                  <input required type="text" value={vehicleForm.model} onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})} className="w-full glass-input" placeholder="e.g. Ford Transit" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Vehicle Type</label>
                  <select value={vehicleForm.vehicle_type} onChange={(e) => setVehicleForm({...vehicleForm, vehicle_type: e.target.value})} className="w-full glass-input">
                    <option value="Van">Van</option>
                    <option value="Electric Van">Electric Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Heavy Duty Truck">Heavy Duty Truck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Max Capacity (kg)</label>
                  <input required type="number" value={vehicleForm.capacity} onChange={(e) => setVehicleForm({...vehicleForm, capacity: e.target.value})} className="w-full glass-input" placeholder="e.g. 500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Current Odometer (km)</label>
                  <input required type="number" value={vehicleForm.odometer} onChange={(e) => setVehicleForm({...vehicleForm, odometer: e.target.value})} className="w-full glass-input" placeholder="e.g. 10000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Acquisition Cost ($)</label>
                  <input required type="number" value={vehicleForm.acquisition_cost} onChange={(e) => setVehicleForm({...vehicleForm, acquisition_cost: e.target.value})} className="w-full glass-input" placeholder="e.g. 35000" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Region Assignment</label>
                  <input type="text" value={vehicleForm.region} onChange={(e) => setVehicleForm({...vehicleForm, region: e.target.value})} className="w-full glass-input" placeholder="e.g. North" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Status</label>
                  <select value={vehicleForm.status} disabled={editingVehicle && editingVehicle.status === 'On Trip'} onChange={(e) => setVehicleForm({...vehicleForm, status: e.target.value})} className="w-full glass-input">
                    <option value="Available">Available</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                    {editingVehicle && editingVehicle.status === 'On Trip' && <option value="On Trip">On Trip</option>}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="py-2 px-4 bg-slate-900 text-slate-400 rounded-lg hover:bg-slate-850 hover:text-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="py-2 px-5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRIVER ADD/EDIT MODAL */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel p-6 border-slate-800 shadow-2xl relative">
            <h2 className="text-xl font-bold font-sans text-slate-200 mb-6">{editingDriver ? 'Edit Driver profile' : 'Register New Driver'}</h2>
            
            <form onSubmit={handleSaveDriver} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
                <input required type="text" value={driverForm.name} onChange={(e) => setDriverForm({...driverForm, name: e.target.value})} className="w-full glass-input" placeholder="e.g. Alex Mercer" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">License Number</label>
                  <input required type="text" value={driverForm.license_number} onChange={(e) => setDriverForm({...driverForm, license_number: e.target.value})} className="w-full glass-input" placeholder="e.g. DL-12345" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">License Class</label>
                  <input required type="text" value={driverForm.license_category} onChange={(e) => setDriverForm({...driverForm, license_category: e.target.value})} className="w-full glass-input" placeholder="e.g. Class A" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">License Expiration</label>
                  <input required type="date" value={driverForm.license_expiry} onChange={(e) => setDriverForm({...driverForm, license_expiry: e.target.value})} className="w-full glass-input font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Contact Number</label>
                  <input required type="text" value={driverForm.contact_number} onChange={(e) => setDriverForm({...driverForm, contact_number: e.target.value})} className="w-full glass-input" placeholder="e.g. +1-555-0100" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Safety Score</label>
                  <input type="number" min="0" max="100" value={driverForm.safety_score} onChange={(e) => setDriverForm({...driverForm, safety_score: e.target.value})} className="w-full glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Status</label>
                  <select value={driverForm.status} disabled={editingDriver && editingDriver.status === 'On Trip'} onChange={(e) => setDriverForm({...driverForm, status: e.target.value})} className="w-full glass-input">
                    <option value="Available">Available</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                    {editingDriver && editingDriver.status === 'On Trip' && <option value="On Trip">On Trip</option>}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowDriverModal(false)} className="py-2 px-4 bg-slate-900 text-slate-400 rounded-lg hover:bg-slate-850 hover:text-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="py-2 px-5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors">Save Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TRIP MODAL WITH RECOMMENDATION ENGINE */}
      {showTripModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl glass-panel p-6 border-slate-800 shadow-2xl relative grid grid-cols-1 lg:grid-cols-5 gap-6 max-h-[90vh] overflow-y-auto">
            
            <div className="lg:col-span-3 space-y-4">
              <h2 className="text-xl font-bold font-sans text-slate-200">Prepare Cargo Shipment</h2>
              
              <form onSubmit={handleCreateTrip} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Source Depot</label>
                    <input required type="text" value={tripForm.source} onChange={(e) => setTripForm({...tripForm, source: e.target.value})} className="w-full glass-input text-sm" placeholder="e.g. Warehouse A" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Destination</label>
                    <input required type="text" value={tripForm.destination} onChange={(e) => setTripForm({...tripForm, destination: e.target.value})} className="w-full glass-input text-sm" placeholder="e.g. Retail Center" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Cargo Weight (kg)</label>
                    <input required type="number" value={tripForm.cargo_weight} onChange={(e) => setTripForm({...tripForm, cargo_weight: e.target.value})} className="w-full glass-input text-sm" placeholder="e.g. 500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Planned Dist (km)</label>
                    <input required type="number" value={tripForm.planned_distance} onChange={(e) => setTripForm({...tripForm, planned_distance: e.target.value})} className="w-full glass-input text-sm" placeholder="e.g. 150" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Est. Revenue ($)</label>
                    <input required type="number" value={tripForm.revenue} onChange={(e) => setTripForm({...tripForm, revenue: e.target.value})} className="w-full glass-input text-sm" placeholder="e.g. 1200" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Select Vehicle</label>
                    <select required value={tripForm.vehicle_id} onChange={(e) => setTripForm({...tripForm, vehicle_id: e.target.value})} className="w-full glass-input text-sm">
                      <option value="">-- Select Available --</option>
                      {vehicles.filter(v => v.status === 'Available').map(v => (
                        <option key={v.id} value={v.id}>{v.registration_number} - {v.model} ({v.capacity}kg max)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Select Driver</label>
                    <select required value={tripForm.driver_id} onChange={(e) => setTripForm({...tripForm, driver_id: e.target.value})} className="w-full glass-input text-sm">
                      <option value="">-- Select Available --</option>
                      {drivers.filter(d => d.status === 'Available' && !d.isExpired).map(d => (
                        <option key={d.id} value={d.id}>{d.name} (Safety: {d.safety_score})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setShowTripModal(false)} className="py-2 px-4 bg-slate-900 text-slate-400 rounded-lg hover:bg-slate-850 hover:text-slate-200 transition-colors text-sm">Cancel</button>
                  <button type="submit" className="py-2 px-5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors text-sm">Save Draft</button>
                </div>
              </form>
            </div>

            {/* Recommendations Widget (Novelty Feature) */}
            <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-6 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles size={16} />
                <h3 className="font-bold text-sm uppercase tracking-wider">Trust Score Matchmaker</h3>
              </div>
              <p className="text-xs text-slate-400 font-light">TransitOps AI computes safety & reliability indexes dynamically to suggest optimal matches:</p>
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {matchmakerData.matches.length > 0 ? (
                  matchmakerData.matches.slice(0, 3).map((match, i) => (
                    <button
                      key={i}
                      onClick={() => setTripForm({
                        ...tripForm,
                        vehicle_id: match.vehicle.id,
                        driver_id: match.driver.id
                      })}
                      className="w-full text-left p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all flex flex-col gap-2 relative group"
                    >
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-blue-950 border border-blue-900 text-blue-400 font-mono text-[10px] font-bold rounded">
                        {match.score}% match
                      </div>
                      
                      <div className="text-xs">
                        <span className="font-mono font-bold text-slate-250 block">{match.vehicle.registration_number}</span>
                        <span className="font-semibold text-slate-300 block">{match.driver.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-light group-hover:text-slate-300 leading-normal">{match.explanation}</p>
                    </button>
                  ))
                ) : (
                  <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl text-center text-xs text-slate-500">
                    No available matching pairs. Make sure vehicles and drivers are set to Available.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TRIP COMPLETION MODAL */}
      {showCompleteTripModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 border-slate-800 shadow-2xl relative">
            <h2 className="text-xl font-bold font-sans text-slate-200 mb-4">Complete Trip Dispatch</h2>
            <p className="text-xs text-slate-400 mb-6">Enter closing parameters for Trip {completingTrip.id} to finalize delivery billing and logs.</p>
            
            <form onSubmit={handleCompleteTrip} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Actual Distance (km)</label>
                  <input required type="number" value={completionForm.actual_distance} onChange={(e) => setCompletionForm({...completionForm, actual_distance: e.target.value})} className="w-full glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Final Odometer (km)</label>
                  <input required type="number" value={completionForm.odometer} onChange={(e) => setCompletionForm({...completionForm, odometer: e.target.value})} className="w-full glass-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Fuel Litres Used</label>
                  <input type="number" step="0.1" value={completionForm.fuel_litres} onChange={(e) => setCompletionForm({...completionForm, fuel_litres: e.target.value})} className="w-full glass-input" placeholder="e.g. 40" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Fuel Cost ($)</label>
                  <input type="number" value={completionForm.fuel_cost} onChange={(e) => setCompletionForm({...completionForm, fuel_cost: e.target.value})} className="w-full glass-input" placeholder="e.g. 120" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Closing Revenue ($)</label>
                <input required type="number" value={completionForm.revenue} onChange={(e) => setCompletionForm({...completionForm, revenue: e.target.value})} className="w-full glass-input" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowCompleteTripModal(false)} className="py-2 px-4 bg-slate-900 text-slate-400 rounded-lg hover:bg-slate-850 hover:text-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="py-2 px-5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-colors">Finalize Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD MAINTENANCE MODAL */}
      {showMaintModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 border-slate-800 shadow-2xl relative">
            <h2 className="text-xl font-bold font-sans text-slate-200 mb-6">Initiate Maintenance Lock</h2>
            
            <form onSubmit={handleStartMaintenance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Vehicle</label>
                <select required value={maintForm.vehicle_id} onChange={(e) => setMaintForm({...maintForm, vehicle_id: e.target.value})} className="w-full glass-input">
                  <option value="">-- Choose Asset --</option>
                  {vehicles.filter(v => v.status !== 'Retired' && v.status !== 'On Trip').map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number} - {v.model} ({v.status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Maintenance Type</label>
                <input required type="text" value={maintForm.maintenance_type} onChange={(e) => setMaintForm({...maintForm, maintenance_type: e.target.value})} className="w-full glass-input" placeholder="e.g. Brake Pads Replacement" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Job Description</label>
                <textarea value={maintForm.description} onChange={(e) => setMaintForm({...maintForm, description: e.target.value})} className="w-full glass-input h-20 resize-none" placeholder="Provide technical details..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Start Date</label>
                  <input required type="date" value={maintForm.start_date} onChange={(e) => setMaintForm({...maintForm, start_date: e.target.value})} className="w-full glass-input font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Est. Cost ($)</label>
                  <input type="number" value={maintForm.cost} onChange={(e) => setMaintForm({...maintForm, cost: e.target.value})} className="w-full glass-input" placeholder="e.g. 500" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowMaintModal(false)} className="py-2 px-4 bg-slate-900 text-slate-400 rounded-lg hover:bg-slate-850 hover:text-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="py-2 px-5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors">Put In Shop</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSE MAINTENANCE MODAL */}
      {showCompleteMaintModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 border-slate-800 shadow-2xl relative">
            <h2 className="text-xl font-bold font-sans text-slate-200 mb-6">Release Asset from Shop</h2>
            
            <form onSubmit={handleCompleteMaint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Actual Work Cost ($)</label>
                <input required type="number" value={completeMaintForm.cost} onChange={(e) => setCompleteMaintForm({...completeMaintForm, cost: e.target.value})} className="w-full glass-input" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Closing Date</label>
                <input required type="date" value={completeMaintForm.completion_date} onChange={(e) => setCompleteMaintForm({...completeMaintForm, completion_date: e.target.value})} className="w-full glass-input font-mono" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowCompleteMaintModal(false)} className="py-2 px-4 bg-slate-900 text-slate-400 rounded-lg hover:bg-slate-850 hover:text-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="py-2 px-5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-colors">Close Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 border-slate-800 shadow-2xl relative">
            <h2 className="text-xl font-bold font-sans text-slate-200 mb-6">Log Operating Expense</h2>
            
            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Vehicle</label>
                  <select required value={expenseForm.vehicle_id} onChange={(e) => setExpenseForm({...expenseForm, vehicle_id: e.target.value})} className="w-full glass-input">
                    <option value="">-- Choose Asset --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.registration_number}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Trip (Optional)</label>
                  <select value={expenseForm.trip_id} onChange={(e) => setExpenseForm({...expenseForm, trip_id: e.target.value})} className="w-full glass-input">
                    <option value="">N/A</option>
                    {trips.map(t => (
                      <option key={t.id} value={t.id}>{t.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Expense Type</label>
                  <select value={expenseForm.expense_type} onChange={(e) => setExpenseForm({...expenseForm, expense_type: e.target.value})} className="w-full glass-input">
                    <option value="Toll">Toll</option>
                    <option value="Parking">Parking</option>
                    <option value="Driver allowance">Driver allowance</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Amount ($)</label>
                  <input required type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full glass-input" placeholder="e.g. 50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</label>
                <input type="text" value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full glass-input" placeholder="Details (e.g. Highway parking)" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Date</label>
                <input required type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full glass-input font-mono" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="py-2 px-4 bg-slate-900 text-slate-400 rounded-lg hover:bg-slate-850 hover:text-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="py-2 px-5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors">Record Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
