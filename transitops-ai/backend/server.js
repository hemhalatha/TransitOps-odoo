const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { readDb, writeDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const PUBLIC_DIR = path.join(__dirname, '../frontend/dist');

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(PUBLIC_DIR));


// Helper to generate IDs
function generateId(prefix) {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// ----------------------------------------------------
// DASHBOARD STATS ENDPOINT
// ----------------------------------------------------
app.get('/api/dashboard/stats', (req, res) => {
  const db = readDb();
  
  const totalVehicles = db.vehicles.length;
  const availableVehicles = db.vehicles.filter(v => v.status === 'Available').length;
  const onTripVehicles = db.vehicles.filter(v => v.status === 'On Trip').length;
  const inShopVehicles = db.vehicles.filter(v => v.status === 'In Shop').length;
  const retiredVehicles = db.vehicles.filter(v => v.status === 'Retired').length;
  
  const activeTrips = db.trips.filter(t => t.status === 'Dispatched').length;
  
  const totalDrivers = db.drivers.length;
  const availableDrivers = db.drivers.filter(d => d.status === 'Available').length;
  const onTripDrivers = db.drivers.filter(d => d.status === 'On Trip').length;
  const offDutyDrivers = db.drivers.filter(d => d.status === 'Off Duty').length;
  const suspendedDrivers = db.drivers.filter(d => d.status === 'Suspended').length;

  // Fleet Utilization = Vehicles On Trip / Active Fleet * 100 (excluding retired)
  const activeFleet = totalVehicles - retiredVehicles;
  const fleetUtilization = activeFleet > 0 ? Math.round((onTripVehicles / activeFleet) * 100) : 0;

  // Chart 1: Vehicle status distribution
  const statusDistribution = [
    { name: 'Available', value: availableVehicles, color: '#10B981' }, // emerald-500
    { name: 'On Trip', value: onTripVehicles, color: '#3B82F6' },       // blue-500
    { name: 'In Shop', value: inShopVehicles, color: '#F59E0B' },       // amber-500
    { name: 'Retired', value: retiredVehicles, color: '#EF4444' }        // red-500
  ];

  // Chart 2: Monthly fuel cost (group by month from fuel logs)
  const monthlyFuel = {};
  db.fuel_logs.forEach(log => {
    // extract YYYY-MM
    const month = log.date.substring(0, 7);
    monthlyFuel[month] = (monthlyFuel[month] || 0) + log.cost;
  });
  const monthlyFuelData = Object.keys(monthlyFuel).sort().map(month => ({
    month,
    cost: monthlyFuel[month]
  }));

  // Chart 3: Operational cost by vehicle (fuel + maintenance + other expenses)
  const vehicleCosts = {};
  db.vehicles.forEach(v => {
    vehicleCosts[v.registration_number] = {
      reg: v.registration_number,
      fuel: 0,
      maintenance: 0,
      other: 0,
      total: 0
    };
  });

  // add fuel costs
  db.fuel_logs.forEach(log => {
    const veh = db.vehicles.find(v => v.id === log.vehicle_id);
    if (veh) {
      vehicleCosts[veh.registration_number].fuel += log.cost;
      vehicleCosts[veh.registration_number].total += log.cost;
    }
  });

  // add maintenance costs (from completed/active logs)
  db.maintenance.forEach(log => {
    const veh = db.vehicles.find(v => v.id === log.vehicle_id);
    if (veh) {
      vehicleCosts[veh.registration_number].maintenance += log.cost;
      vehicleCosts[veh.registration_number].total += log.cost;
    }
  });

  // add other expenses
  db.expenses.forEach(exp => {
    const veh = db.vehicles.find(v => v.id === exp.vehicle_id);
    if (veh) {
      if (exp.expense_type === 'Maintenance') {
        vehicleCosts[veh.registration_number].maintenance += exp.amount;
      } else {
        vehicleCosts[veh.registration_number].other += exp.amount;
      }
      vehicleCosts[veh.registration_number].total += exp.amount;
    }
  });

  const operationalCostByVehicle = Object.values(vehicleCosts).filter(c => c.total > 0);

  res.json({
    stats: {
      totalVehicles,
      availableVehicles,
      onTripVehicles,
      inShopVehicles,
      retiredVehicles,
      activeTrips,
      totalDrivers,
      availableDrivers,
      onTripDrivers,
      offDutyDrivers,
      suspendedDrivers,
      fleetUtilization
    },
    charts: {
      statusDistribution,
      monthlyFuelData,
      operationalCostByVehicle
    }
  });
});

// ----------------------------------------------------
// VEHICLES ENDPOINTS
// ----------------------------------------------------
app.get('/api/vehicles', (req, res) => {
  const db = readDb();
  res.json(db.vehicles);
});

app.post('/api/vehicles', (req, res) => {
  const { registration_number, model, vehicle_type, capacity, odometer, acquisition_cost, region, status } = req.body;
  const db = readDb();
  
  if (!registration_number || !model || !vehicle_type || !capacity || !odometer || !acquisition_cost) {
    return res.status(400).json({ error: 'Missing required vehicle fields' });
  }

  // Registration number must be unique
  const exists = db.vehicles.some(v => v.registration_number.toUpperCase() === registration_number.toUpperCase());
  if (exists) {
    return res.status(400).json({ error: `Registration number ${registration_number} already exists.` });
  }

  const newVehicle = {
    id: generateId('veh'),
    registration_number: registration_number.toUpperCase(),
    model,
    vehicle_type,
    capacity: Number(capacity),
    odometer: Number(odometer),
    acquisition_cost: Number(acquisition_cost),
    region: region || 'Unassigned',
    status: status || 'Available'
  };

  db.vehicles.push(newVehicle);
  writeDb(db);
  res.status(201).json(newVehicle);
});

app.put('/api/vehicles/:id', (req, res) => {
  const { id } = req.params;
  const { registration_number, model, vehicle_type, capacity, odometer, acquisition_cost, region, status } = req.body;
  const db = readDb();

  const index = db.vehicles.findIndex(v => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  const currentVehicle = db.vehicles[index];

  // Unique reg validation
  if (registration_number && registration_number.toUpperCase() !== currentVehicle.registration_number) {
    const exists = db.vehicles.some(v => v.id !== id && v.registration_number.toUpperCase() === registration_number.toUpperCase());
    if (exists) {
      return res.status(400).json({ error: `Registration number ${registration_number} already exists.` });
    }
  }

  // Prevent users from manually marking as On Trip
  if (status === 'On Trip' && currentVehicle.status !== 'On Trip') {
    return res.status(400).json({ error: 'Cannot manually mark vehicle as On Trip. This status must be set via Trip Dispatching.' });
  }

  const updatedVehicle = {
    ...currentVehicle,
    registration_number: registration_number ? registration_number.toUpperCase() : currentVehicle.registration_number,
    model: model || currentVehicle.model,
    vehicle_type: vehicle_type || currentVehicle.vehicle_type,
    capacity: capacity !== undefined ? Number(capacity) : currentVehicle.capacity,
    odometer: odometer !== undefined ? Number(odometer) : currentVehicle.odometer,
    acquisition_cost: acquisition_cost !== undefined ? Number(acquisition_cost) : currentVehicle.acquisition_cost,
    region: region || currentVehicle.region,
    status: status || currentVehicle.status
  };

  db.vehicles[index] = updatedVehicle;
  writeDb(db);
  res.json(updatedVehicle);
});

app.post('/api/vehicles/:id/retire', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const index = db.vehicles.findIndex(v => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  if (db.vehicles[index].status === 'On Trip') {
    return res.status(400).json({ error: 'Cannot retire a vehicle that is currently on a trip.' });
  }

  db.vehicles[index].status = 'Retired';
  writeDb(db);
  res.json(db.vehicles[index]);
});

// ----------------------------------------------------
// DRIVERS ENDPOINTS
// ----------------------------------------------------
app.get('/api/drivers', (req, res) => {
  const db = readDb();
  
  // Calculate warning flags on the fly
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);

  const driversWithFlags = db.drivers.map(d => {
    const expiryDate = new Date(d.license_expiry);
    let warning = null;
    let isExpired = false;

    if (expiryDate < today) {
      warning = 'License expired';
      isExpired = true;
    } else if (expiryDate <= sevenDaysFromNow) {
      warning = 'License expires in 7 days';
    } else if (d.status === 'Suspended') {
      warning = 'Driver suspended';
    }

    return {
      ...d,
      warning,
      isExpired
    };
  });

  res.json(driversWithFlags);
});

app.post('/api/drivers', (req, res) => {
  const { name, license_number, license_category, license_expiry, contact_number, safety_score, status } = req.body;
  const db = readDb();

  if (!name || !license_number || !license_category || !license_expiry || !contact_number) {
    return res.status(400).json({ error: 'Missing required driver fields' });
  }

  const newDriver = {
    id: generateId('drv'),
    name,
    license_number,
    license_category,
    license_expiry,
    contact_number,
    safety_score: safety_score !== undefined ? Number(safety_score) : 100,
    status: status || 'Available'
  };

  db.drivers.push(newDriver);
  writeDb(db);
  res.status(201).json(newDriver);
});

app.put('/api/drivers/:id', (req, res) => {
  const { id } = req.params;
  const { name, license_number, license_category, license_expiry, contact_number, safety_score, status } = req.body;
  const db = readDb();

  const index = db.drivers.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Driver not found' });
  }

  const updatedDriver = {
    ...db.drivers[index],
    name: name || db.drivers[index].name,
    license_number: license_number || db.drivers[index].license_number,
    license_category: license_category || db.drivers[index].license_category,
    license_expiry: license_expiry || db.drivers[index].license_expiry,
    contact_number: contact_number || db.drivers[index].contact_number,
    safety_score: safety_score !== undefined ? Number(safety_score) : db.drivers[index].safety_score,
    status: status || db.drivers[index].status
  };

  db.drivers[index] = updatedDriver;
  writeDb(db);
  res.json(updatedDriver);
});

