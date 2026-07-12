const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const initialSeed = {
  users: [
    { id: "usr-1", name: "Fleet Manager User", email: "manager@transitops.com", password: "manager123", role: "Fleet Manager" },
    { id: "usr-2", name: "Dispatcher User", email: "dispatcher@transitops.com", password: "dispatcher123", role: "Dispatcher" },
    { id: "usr-3", name: "Financial Analyst User", email: "analyst@transitops.com", password: "analyst123", role: "Financial Analyst" }
  ],
  vehicles: [
    { id: "veh-1", registration_number: "VAN-01", model: "Ford Transit", vehicle_type: "Van", capacity: 500, odometer: 12500, acquisition_cost: 35000, region: "North", status: "Available" },
    { id: "veh-2", registration_number: "VAN-02", model: "Mercedes Sprinter", vehicle_type: "Van", capacity: 600, odometer: 24000, acquisition_cost: 42000, region: "East", status: "Available" },
    { id: "veh-3", registration_number: "VAN-03", model: "RAM ProMaster", vehicle_type: "Van", capacity: 550, odometer: 85000, acquisition_cost: 38000, region: "South", status: "In Shop" },
    { id: "veh-4", registration_number: "VAN-04", model: "Chevrolet Express", vehicle_type: "Van", capacity: 500, odometer: 142000, acquisition_cost: 32000, region: "West", status: "Retired" },
    { id: "veh-5", registration_number: "TRK-01", model: "Freightliner M2", vehicle_type: "Truck", capacity: 5000, odometer: 180000, acquisition_cost: 85000, region: "North", status: "In Shop" },
    { id: "veh-6", registration_number: "TRK-02", model: "Volvo VNL", vehicle_type: "Truck", capacity: 15000, odometer: 295000, acquisition_cost: 120000, region: "National", status: "Available" },
    { id: "veh-7", registration_number: "TRK-03", model: "Peterbilt 389", vehicle_type: "Truck", capacity: 18000, odometer: 420000, acquisition_cost: 145000, region: "West", status: "On Trip" },
    { id: "veh-8", registration_number: "TRK-04", model: "Isuzu NPR", vehicle_type: "Truck", capacity: 3000, odometer: 65000, acquisition_cost: 55000, region: "South", status: "Available" },
    { id: "veh-9", registration_number: "EV-01", model: "Rivian EDV", vehicle_type: "Electric Van", capacity: 800, odometer: 8000, acquisition_cost: 65000, region: "East", status: "Retired" },
    { id: "veh-10", registration_number: "EV-02", model: "Ford E-Transit", vehicle_type: "Electric Van", capacity: 500, odometer: 15000, acquisition_cost: 48000, region: "North", status: "On Trip" },
    { id: "veh-11", registration_number: "TRK-05", model: "Kenworth T680", vehicle_type: "Truck", capacity: 16000, odometer: 310000, acquisition_cost: 130000, region: "East", status: "On Trip" },
    { id: "veh-12", registration_number: "VAN-06", model: "Toyota HiAce", vehicle_type: "Van", capacity: 700, odometer: 92000, acquisition_cost: 29000, region: "South", status: "On Trip" }
  ],
  drivers: [
    { id: "drv-1", name: "Alex Mercer", license_number: "DL-9284729", license_category: "Class A", license_expiry: "2027-08-15", contact_number: "+1-555-0198", safety_score: 98, status: "Available" },
    { id: "drv-2", name: "Sarah Jenkins", license_number: "DL-3847291", license_category: "Class B", license_expiry: "2026-11-22", contact_number: "+1-555-0144", safety_score: 92, status: "Available" },
    { id: "drv-3", name: "Marcus Brody", license_number: "DL-4729103", license_category: "Class A", license_expiry: "2026-07-16", contact_number: "+1-555-0182", safety_score: 87, status: "Available" }, // License expires soon
    { id: "drv-4", name: "David Chen", license_number: "DL-1039482", license_category: "Class A", license_expiry: "2026-06-30", contact_number: "+1-555-0129", safety_score: 95, status: "Available" }, // Expired
    { id: "drv-5", name: "Elena Rostova", license_number: "DL-5839201", license_category: "Class B", license_expiry: "2028-02-14", contact_number: "+1-555-0177", safety_score: 55, status: "Suspended" }, // Suspended
    { id: "drv-6", name: "Tom Brady", license_number: "DL-7738291", license_category: "Class A", license_expiry: "2029-09-09", contact_number: "+1-555-0112", safety_score: 94, status: "On Trip" },
    { id: "drv-7", name: "Jessica Alba", license_number: "DL-2294820", license_category: "Class B", license_expiry: "2027-04-30", contact_number: "+1-555-0155", safety_score: 89, status: "On Trip" },
    { id: "drv-8", name: "Robert Downey", license_number: "DL-8829482", license_category: "Class A", license_expiry: "2027-12-25", contact_number: "+1-555-0101", safety_score: 96, status: "On Trip" },
    { id: "drv-9", name: "Ken Block", license_number: "DL-1234567", license_category: "Class A", license_expiry: "2028-10-10", contact_number: "+1-555-0999", safety_score: 99, status: "On Trip" }
  ],
  trips: [
    { id: "trp-1001", source: "Warehouse A", destination: "Retail Center North", vehicle_id: "veh-7", driver_id: "drv-6", cargo_weight: 12000, planned_distance: 250, actual_distance: null, revenue: 3200, status: "Dispatched", start_date: "2026-07-11T08:00:00Z", completion_date: null },
    { id: "trp-1002", source: "Port Terminal", destination: "Logistics Hub East", vehicle_id: "veh-10", driver_id: "drv-7", cargo_weight: 400, planned_distance: 80, actual_distance: null, revenue: 600, status: "Dispatched", start_date: "2026-07-12T06:30:00Z", completion_date: null },
    { id: "trp-1003", source: "Distribution Center South", destination: "Industrial Park East", vehicle_id: "veh-11", driver_id: "drv-8", cargo_weight: 14000, planned_distance: 450, actual_distance: null, revenue: 5200, status: "Dispatched", start_date: "2026-07-12T05:00:00Z", completion_date: null },
    { id: "trp-1004", source: "Regional Depot", destination: "Local Hub", vehicle_id: "veh-12", driver_id: "drv-9", cargo_weight: 650, planned_distance: 120, actual_distance: null, revenue: 950, status: "Dispatched", start_date: "2026-07-12T09:15:00Z", completion_date: null },
    // A couple completed trips to seed ROI, fuel logs, and operational expenses
    { id: "trp-999", source: "Warehouse A", destination: "Retail Center North", vehicle_id: "veh-1", driver_id: "drv-1", cargo_weight: 450, planned_distance: 200, actual_distance: 200, revenue: 1500, status: "Completed", start_date: "2026-07-09T08:00:00Z", completion_date: "2026-07-09T12:00:00Z" },
    { id: "trp-998", source: "Port Terminal", destination: "Logistics Hub East", vehicle_id: "veh-2", driver_id: "drv-2", cargo_weight: 550, planned_distance: 100, actual_distance: 100, revenue: 900, status: "Completed", start_date: "2026-07-10T09:00:00Z", completion_date: "2026-07-10T11:30:00Z" }
  ],
  maintenance: [
    { id: "maint-1", vehicle_id: "veh-3", maintenance_type: "Break Repair", description: "Replacing brake calipers and pads", start_date: "2026-07-10", completion_date: null, cost: 850, status: "Active" },
    { id: "maint-2", vehicle_id: "veh-5", maintenance_type: "Routine Oil Change", description: "Engine oil and filter replacement", start_date: "2026-07-12", completion_date: null, cost: 150, status: "Active" },
    { id: "maint-3", vehicle_id: "veh-4", maintenance_type: "Engine Overhaul", description: "Complete engine rebuild", start_date: "2026-06-25", completion_date: "2026-07-05", cost: 3500, status: "Completed" }
  ],
  fuel_logs: [
    { id: "fuel-1", vehicle_id: "veh-1", trip_id: "trp-999", litres: 20, cost: 60, date: "2026-07-09", odometer: 12500 },
    { id: "fuel-2", vehicle_id: "veh-2", trip_id: "trp-998", litres: 11, cost: 33, date: "2026-07-10", odometer: 24000 }
  ],
  expenses: [
    { id: "exp-1", vehicle_id: "veh-1", trip_id: "trp-999", expense_type: "Toll", amount: 15, description: "Highway toll", date: "2026-07-09" },
    { id: "exp-2", vehicle_id: "veh-1", trip_id: "trp-999", expense_type: "Driver allowance", amount: 50, description: "Lunch allowance", date: "2026-07-09" },
    { id: "exp-3", vehicle_id: "veh-2", trip_id: "trp-998", expense_type: "Parking", amount: 10, description: "Hub parking fee", date: "2026-07-10" }
  ]
};

function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDb(initialSeed);
      return initialSeed;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data || JSON.stringify(initialSeed));
  } catch (err) {
    console.error('Error reading JSON DB, returning initial seed:', err.message);
    return initialSeed;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing JSON DB:', err.message);
  }
}

module.exports = {
  readDb,
  writeDb
};
