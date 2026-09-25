import 'dotenv/config';
import { db } from './db.js';

async function seed() {
  console.log('🌱 Seeding MedPulse PostgreSQL Database with Realistic Nationwide Data...');

  const now = new Date().toISOString();

  // 1. Clear existing data
  console.log('Clearing existing records...');
  try {
    await db.orm.public.Alert.where({}).deleteAll();
    await db.orm.public.TransferHistory.where({}).deleteAll();
    await db.orm.public.ResourceTransfer.where({}).deleteAll();
    await db.orm.public.StaffMember.where({}).deleteAll();
    await db.orm.public.StaffMetrics.where({}).deleteAll();
    await db.orm.public.BedMetrics.where({}).deleteAll();
    await db.orm.public.PatientMetrics.where({}).deleteAll();
    await db.orm.public.PHCMedicineInventory.where({}).deleteAll();
    await db.orm.public.Medicine.where({}).deleteAll();
    await db.orm.public.PHC.where({}).deleteAll();
    await db.orm.public.FederatedNode.where({}).deleteAll();
  } catch (e) {
    console.log('Table reset notice:', e);
  }

  // 2. Insert Essential Medicines Catalog
  console.log('Inserting Essential Medicines...');
  const medicines = [
    { id: 'med-01', name: 'Amoxicillin 250mg Susp.', category: 'Antibiotic / Pediatric & Maternal', dosage: '250mg/5ml Bottle', unit: 'Bottles', reorderLevel: 800 },
    { id: 'med-02', name: 'ORS (Oral Rehydration Salts)', category: 'Electrolyte / Dehydration', dosage: '20.5g WHO Sachets', unit: 'Sachets', reorderLevel: 1000 },
    { id: 'med-03', name: 'Paracetamol 500mg', category: 'Analgesic / Antipyretic', dosage: '500mg Tablets (Strip of 10)', unit: 'Strips', reorderLevel: 1200 },
    { id: 'med-04', name: 'Ibuprofen 400mg', category: 'NSAID / Anti-inflammatory', dosage: '400mg Tablets (Strip of 10)', unit: 'Strips', reorderLevel: 600 },
    { id: 'med-05', name: 'Azithromycin 500mg', category: 'Antibiotic / Macrolide', dosage: '500mg Tablets (Strip of 3)', unit: 'Strips', reorderLevel: 500 },
    { id: 'med-06', name: 'Ceftriaxone 1g Injectable', category: 'Emergency Antibiotic / Critical', dosage: '1g Vial + WFI', unit: 'Vials', reorderLevel: 300 },
    { id: 'med-07', name: 'Rabies Anti-Serum Vaccine', category: 'Vaccine / Cold-Chain Biologic', dosage: '0.5ml IM/ID Ampoule', unit: 'Ampoules', reorderLevel: 150 },
    { id: 'med-08', name: 'Anti-Snake Venom (Polyvalent)', category: 'Emergency Antidote / Critical', dosage: '10ml Reconstituted Vial', unit: 'Vials', reorderLevel: 80 },
    { id: 'med-09', name: 'Insulin Human Regular (30/70)', category: 'Endocrine / Cold-Chain Biologic', dosage: '100 IU/ml 10ml Vial', unit: 'Vials', reorderLevel: 250 },
    { id: 'med-10', name: 'Metformin 500mg Extended Release', category: 'NCD / Antidiabetic', dosage: '500mg Tablets (Strip of 10)', unit: 'Strips', reorderLevel: 900 },
    { id: 'med-11', name: 'Atorvastatin 10mg', category: 'Cardiovascular / NCD', dosage: '10mg Tablets (Strip of 10)', unit: 'Strips', reorderLevel: 700 },
    { id: 'med-12', name: 'Oxytocin 10 IU Injection', category: 'Maternal Health / Labor Suite', dosage: '1ml Ampoule', unit: 'Ampoules', reorderLevel: 400 },
    { id: 'med-13', name: 'Zinc Sulphate 20mg Dispersible', category: 'Pediatric / Diarrhea Protocol', dosage: '20mg Tablets (Strip of 10)', unit: 'Strips', reorderLevel: 650 },
    { id: 'med-14', name: 'Artesunate 60mg Injection', category: 'Antimalarial / Severe Vector', dosage: '60mg Powder for Inj.', unit: 'Vials', reorderLevel: 200 },
  ];

  for (const m of medicines) {
    await db.orm.public.Medicine.create({
      id: m.id,
      name: m.name,
      category: m.category,
      dosage: m.dosage,
      unit: m.unit,
      reorderLevel: m.reorderLevel,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 3. Insert 39 PHC Facilities across India
  console.log('Inserting Nationwide PHCs...');
  const phcs = [
    // Maharashtra (5)
    { id: 'phc-alpha', name: 'PHC-Alpha East (Wagholi Demo)', code: 'IN-MH-PHC-001', district: 'Pune East / Haveli Demo Sub-Division', state: 'Maharashtra', lat: 18.5820, lng: 73.9850, riskLevel: 'critical', riskScore: 88, resilienceScore: 42 },
    { id: 'phc-beta', name: 'PHC-Beta South (Saswad Demo)', code: 'IN-MH-PHC-002', district: 'Purandar / Saswad Demo Basin', state: 'Maharashtra', lat: 18.3440, lng: 74.0320, riskLevel: 'stable', riskScore: 18, resilienceScore: 89 },
    { id: 'phc-gamma', name: 'PHC-Gamma Metro (Bhosari Demo)', code: 'IN-MH-PHC-003', district: 'Pimpri-Chinchwad Metro Demo', state: 'Maharashtra', lat: 18.6250, lng: 73.8450, riskLevel: 'warning', riskScore: 62, resilienceScore: 64 },
    { id: 'phc-delta', name: 'PHC-Delta North (Chakan Demo)', code: 'IN-MH-PHC-004', district: 'Khed / Chakan Industrial Corridor', state: 'Maharashtra', lat: 18.7560, lng: 73.8590, riskLevel: 'high', riskScore: 74, resilienceScore: 56 },
    { id: 'phc-epsilon', name: 'PHC-Epsilon West (Paud Demo)', code: 'IN-MH-PHC-005', district: 'Mulshi / Paud Foothill Demo', state: 'Maharashtra', lat: 18.5320, lng: 73.6120, riskLevel: 'stable', riskScore: 24, resilienceScore: 84 },

    // Karnataka (3)
    { id: 'phc-ka-01', name: 'PHC-Anekal Rural Border (Demo)', code: 'IN-KA-PHC-001', district: 'Bengaluru Urban South', state: 'Karnataka', lat: 12.7107, lng: 77.6974, riskLevel: 'warning', riskScore: 58, resilienceScore: 71 },
    { id: 'phc-ka-02', name: 'PHC-Nelamangala Highway Post (Demo)', code: 'IN-KA-PHC-002', district: 'Bengaluru Rural North-West', state: 'Karnataka', lat: 13.0970, lng: 77.3912, riskLevel: 'stable', riskScore: 22, resilienceScore: 88 },
    { id: 'phc-ka-03', name: 'PHC-Hosakote Agro Health Center (Demo)', code: 'IN-KA-PHC-003', district: 'Bengaluru Rural East', state: 'Karnataka', lat: 13.0712, lng: 77.7983, riskLevel: 'high', riskScore: 76, resilienceScore: 54 },

    // Gujarat (3)
    { id: 'phc-gj-01', name: 'PHC-Sanand Industrial Health Unit (Demo)', code: 'IN-GJ-PHC-001', district: 'Ahmedabad Rural Basin', state: 'Gujarat', lat: 22.9868, lng: 72.3789, riskLevel: 'stable', riskScore: 20, resilienceScore: 90 },
    { id: 'phc-gj-02', name: 'PHC-Kalol Northern Outpost (Demo)', code: 'IN-GJ-PHC-002', district: 'Gandhinagar Peripheral Zone', state: 'Gujarat', lat: 23.2393, lng: 72.4984, riskLevel: 'critical', riskScore: 82, resilienceScore: 47 },
    { id: 'phc-gj-03', name: 'PHC-Surat Rural Coastal Health (Demo)', code: 'IN-GJ-PHC-003', district: 'Surat Delta Sector', state: 'Gujarat', lat: 21.1702, lng: 72.8311, riskLevel: 'warning', riskScore: 61, resilienceScore: 69 },

    // Rajasthan (3)
    { id: 'phc-rj-01', name: 'PHC-Sanganer Rural Health (Demo)', code: 'IN-RJ-PHC-001', district: 'Jaipur Rural Sector', state: 'Rajasthan', lat: 26.8120, lng: 75.7890, riskLevel: 'high', riskScore: 78, resilienceScore: 52 },
    { id: 'phc-rj-02', name: 'PHC-Jodhpur Desert Basin (Demo)', code: 'IN-RJ-PHC-002', district: 'Marwar Rural Enclave', state: 'Rajasthan', lat: 26.2389, lng: 73.0243, riskLevel: 'stable', riskScore: 21, resilienceScore: 89 },
    { id: 'phc-rj-03', name: 'PHC-Amber Ridge Health Post (Demo)', code: 'IN-RJ-PHC-003', district: 'Jaipur North Ridge', state: 'Rajasthan', lat: 26.9855, lng: 75.8513, riskLevel: 'warning', riskScore: 52, resilienceScore: 74 },

    // Uttar Pradesh (3)
    { id: 'phc-up-01', name: 'PHC-Bakshi Ka Talab Sub-Centre (Demo)', code: 'IN-UP-PHC-001', district: 'Lucknow Northern Peripheral Belt', state: 'Uttar Pradesh', lat: 26.9856, lng: 80.9324, riskLevel: 'critical', riskScore: 86, resilienceScore: 44 },
    { id: 'phc-up-02', name: 'PHC-Sarojini Nagar Agro Health (Demo)', code: 'IN-UP-PHC-002', district: 'Lucknow Southern Sector', state: 'Uttar Pradesh', lat: 26.7589, lng: 80.8654, riskLevel: 'warning', riskScore: 55, resilienceScore: 72 },
    { id: 'phc-up-03', name: 'PHC-Mohanlalganj Rural Post (Demo)', code: 'IN-UP-PHC-003', district: 'Lucknow Rural Belt', state: 'Uttar Pradesh', lat: 26.6712, lng: 80.9876, riskLevel: 'stable', riskScore: 28, resilienceScore: 82 },

    // Bihar (3)
    { id: 'phc-br-01', name: 'PHC-Phulwari Sharif Community Hub (Demo)', code: 'IN-BR-PHC-001', district: 'Patna Peripheral Sector', state: 'Bihar', lat: 25.5689, lng: 85.0789, riskLevel: 'high', riskScore: 79, resilienceScore: 50 },
    { id: 'phc-br-02', name: 'PHC-Danapur Ganga Basin (Demo)', code: 'IN-BR-PHC-002', district: 'Patna Western River Belt', state: 'Bihar', lat: 25.6321, lng: 85.0456, riskLevel: 'warning', riskScore: 60, resilienceScore: 68 },
    { id: 'phc-br-03', name: 'PHC-Fatwah River Convergence (Demo)', code: 'IN-BR-PHC-003', district: 'Patna Eastern Agro-Enclave', state: 'Bihar', lat: 25.5123, lng: 85.3124, riskLevel: 'stable', riskScore: 23, resilienceScore: 87 },

    // West Bengal (3)
    { id: 'phc-wb-01', name: 'PHC-Barasat Delta Health (Demo)', code: 'IN-WB-PHC-001', district: 'North 24 Parganas Sector', state: 'West Bengal', lat: 22.7234, lng: 88.4812, riskLevel: 'warning', riskScore: 57, resilienceScore: 73 },
    { id: 'phc-wb-02', name: 'PHC-Sonarpur Coastal Fringe (Demo)', code: 'IN-WB-PHC-002', district: 'South 24 Parganas Estuary', state: 'West Bengal', lat: 22.4412, lng: 88.4289, riskLevel: 'stable', riskScore: 25, resilienceScore: 86 },
    { id: 'phc-wb-03', name: 'PHC-Budge Budge Industrial Hub (Demo)', code: 'IN-WB-PHC-003', district: 'South 24 Parganas River Post', state: 'West Bengal', lat: 22.4823, lng: 88.1754, riskLevel: 'high', riskScore: 77, resilienceScore: 53 },

    // Tamil Nadu (3)
    { id: 'phc-tn-01', name: 'PHC-Tambaram Rural Extension (Demo)', code: 'IN-TN-PHC-001', district: 'Chengalpattu Outer Ring', state: 'Tamil Nadu', lat: 12.9249, lng: 80.1000, riskLevel: 'stable', riskScore: 19, resilienceScore: 91 },
    { id: 'phc-tn-02', name: 'PHC-Poonamallee Western Post (Demo)', code: 'IN-TN-PHC-002', district: 'Tiruvallur Suburban Corridor', state: 'Tamil Nadu', lat: 13.0489, lng: 80.0924, riskLevel: 'warning', riskScore: 51, resilienceScore: 76 },
    { id: 'phc-tn-03', name: 'PHC-Sriperumbudur Tech-Corridor (Demo)', code: 'IN-TN-PHC-003', district: 'Kancheepuram Industrial Zone', state: 'Tamil Nadu', lat: 12.9689, lng: 79.9421, riskLevel: 'warning', riskScore: 50, resilienceScore: 77 },

    // Telangana (2)
    { id: 'phc-ts-01', name: 'PHC-Medchal Industrial Ring (Demo)', code: 'IN-TS-PHC-001', district: 'Medchal-Malkajgiri Outer Ring', state: 'Telangana', lat: 17.6297, lng: 78.4814, riskLevel: 'stable', riskScore: 20, resilienceScore: 89 },
    { id: 'phc-ts-02', name: 'PHC-Warangal Heritage Health (Demo)', code: 'IN-TS-PHC-002', district: 'Warangal Rural Sub-Division', state: 'Telangana', lat: 17.9689, lng: 79.5941, riskLevel: 'warning', riskScore: 54, resilienceScore: 73 },

    // Delhi NCT (1)
    { id: 'phc-dl-01', name: 'PHC-Najafgarh Training Centre (Demo)', code: 'IN-DL-PHC-001', district: 'South West Delhi Rural Belt', state: 'Delhi', lat: 28.6139, lng: 76.9830, riskLevel: 'high', riskScore: 75, resilienceScore: 55 },

    // Kerala (2)
    { id: 'phc-kl-01', name: 'PHC-Aluva Periyar Basin (Demo)', code: 'IN-KL-PHC-001', district: 'Ernakulam River Valley', state: 'Kerala', lat: 10.1076, lng: 76.3516, riskLevel: 'stable', riskScore: 16, resilienceScore: 92 },
    { id: 'phc-kl-02', name: 'PHC-Nedumbassery Transit Hub (Demo)', code: 'IN-KL-PHC-002', district: 'Ernakulam Northern Belt', state: 'Kerala', lat: 10.1542, lng: 76.3921, riskLevel: 'warning', riskScore: 46, resilienceScore: 80 },

    // Assam (2)
    { id: 'phc-as-01', name: 'PHC-Guwahati North Bank (Demo)', code: 'IN-AS-PHC-001', district: 'Kamrup Rural Valley', state: 'Assam', lat: 26.2124, lng: 91.7345, riskLevel: 'high', riskScore: 74, resilienceScore: 57 },
    { id: 'phc-as-02', name: 'PHC-Dispur Peripheral Health (Demo)', code: 'IN-AS-PHC-002', district: 'Kamrup Metropolitan Outer', state: 'Assam', lat: 26.1432, lng: 91.7892, riskLevel: 'stable', riskScore: 27, resilienceScore: 83 },

    // Madhya Pradesh (1)
    { id: 'phc-mp-01', name: 'PHC-Bhopal Sehore Agro-Post (Demo)', code: 'IN-MP-PHC-001', district: 'Sehore Central Plateau', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, riskLevel: 'stable', riskScore: 26, resilienceScore: 85 },

    // Odisha (1)
    { id: 'phc-or-01', name: 'PHC-Bhubaneswar Khurda Coast (Demo)', code: 'IN-OR-PHC-001', district: 'Khurda Coastal Basin', state: 'Odisha', lat: 20.2961, lng: 85.8245, riskLevel: 'high', riskScore: 71, resilienceScore: 60 },

    // Uttarakhand (3)
    { id: 'phc-uk-01', name: 'PHC-Dehradun Rural Foothills (Demo)', code: 'IN-UK-PHC-001', district: 'Dehradun Foothill Valley', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322, riskLevel: 'stable', riskScore: 25, resilienceScore: 88 },
    { id: 'phc-uk-02', name: 'PHC-Haridwar Peripheral Basin (Demo)', code: 'IN-UK-PHC-002', district: 'Haridwar Pilgrim Belt', state: 'Uttarakhand', lat: 29.9457, lng: 78.1642, riskLevel: 'warning', riskScore: 58, resilienceScore: 72 },
    { id: 'phc-uk-03', name: 'PHC-Almora Hill Outpost (Demo)', code: 'IN-UK-PHC-003', district: 'Almora Kumaon High-Range', state: 'Uttarakhand', lat: 29.5971, lng: 79.6591, riskLevel: 'critical', riskScore: 83, resilienceScore: 46 },
  ];

  for (const p of phcs) {
    await db.orm.public.PHC.create({
      id: p.id,
      name: p.name,
      code: p.code,
      state: p.state,
      district: p.district,
      latitude: p.lat,
      longitude: p.lng,
      status: 'ACTIVE',
      riskLevel: p.riskLevel,
      riskScore: p.riskScore,
      resilienceScore: p.resilienceScore,
      createdAt: now,
      updatedAt: now,
    });

    // Bed metrics
    const totalBeds = p.riskLevel === 'critical' ? 22 : p.riskLevel === 'high' ? 20 : 24;
    const occupiedBeds = p.riskLevel === 'critical' ? 20 : p.riskLevel === 'high' ? 17 : p.riskLevel === 'warning' ? 14 : 9;
    await db.orm.public.BedMetrics.create({
      phcId: p.id,
      date: now,
      totalBeds,
      occupiedBeds,
      emergencyBeds: 6,
      emergencyBedsOccupied: p.riskLevel === 'critical' ? 5 : 2,
      icuBeds: 2,
      icuBedsOccupied: p.riskLevel === 'critical' ? 2 : 0,
      patientsAdmitted: p.riskLevel === 'critical' ? 18 : 8,
      patientsDischarged: p.riskLevel === 'critical' ? 12 : 6,
      patientsReferred: p.riskLevel === 'critical' ? 4 : 1,
      createdAt: now,
    });

    // Staff metrics
    const docsTotal = 4;
    const docsPresent = p.riskLevel === 'critical' ? 2 : p.riskLevel === 'high' ? 2 : p.riskLevel === 'warning' ? 3 : 4;
    await db.orm.public.StaffMetrics.create({
      phcId: p.id,
      date: now,
      shift: 'Morning',
      doctorsScheduled: docsTotal,
      doctorsPresent: docsPresent,
      doctorsAbsent: docsTotal - docsPresent,
      nursesScheduled: 8,
      nursesPresent: p.riskLevel === 'critical' ? 4 : 7,
      nursesAbsent: p.riskLevel === 'critical' ? 4 : 1,
      otherStaffScheduled: 6,
      otherStaffPresent: 6,
      otherStaffAbsent: 0,
      createdAt: now,
    });

    // Patient metrics
    const patientsTotal = p.riskLevel === 'critical' ? 184 : p.riskLevel === 'high' ? 150 : p.riskLevel === 'warning' ? 125 : 95;
    await db.orm.public.PatientMetrics.create({
      phcId: p.id,
      date: now,
      totalPatients: patientsTotal,
      newPatients: Math.round(patientsTotal * 0.7),
      underTreatment: Math.round(patientsTotal * 0.2),
      recovered: Math.round(patientsTotal * 0.5),
      discharged: Math.round(patientsTotal * 0.4),
      admitted: Math.round(patientsTotal * 0.1),
      emergencyCases: p.riskLevel === 'critical' ? 14 : 4,
      criticalPatients: p.riskLevel === 'critical' ? 6 : 1,
      referredPatients: p.riskLevel === 'critical' ? 5 : 1,
      createdAt: now,
    });

    // Staff Members Roster
    await db.orm.public.StaffMember.create({
      phcId: p.id,
      name: `Dr. Ramesh Kulkarni (${p.code.split('-')[1]})`,
      role: 'Medical Officer',
      shift: 'Morning',
      status: docsPresent >= 1 ? 'on_duty' : 'off_duty',
      patientsSeenToday: 38,
      specialty: 'Family Medicine & Triage',
      createdAt: now,
    });
    await db.orm.public.StaffMember.create({
      phcId: p.id,
      name: `Nurse Anjali Deshmukh (${p.code.split('-')[1]})`,
      role: 'Triage Nurse',
      shift: 'Morning',
      status: 'on_duty',
      patientsSeenToday: 42,
      specialty: 'Emergency Resuscitation & Vitals',
      createdAt: now,
    });

    // Inventories for each PHC
    for (const med of medicines) {
      let stock = 1200;
      let daily = 60;
      let expiryDate = '2027-10-15';

      if (p.id === 'phc-alpha' && med.id === 'med-01') {
        // Amoxicillin Shortage at Alpha
        stock = 420;
        daily = 150;
      } else if (p.id === 'phc-beta' && med.id === 'med-01') {
        // Safe Surplus at Beta
        stock = 1420;
        daily = 65;
      } else if (p.id === 'phc-gamma' && med.id === 'med-01') {
        stock = 820;
        daily = 70;
      } else if (p.id === 'phc-delta' && med.id === 'med-01') {
        stock = 410;
        daily = 60;
      } else if (p.id === 'phc-epsilon' && med.id === 'med-01') {
        stock = 520;
        daily = 55;
      } else if (med.id === 'med-07' || med.id === 'med-08') {
        // Cold-chain / antivenom
        stock = p.riskLevel === 'critical' ? 12 : 65;
        daily = 4;
      } else if (med.id === 'med-02' || med.id === 'med-03') {
        stock = 2500;
        daily = 180;
      }

      await db.orm.public.PHCMedicineInventory.create({
        phcId: p.id,
        medicineId: med.id,
        currentStock: stock,
        dailyConsumption: daily,
        receivedQuantity: stock > 1000 ? 500 : 0,
        usedQuantity: daily,
        expiryDate,
        wastedQuantity: 2,
        updatedAt: now,
      });
    }
  }

  // 4. Insert Alerts
  console.log('Inserting Alerts...');
  const alerts = [
    {
      id: 'alt-001',
      phcId: 'phc-alpha',
      type: 'supply',
      severity: 'critical',
      title: 'Critical Antibiotic Stock-Out (Amoxicillin 250mg)',
      message: 'In-hand stock (420 Bottles) depleting at 150 Btls/day. Stock-out projected in ~2.8 days without immediate redistribution.',
      timeRemaining: '2.8 Days',
      recommendedAction: 'Trigger Safe Surplus Redistribution from PHC-Beta South (Saswad) with 300 Bottles.',
      status: 'active',
      resolved: false,
    },
    {
      id: 'alt-002',
      phcId: 'phc-alpha',
      type: 'bed',
      severity: 'critical',
      title: 'Emergency Bed Capacity at 91% (Critical Triage Saturation)',
      message: '20 of 22 beds occupied. 5 of 6 emergency beds utilized due to seasonal viral surge.',
      timeRemaining: '4.5 Hours',
      recommendedAction: 'Coordinate discharge transfers for recovering patients and divert non-trauma admissions.',
      status: 'active',
      resolved: false,
    },
    {
      id: 'alt-003',
      phcId: 'phc-delta',
      type: 'supply',
      severity: 'high',
      title: 'Anti-Rabies Biologic Vaccine Depletion Risk',
      message: 'Available supply down to 14 ampoules following stray animal bite spike in Khed belt.',
      timeRemaining: '3.2 Days',
      recommendedAction: 'Initiate cold-chain transfer from Pune District Central Depot.',
      status: 'active',
      resolved: false,
    },
    {
      id: 'alt-004',
      phcId: 'phc-up-01',
      type: 'epidemic',
      severity: 'critical',
      title: 'Gastroenteritis Cluster Surge (+48% intake vector)',
      message: 'Water-borne outbreak in Bakshi Ka Talab perimeter. ORS burn rate doubled to 380 sachets/day.',
      timeRemaining: 'Immediate',
      recommendedAction: 'Deploy mobile chlorine distribution team and mobilize state buffer reserve.',
      status: 'active',
      resolved: false,
    },
    {
      id: 'alt-005',
      phcId: 'phc-ka-03',
      type: 'staff',
      severity: 'high',
      title: 'Physician Shift Depletion (2 of 4 absent due to COVID triage)',
      message: 'Hosakote agro sector operating at 50% clinical throughput with 160+ walk-in intake.',
      timeRemaining: '1.0 Shift',
      recommendedAction: 'Recall on-call senior physician and activate tele-triage link to Victoria Hospital.',
      status: 'active',
      resolved: false,
    },
  ];

  for (const a of alerts) {
    await db.orm.public.Alert.create({
      id: a.id,
      phcId: a.phcId,
      type: a.type,
      severity: a.severity,
      title: a.title,
      message: a.message,
      timeRemaining: a.timeRemaining,
      recommendedAction: a.recommendedAction,
      status: a.status,
      resolved: a.resolved,
      createdAt: now,
    });
  }

  // 5. Insert Transfer History
  console.log('Inserting Transfer History Audit Logs...');
  const transferHistory = [
    {
      id: 'TR-892104',
      transferId: 'TR-892104',
      sourcePhcId: 'phc-beta',
      destinationPhcId: 'phc-alpha',
      sourcePhcName: 'PHC-Beta South (Saswad Demo)',
      destinationPhcName: 'PHC-Alpha East (Wagholi Demo)',
      medicineId: 'med-07',
      medicineName: 'Rabies Anti-Serum Vaccine',
      quantity: 45,
      distanceKm: 28.4,
      transitMinutes: 42,
      status: 'completed',
      carrier: 'Cold-Chain Van Alpha-2 (+3.8°C Telemetry Verified)',
      temperatureCelsius: 3.8,
      resilienceLift: 'Destination buffer extended by +6.2d (CRITICAL → STABLE)',
    },
    {
      id: 'TR-891942',
      transferId: 'TR-891942',
      sourcePhcId: 'phc-ka-02',
      destinationPhcId: 'phc-ka-03',
      sourcePhcName: 'PHC-Nelamangala Highway Post (Demo)',
      destinationPhcName: 'PHC-Hosakote Agro Health Center (Demo)',
      medicineId: 'med-08',
      medicineName: 'Anti-Snake Venom (Polyvalent)',
      quantity: 20,
      distanceKm: 34.2,
      transitMinutes: 48,
      status: 'completed',
      carrier: 'Emergency Transit Courier-1 (+4.2°C Active Telemetry)',
      temperatureCelsius: 4.2,
      resilienceLift: 'Zero local fatalities recorded; emergency reserve restored',
    },
    {
      id: 'TR-891501',
      transferId: 'TR-891501',
      sourcePhcId: 'phc-gj-01',
      destinationPhcId: 'phc-gj-02',
      sourcePhcName: 'PHC-Sanand Industrial Health Unit (Demo)',
      destinationPhcName: 'PHC-Kalol Northern Outpost (Demo)',
      medicineId: 'med-02',
      medicineName: 'ORS (Oral Rehydration Salts)',
      quantity: 600,
      distanceKm: 31.0,
      transitMinutes: 40,
      status: 'completed',
      carrier: 'Medical Logistics Carrier 4',
      temperatureCelsius: 22.4,
      resilienceLift: 'Heatwave surge mitigated; supply runway extended +8.5d',
    },
  ];

  for (const th of transferHistory) {
    await db.orm.public.TransferHistory.create({
      id: th.id,
      transferId: th.transferId,
      sourcePhcId: th.sourcePhcId,
      destinationPhcId: th.destinationPhcId,
      sourcePhcName: th.sourcePhcName,
      destinationPhcName: th.destinationPhcName,
      medicineId: th.medicineId,
      medicineName: th.medicineName,
      quantity: th.quantity,
      distanceKm: th.distanceKm,
      transitMinutes: th.transitMinutes,
      status: th.status,
      carrier: th.carrier,
      temperatureCelsius: th.temperatureCelsius,
      resilienceLift: th.resilienceLift,
      createdAt: now,
    });
  }

  // 6. Insert Federated Nodes
  console.log('Inserting Federated Nodes...');
  const federatedNodes = [
    {
      id: 'node-in-01',
      country: 'India',
      countryCode: 'IN',
      flag: '🇮🇳',
      institution: 'AIIMS New Delhi / ICMR Telemetry Node',
      enclaveName: 'National Health Grid Secure Enclave #01',
      datasetStatus: 'Federated Anonymized Local Records (EHR)',
      recordsCount: '1,420,800',
      recordsTrained: 1420800,
      modelVersion: 'MedPulse-Fed-IN-v4.8.2',
      localAccuracy: 95.8,
      lossMetric: 0.042,
      weightHash: '0x8f2a49b01c78e34d',
      verificationStatus: 'verified_active',
      latencyMs: 14,
      lastWeightUpload: '3 mins ago (Round #142)',
      contributedInsights: 'Pediatric Monsoon Bronchospasm surge vector (+34% velocity detection)',
      rawVaultStatus: 'L3 Hardware Security Module Protected (Zero PII Egress)',
    },
    {
      id: 'node-br-01',
      country: 'Brazil',
      countryCode: 'BR',
      flag: '🇧🇷',
      institution: 'FIOCRUZ Rio de Janeiro / SUS Telemetry Unit',
      enclaveName: 'SUS Brasil Primary Care Secure Enclave',
      datasetStatus: 'Tropical & Arboviral Local Enclave',
      recordsCount: '890,450',
      recordsTrained: 890450,
      modelVersion: 'MedPulse-Fed-BR-v4.8.1',
      localAccuracy: 94.2,
      lossMetric: 0.056,
      weightHash: '0x3c71e89f02da44b1',
      verificationStatus: 'verified_active',
      latencyMs: 148,
      lastWeightUpload: '12 mins ago (Round #142)',
      contributedInsights: 'Dengue Serotype-3 early warning signal from Favelas ambulatory grid',
      rawVaultStatus: 'LGPD Compliant Cryptographic Vault',
    },
    {
      id: 'node-za-01',
      country: 'South Africa',
      countryCode: 'ZA',
      flag: '🇿🇦',
      institution: 'South African Medical Research Council (SAMRC Cape Town)',
      enclaveName: 'SAMRC Rural Resilience Enclave #03',
      datasetStatus: 'Sub-Saharan Multi-Pathogen Registry',
      recordsCount: '640,120',
      recordsTrained: 640120,
      modelVersion: 'MedPulse-Fed-ZA-v4.8.0',
      localAccuracy: 93.6,
      lossMetric: 0.061,
      weightHash: '0x9a44b12f88cc71e0',
      verificationStatus: 'verified_active',
      latencyMs: 192,
      lastWeightUpload: '24 mins ago (Round #141)',
      contributedInsights: 'Dual MDR-TB & Respiratory seasonal co-infection pattern matrix',
      rawVaultStatus: 'POPIA Protected Local Hardware Vault',
    },
    {
      id: 'node-ru-01',
      country: 'Russia',
      countryCode: 'RU',
      flag: '🇷🇺',
      institution: 'Sechenov First Moscow State Medical University',
      enclaveName: 'Eurasian Cold-Climate Health Enclave',
      datasetStatus: 'Sub-Zero Respiratory Outpatient Registry',
      recordsCount: '780,300',
      recordsTrained: 780300,
      modelVersion: 'MedPulse-Fed-RU-v4.7.9',
      localAccuracy: 93.1,
      lossMetric: 0.065,
      weightHash: '0x1b90c74f55ae33d2',
      verificationStatus: 'verified_active',
      latencyMs: 110,
      lastWeightUpload: '45 mins ago (Round #141)',
      contributedInsights: 'Severe Hypothermia & Frostbite trauma risk coefficient mapping',
      rawVaultStatus: 'Federal Law No. 152-FZ Secure Sovereign Vault',
    },
    {
      id: 'node-cn-01',
      country: 'China',
      countryCode: 'CN',
      flag: '🇨🇳',
      institution: 'Peking Union Medical College Hospital (PUMCH Beijing)',
      enclaveName: 'East Asia Community Health Node #07',
      datasetStatus: 'High-Density Urban-Rural Primary Network',
      recordsCount: '2,150,000',
      recordsTrained: 2150000,
      modelVersion: 'MedPulse-Fed-CN-v4.8.2',
      localAccuracy: 96.4,
      lossMetric: 0.038,
      weightHash: '0x7e33a901ff4b11cd',
      verificationStatus: 'verified_active',
      latencyMs: 84,
      lastWeightUpload: '8 mins ago (Round #142)',
      contributedInsights: 'Influenza-A H3N2 early surge gradient across primary clinics',
      rawVaultStatus: 'CSL / DSL Protected Sovereign Enclave',
    },
  ];

  for (const fn of federatedNodes) {
    await db.orm.public.FederatedNode.create({
      id: fn.id,
      country: fn.country,
      countryCode: fn.countryCode,
      flag: fn.flag,
      institution: fn.institution,
      enclaveName: fn.enclaveName,
      datasetStatus: fn.datasetStatus,
      recordsCount: fn.recordsCount,
      recordsTrained: fn.recordsTrained,
      modelVersion: fn.modelVersion,
      localAccuracy: fn.localAccuracy,
      lossMetric: fn.lossMetric,
      weightHash: fn.weightHash,
      verificationStatus: fn.verificationStatus,
      latencyMs: fn.latencyMs,
      lastWeightUpload: fn.lastWeightUpload,
      contributedInsights: fn.contributedInsights,
      rawVaultStatus: fn.rawVaultStatus,
      updatedAt: now,
    });
  }

  console.log('✅ MedPulse PostgreSQL Database Seed Completed Successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.close();
  });