// ----------------------------------------------------
// TRIPS & DISPATCH ENDPOINTS
// ----------------------------------------------------
app.get('/api/trips', (req, res) => {
  const db = readDb();
  res.json(db.trips);
});

app.post('/api/trips', (req, res) => {
  const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue } = req.body;
  const db = readDb();

  if (!source || !destination || !vehicle_id || !driver_id || !cargo_weight || !planned_distance || !revenue) {
    return res.status(400).json({ error: 'Missing required trip fields' });
  }

  const newTrip = {
    id: generateId('trp'),
    source,
    destination,
    vehicle_id,
    driver_id,
    cargo_weight: Number(cargo_weight),
    planned_distance: Number(planned_distance),
    actual_distance: null,
    revenue: Number(revenue),
    status: 'Draft',
    start_date: null,
    completion_date: null
  };

  db.trips.push(newTrip);
  writeDb(db);
  res.status(201).json(newTrip);
});

app.post('/api/trips/:id/dispatch', (req, res) => {
  const { id } = req.params;
  const db = readDb();

  const tripIndex = db.trips.findIndex(t => t.id === id);
  if (tripIndex === -1) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  const trip = db.trips[tripIndex];
  if (trip.status !== 'Draft') {
    return res.status(400).json({ error: `Cannot dispatch a trip that is in status ${trip.status}` });
  }

  const vehicle = db.vehicles.find(v => v.id === trip.vehicle_id);
  const driver = db.drivers.find(d => d.id === trip.driver_id);

  if (!vehicle) {
    return res.status(400).json({ error: 'Assigned vehicle not found.' });
  }
  if (!driver) {
    return res.status(400).json({ error: 'Assigned driver not found.' });
  }

  const today = new Date();
  const expiryDate = new Date(driver.license_expiry);

  // VALIDATION RULES
  const errors = [];
  
  if (vehicle.status !== 'Available') {
    errors.push(`Vehicle status = ${vehicle.status} (expected Available)`);
  }
  if (vehicle.status === 'Retired') {
    errors.push(`Vehicle is retired`);
  }
  
  const isVehicleInMaintenance = db.maintenance.some(m => m.vehicle_id === vehicle.id && m.status === 'Active');
  if (isVehicleInMaintenance || vehicle.status === 'In Shop') {
    errors.push(`Vehicle is under maintenance`);
  }

  if (driver.status !== 'Available') {
    errors.push(`Driver status = ${driver.status} (expected Available)`);
  }
  if (expiryDate < today) {
    errors.push(`Driver license is expired`);
  }
  if (driver.status === 'Suspended') {
    errors.push(`Driver is suspended`);
  }

  if (trip.cargo_weight > vehicle.capacity) {
    errors.push(`Cargo weight (${trip.cargo_weight} kg) exceeds Vehicle capacity (${vehicle.capacity} kg)`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Cannot dispatch trip.',
      details: errors
    });
  }

  // TRANSITIONS
  trip.status = 'Dispatched';
  trip.start_date = new Date().toISOString();
  
  const vehicleIndex = db.vehicles.findIndex(v => v.id === vehicle.id);
  db.vehicles[vehicleIndex].status = 'On Trip';

  const driverIndex = db.drivers.findIndex(d => d.id === driver.id);
  db.drivers[driverIndex].status = 'On Trip';

  writeDb(db);
  res.json({ success: true, trip, vehicle: db.vehicles[vehicleIndex], driver: db.drivers[driverIndex] });
});

