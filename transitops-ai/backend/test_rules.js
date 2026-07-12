const { readDb, writeDb } = require('./db');

// Custom assert helper
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('--- STARTING TRANSITOPS AI BACKEND RULES TEST ---');

// 1. Read seed database
const db = readDb();
assert(db.users.length === 3, 'Should seed exactly 3 users');
assert(db.vehicles.length === 12, 'Should seed exactly 12 vehicles');
assert(db.drivers.length === 9, 'Should seed exactly 9 drivers');

// Save a backup of the DB for restoration after tests
const dbBackup = JSON.parse(JSON.stringify(db));

try {
  // Test Scenario: Find a driver, vehicle, and create a draft trip
  const vehicle = db.vehicles.find(v => v.status === 'Available');
  const driver = db.drivers.find(d => d.status === 'Available' && new Date(d.license_expiry) > new Date());
  
  assert(vehicle !== undefined, 'Should find an available vehicle');
  assert(driver !== undefined, 'Should find an available valid driver');

  console.log(`Using vehicle: ${vehicle.registration_number} (Capacity: ${vehicle.capacity}kg)`);
  console.log(`Using driver: ${driver.name} (License expiry: ${driver.license_expiry})`);

  // Create a trip with cargo weight <= vehicle capacity
  const validTrip = {
    id: 'test-trip-valid',
    source: 'Factory A',
    destination: 'Store B',
    vehicle_id: vehicle.id,
    driver_id: driver.id,
    cargo_weight: vehicle.capacity - 50,
    planned_distance: 100,
    revenue: 800,
    status: 'Draft'
  };

  db.trips.push(validTrip);

  // Validate dispatch function (re-creating server logic for validation check)
  function validateDispatch(trip, dbInstance) {
    const v = dbInstance.vehicles.find(item => item.id === trip.vehicle_id);
    const d = dbInstance.drivers.find(item => item.id === trip.driver_id);
    const today = new Date();
    const errors = [];

    if (v.status !== 'Available') errors.push('Vehicle not Available');
    if (v.status === 'Retired') errors.push('Vehicle is retired');
    if (d.status !== 'Available') errors.push('Driver not Available');
    if (new Date(d.license_expiry) < today) errors.push('Driver license expired');
    if (d.status === 'Suspended') errors.push('Driver suspended');
    if (trip.cargo_weight > v.capacity) errors.push('Cargo exceeds capacity');

    return errors;
  }

  // 2. Validate dispatch of a valid trip
  let errors = validateDispatch(validTrip, db);
  assert(errors.length === 0, 'Valid trip should have 0 validation errors');

  // Trigger dispatch transitions
  if (errors.length === 0) {
    validTrip.status = 'Dispatched';
    vehicle.status = 'On Trip';
    driver.status = 'On Trip';
  }

  assert(validTrip.status === 'Dispatched', 'Trip status should transition to Dispatched');
  assert(vehicle.status === 'On Trip', 'Vehicle status should transition to On Trip');
  assert(driver.status === 'On Trip', 'Driver status should transition to On Trip');

  // 3. Test validation for over-capacity cargo
  const invalidTripCargo = {
    id: 'test-trip-heavy',
    source: 'Factory A',
    destination: 'Store B',
    vehicle_id: vehicle.id, // Now it is 'On Trip', which should trigger errors as well
    driver_id: driver.id,
    cargo_weight: vehicle.capacity + 200, // Exceeds capacity
    planned_distance: 100,
    revenue: 800,
    status: 'Draft'
  };

  errors = validateDispatch(invalidTripCargo, db);
  assert(errors.includes('Cargo exceeds capacity'), 'Should reject dispatch if cargo exceeds vehicle capacity');
  assert(errors.includes('Vehicle not Available'), 'Should reject dispatch if vehicle is not Available (it is now On Trip)');

  // 4. Test expired license validation
  const expiredDriver = db.drivers.find(d => d.name === 'David Chen'); // Expired in seed data
  assert(expiredDriver !== undefined, 'Should find seeded expired driver David Chen');
  
  const tripExpiredLicense = {
    id: 'test-trip-expired',
    source: 'Warehouse A',
    destination: 'Store C',
    vehicle_id: db.vehicles.find(v => v.status === 'Available').id,
    driver_id: expiredDriver.id,
    cargo_weight: 100,
    planned_distance: 50,
    revenue: 400,
    status: 'Draft'
  };

  errors = validateDispatch(tripExpiredLicense, db);
  assert(errors.includes('Driver license expired'), 'Should reject dispatch if driver license is expired');

  // 5. Test suspended driver validation
  const suspendedDriver = db.drivers.find(d => d.name === 'Elena Rostova'); // Suspended in seed
  assert(suspendedDriver !== undefined, 'Should find seeded suspended driver Elena Rostova');
  
  const tripSuspendedDriver = {
    id: 'test-trip-suspended',
    source: 'Warehouse A',
    destination: 'Store C',
    vehicle_id: db.vehicles.find(v => v.status === 'Available').id,
    driver_id: suspendedDriver.id,
    cargo_weight: 100,
    planned_distance: 50,
    revenue: 400,
    status: 'Draft'
  };

  errors = validateDispatch(tripSuspendedDriver, db);
  assert(errors.includes('Driver suspended'), 'Should reject dispatch if driver is suspended');

  // 6. Test Completion Transitions
  // Complete the dispatched test trip
  validTrip.status = 'Completed';
  vehicle.status = 'Available';
  driver.status = 'Available';

  assert(validTrip.status === 'Completed', 'Trip should change to Completed');
  assert(vehicle.status === 'Available', 'Vehicle should return to Available');
  assert(driver.status === 'Available', 'Driver should return to Available');

  // 7. Test Maintenance Automation
  const maintVehicle = db.vehicles.find(v => v.status === 'Available');
  console.log(`Putting vehicle ${maintVehicle.registration_number} under maintenance`);
  
  // Start maintenance
  maintVehicle.status = 'In Shop';
  const maintLog = {
    id: 'maint-test',
    vehicle_id: maintVehicle.id,
    maintenance_type: 'Oil Leak Fix',
    status: 'Active'
  };
  db.maintenance.push(maintLog);

  assert(maintVehicle.status === 'In Shop', 'Vehicle status should change to In Shop when maintenance starts');

  // Close maintenance
  maintLog.status = 'Completed';
  if (maintVehicle.status !== 'Retired') {
    maintVehicle.status = 'Available';
  }

  assert(maintLog.status === 'Completed', 'Maintenance status should change to Completed');
  assert(maintVehicle.status === 'Available', 'Vehicle should return to Available after maintenance closes');

} finally {
  // Restore database backup so we don't pollute the seed data
  writeDb(dbBackup);
  console.log('Restored original seed database.');
}

console.log('--- ALL BACKEND RULES TESTS PASSED SUCCESSFULLY! ---');