app.post('/api/trips/:id/complete', (req, res) => {
  const { id } = req.params;
  const { actual_distance, odometer, fuel_litres, fuel_cost, revenue, expenses } = req.body;
  const db = readDb();

  const tripIndex = db.trips.findIndex(t => t.id === id);
  if (tripIndex === -1) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  const trip = db.trips[tripIndex];
  if (trip.status !== 'Dispatched') {
    return res.status(400).json({ error: 'Only dispatched trips can be completed' });
  }

  if (!odometer || !actual_distance) {
    return res.status(400).json({ error: 'Odometer and actual distance are required for completion' });
  }

  const vehicleIndex = db.vehicles.findIndex(v => v.id === trip.vehicle_id);
  const driverIndex = db.drivers.findIndex(d => d.id === trip.driver_id);

  if (vehicleIndex === -1 || driverIndex === -1) {
    return res.status(400).json({ error: 'Assigned vehicle or driver not found' });
  }

  const vehicle = db.vehicles[vehicleIndex];

  if (Number(odometer) < vehicle.odometer) {
    return res.status(400).json({ error: `Odometer reading (${odometer}) cannot be less than current odometer (${vehicle.odometer})` });
  }

  // Update Trip
  trip.status = 'Completed';
  trip.completion_date = new Date().toISOString();
  trip.actual_distance = Number(actual_distance);
  if (revenue) {
    trip.revenue = Number(revenue);
  }

  // Update Vehicle Odometer and Status
  db.vehicles[vehicleIndex].odometer = Number(odometer);
  db.vehicles[vehicleIndex].status = 'Available';

  // Update Driver Status
  db.drivers[driverIndex].status = 'Available';

  // Log Fuel
  if (fuel_litres && fuel_cost) {
    db.fuel_logs.push({
      id: generateId('fuel'),
      vehicle_id: trip.vehicle_id,
      trip_id: trip.id,
      litres: Number(fuel_litres),
      cost: Number(fuel_cost),
      date: new Date().toISOString().substring(0, 10),
      odometer: Number(odometer)
    });
  }

  // Log Expenses
  if (Array.isArray(expenses)) {
    expenses.forEach(exp => {
      if (exp.amount && exp.expense_type) {
        db.expenses.push({
          id: generateId('exp'),
          vehicle_id: trip.vehicle_id,
          trip_id: trip.id,
          expense_type: exp.expense_type,
          amount: Number(exp.amount),
          description: exp.description || '',
          date: new Date().toISOString().substring(0, 10)
        });
      }
    });
  }

  writeDb(db);
  res.json({ success: true, trip, vehicle: db.vehicles[vehicleIndex], driver: db.drivers[driverIndex] });
});

app.post('/api/trips/:id/cancel', (req, res) => {
  const { id } = req.params;
  const db = readDb();

  const tripIndex = db.trips.findIndex(t => t.id === id);
  if (tripIndex === -1) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  const trip = db.trips[tripIndex];
  if (trip.status !== 'Dispatched' && trip.status !== 'Draft') {
    return res.status(400).json({ error: 'Only drafts or dispatched trips can be cancelled' });
  }

  const prevStatus = trip.status;
  trip.status = 'Cancelled';
  trip.completion_date = new Date().toISOString();

  // If already dispatched, we release driver and vehicle
  if (prevStatus === 'Dispatched') {
    const vehicleIndex = db.vehicles.findIndex(v => v.id === trip.vehicle_id);
    if (vehicleIndex !== -1) {
      db.vehicles[vehicleIndex].status = 'Available';
    }
    const driverIndex = db.drivers.findIndex(d => d.id === trip.driver_id);
    if (driverIndex !== -1) {
      db.drivers[driverIndex].status = 'Available';
    }
  }

  writeDb(db);
  res.json({ success: true, trip });
});

// ----------------------------------------------------
// MAINTENANCE ENDPOINTS
// ----------------------------------------------------
app.get('/api/maintenance', (req, res) => {
  const db = readDb();
  res.json(db.maintenance);
});

app.post('/api/maintenance', (req, res) => {
  const { vehicle_id, maintenance_type, description, start_date, expected_completion, cost } = req.body;
  const db = readDb();

  if (!vehicle_id || !maintenance_type || !start_date) {
    return res.status(400).json({ error: 'Missing required maintenance fields' });
  }

  const vehicleIndex = db.vehicles.findIndex(v => v.id === vehicle_id);
  if (vehicleIndex === -1) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  const vehicle = db.vehicles[vehicleIndex];
  if (vehicle.status === 'On Trip') {
    return res.status(400).json({ error: 'Cannot put a vehicle in maintenance while it is on a trip' });
  }

  // CREATE LOG
  const newMaint = {
    id: generateId('maint'),
    vehicle_id,
    maintenance_type,
    description: description || '',
    start_date,
    completion_date: null,
    cost: cost ? Number(cost) : 0,
    status: 'Active'
  };

  db.maintenance.push(newMaint);
  
  // TRANSITION: Vehicle -> In Shop
  db.vehicles[vehicleIndex].status = 'In Shop';

  writeDb(db);
  res.status(201).json({ maintenance: newMaint, vehicle: db.vehicles[vehicleIndex] });
});

app.post('/api/maintenance/:id/complete', (req, res) => {
  const { id } = req.params;
  const { cost, completion_date } = req.body;
  const db = readDb();

  const maintIndex = db.maintenance.findIndex(m => m.id === id);
  if (maintIndex === -1) {
    return res.status(404).json({ error: 'Maintenance record not found' });
  }

  const maint = db.maintenance[maintIndex];
  if (maint.status !== 'Active') {
    return res.status(400).json({ error: 'Only active maintenance can be completed' });
  }

  maint.status = 'Completed';
  maint.completion_date = completion_date || new Date().toISOString().substring(0, 10);
  if (cost !== undefined) {
    maint.cost = Number(cost);
  }

  // TRANSITION: Vehicle -> Available (unless retired)
  const vehicleIndex = db.vehicles.findIndex(v => v.id === maint.vehicle_id);
  if (vehicleIndex !== -1) {
    const vehicle = db.vehicles[vehicleIndex];
    if (vehicle.status !== 'Retired') {
      db.vehicles[vehicleIndex].status = 'Available';
    }
  }

  // Log to expenses
  db.expenses.push({
    id: generateId('exp'),
    vehicle_id: maint.vehicle_id,
    trip_id: null,
    expense_type: 'Maintenance',
    amount: maint.cost,
    description: `Completed maintenance: ${maint.maintenance_type}`,
    date: maint.completion_date
  });

  writeDb(db);
  res.json({ success: true, maintenance: maint, vehicle: db.vehicles[vehicleIndex] });
});

app.post('/api/maintenance/:id/cancel', (req, res) => {
  const { id } = req.params;
  const db = readDb();

  const maintIndex = db.maintenance.findIndex(m => m.id === id);
  if (maintIndex === -1) {
    return res.status(404).json({ error: 'Maintenance record not found' });
  }

  const maint = db.maintenance[maintIndex];
  if (maint.status !== 'Active') {
    return res.status(400).json({ error: 'Only active maintenance can be cancelled' });
  }

  maint.status = 'Cancelled';
  maint.completion_date = new Date().toISOString().substring(0, 10);

  // TRANSITION: Vehicle -> Available (unless retired)
  const vehicleIndex = db.vehicles.findIndex(v => v.id === maint.vehicle_id);
  if (vehicleIndex !== -1) {
    const vehicle = db.vehicles[vehicleIndex];
    if (vehicle.status !== 'Retired') {
      db.vehicles[vehicleIndex].status = 'Available';
    }
  }

  writeDb(db);
  res.json({ success: true, maintenance: maint, vehicle: db.vehicles[vehicleIndex] });
});

// ----------------------------------------------------
// EXPENSES & FUEL ENDPOINTS
// ----------------------------------------------------
app.get('/api/expenses', (req, res) => {
  const db = readDb();
  res.json({
    expenses: db.expenses,
    fuel_logs: db.fuel_logs
  });
});

app.post('/api/expenses', (req, res) => {
  const { vehicle_id, trip_id, expense_type, amount, description, date } = req.body;
  const db = readDb();

  if (!vehicle_id || !expense_type || !amount) {
    return res.status(400).json({ error: 'Missing required expense fields' });
  }

  const newExpense = {
    id: generateId('exp'),
    vehicle_id,
    trip_id: trip_id || null,
    expense_type,
    amount: Number(amount),
    description: description || '',
    date: date || new Date().toISOString().substring(0, 10)
  };

  db.expenses.push(newExpense);
  writeDb(db);
  res.status(201).json(newExpense);
});

// ----------------------------------------------------
// MATCHMAKER ENGINE (Fleet Trust Score)
// ----------------------------------------------------
app.get('/api/matchmaker', (req, res) => {
  const db = readDb();

  // Find available vehicles and drivers
  const availableVehicles = db.vehicles.filter(v => v.status === 'Available');
  const availableDrivers = db.drivers.filter(d => {
    const isExpired = new Date(d.license_expiry) < new Date();
    return d.status === 'Available' && !isExpired;
  });

  const matches = [];

  availableVehicles.forEach(v => {
    // Vehicle Reliability Factor = 100 - (odometer / 5000) - (maintenance count * 5)
    // cap at minimum 10
    const vehicleMaintCount = db.maintenance.filter(m => m.vehicle_id === v.id).length;
    let reliability = 100 - (v.odometer / 5000) - (vehicleMaintCount * 5);
    reliability = Math.max(10, Math.round(reliability));

    availableDrivers.forEach(d => {
      // Trust Score = Driver safety score * 0.6 + Vehicle reliability * 0.4
      const score = Math.round((d.safety_score * 0.6) + (reliability * 0.4));

      // Explanation
      let explanation = `Match is rated at ${score}/100. Driver ${d.name} has a strong safety score of ${d.safety_score}. `;
      if (reliability > 80) {
        explanation += `${v.registration_number} is in pristine condition with low mileage (${v.odometer} km).`;
      } else if (reliability > 50) {
        explanation += `${v.registration_number} is highly reliable with moderate mileage (${v.odometer} km).`;
      } else {
        explanation += `${v.registration_number} is operational but has higher mileage (${v.odometer} km).`;
      }

      matches.push({
        vehicle: v,
        driver: d,
        score,
        explanation
      });
    });
  });

  // Sort matches by score descending
  matches.sort((a, b) => b.score - a.score);

  res.json({
    matches,
    availableVehiclesCount: availableVehicles.length,
    availableDriversCount: availableDrivers.length
  });
});

// ----------------------------------------------------
// REPORTS ENDPOINT
// ----------------------------------------------------
app.get('/api/reports', (req, res) => {
  const db = readDb();

  // 1. Operational Cost per Vehicle
  const vehicleReports = db.vehicles.map(v => {
    // Fuel Cost
    const fuelCost = db.fuel_logs
      .filter(l => l.vehicle_id === v.id)
      .reduce((sum, l) => sum + l.cost, 0);

    const fuelLitres = db.fuel_logs
      .filter(l => l.vehicle_id === v.id)
      .reduce((sum, l) => sum + l.litres, 0);

    // Maintenance Cost
    const maintCost = db.maintenance
      .filter(m => m.vehicle_id === v.id)
      .reduce((sum, m) => sum + m.cost, 0);

    // Other Expenses
    const otherCost = db.expenses
      .filter(e => e.vehicle_id === v.id && e.expense_type !== 'Maintenance')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalOperationalCost = fuelCost + maintCost + otherCost;

    // Total Distance Travelled (sum of completed trips distance, or use odometer if starting from base)
    // For specific fuel efficiency, we check distance travelled on completed trips:
    const completedTrips = db.trips.filter(t => t.vehicle_id === v.id && t.status === 'Completed');
    const totalDistance = completedTrips.reduce((sum, t) => sum + (t.actual_distance || 0), 0);

    // Fuel Efficiency (km / Litres)
    const fuelEfficiency = fuelLitres > 0 ? Number((totalDistance / fuelLitres).toFixed(2)) : 0;

    // Total Revenue from completed trips
    const totalRevenue = completedTrips.reduce((sum, t) => sum + t.revenue, 0);

    // Vehicle ROI = (Revenue - Operational Cost) / Acquisition Cost * 100
    const netProfit = totalRevenue - totalOperationalCost;
    const roi = v.acquisition_cost > 0 ? Number(((netProfit / v.acquisition_cost) * 100).toFixed(2)) : 0;

    return {
      id: v.id,
      registration_number: v.registration_number,
      model: v.model,
      vehicle_type: v.vehicle_type,
      status: v.status,
      acquisition_cost: v.acquisition_cost,
      fuelCost,
      fuelLitres,
      maintCost,
      otherCost,
      totalOperationalCost,
      totalDistance,
      fuelEfficiency,
      totalRevenue,
      netProfit,
      roi
    };
  });

  // 2. Fleet-wide stats
  const activeVehicles = db.vehicles.filter(v => v.status !== 'Retired');
  const onTripVehicles = db.vehicles.filter(v => v.status === 'On Trip').length;
  const fleetUtilization = activeVehicles.length > 0 ? Math.round((onTripVehicles / activeVehicles.length) * 100) : 0;

  const totalFuelCost = db.fuel_logs.reduce((sum, f) => sum + f.cost, 0);
  const totalMaintCost = db.maintenance.reduce((sum, m) => sum + m.cost, 0);
  const totalOtherCost = db.expenses.reduce((sum, e) => sum + e.amount, 0);
  const grandTotalOperationalCost = totalFuelCost + totalMaintCost + totalOtherCost;

  const grandTotalRevenue = db.trips.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.revenue, 0);
  const totalNetProfit = grandTotalRevenue - grandTotalOperationalCost;

  res.json({
    fleetWide: {
      fleetUtilization,
      totalFuelCost,
      totalMaintCost,
      totalOtherCost,
      grandTotalOperationalCost,
      grandTotalRevenue,
      totalNetProfit
    },
    vehicles: vehicleReports
  });
});

// ----------------------------------------------------
// SPA WILDCARD ROUTING
// ----------------------------------------------------
app.get('*', (req, res) => {
  const indexFile = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.send('TransitOps AI API Server Running. (Frontend not compiled)');
  }
});

// ----------------------------------------------------
// INITIALIZE & START
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`TransitOps AI Backend running on http://localhost:${PORT}`);
});

