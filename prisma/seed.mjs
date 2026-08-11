import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_SOURCE = "seed-demo";

const CITIES = [
  { name: "Jaipur", city: "Jaipur", region: "Rajasthan", country: "India", latitude: 26.9124, longitude: 75.7873 },
  { name: "Delhi", city: "Delhi", region: "Delhi", country: "India", latitude: 28.6139, longitude: 77.209 },
  { name: "Mumbai", city: "Mumbai", region: "Maharashtra", country: "India", latitude: 19.076, longitude: 72.8777 },
  { name: "Bengaluru", city: "Bengaluru", region: "Karnataka", country: "India", latitude: 12.9716, longitude: 77.5946 },
];

const RISK_CATEGORIES = ["AIR", "HEAT", "WATER", "DISEASE", "DISASTER", "OVERALL"];

function levelForScore(score) {
  if (score <= 20) return "LOW";
  if (score <= 40) return "MODERATE";
  if (score <= 60) return "ELEVATED";
  if (score <= 80) return "HIGH";
  return "EXTREME";
}

async function seedDemoAccounts() {
  const accounts = [
    { email: "demo@climateguardian.ai", name: "Demo Citizen", role: "USER" },
    { email: "gov@climateguardian.ai", name: "Demo Government Analyst", role: "GOVERNMENT" },
    { email: "admin@climateguardian.ai", name: "Demo Admin", role: "ADMIN" },
  ];

  for (const account of accounts) {
    const passwordHash = await bcrypt.hash("demo1234", 12);
    await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        name: account.name,
        email: account.email,
        passwordHash,
        role: account.role,
        profile: { create: {} },
      },
    });
    console.log(`[seed] demo account ready: ${account.role} (${account.email}) — password: demo1234`);
  }
}

async function seedCity(cityDef) {
  const locationId = `seed-${cityDef.city.toLowerCase()}`;

  const location = await prisma.location.upsert({
    where: { id: locationId },
    update: {},
    create: {
      id: locationId,
      name: cityDef.name,
      city: cityDef.city,
      region: cityDef.region,
      country: cityDef.country,
      latitude: cityDef.latitude,
      longitude: cityDef.longitude,
      isPrimary: false,
    },
  });

  // This script is re-run idempotently: clear this city's previously-seeded
  // dependent records before recreating them, so reruns never duplicate.
  await prisma.riskScore.deleteMany({ where: { locationId } });
  await prisma.alert.deleteMany({ where: { locationId } });
  await prisma.weatherRecord.deleteMany({ where: { locationId } });
  await prisma.airQualityRecord.deleteMany({ where: { locationId } });
  await prisma.hospital.deleteMany({ where: { name: { startsWith: `[DEMO] ${cityDef.city}` } } });
  await prisma.shelter.deleteMany({ where: { name: { startsWith: `[DEMO] ${cityDef.city}` } } });
  await prisma.waterPoint.deleteMany({ where: { name: { startsWith: `[DEMO] ${cityDef.city}` } } });

  await prisma.weatherRecord.create({
    data: {
      locationId: location.id,
      temperature: 28 + Math.random() * 10,
      humidity: 40 + Math.random() * 40,
      windSpeed: 5 + Math.random() * 15,
      precipitation: Math.random() * 10,
      uvIndex: 4 + Math.random() * 7,
      rainfallMm: Math.random() * 50,
      isDemoData: true,
      source: DEMO_SOURCE,
    },
  });

  await prisma.airQualityRecord.create({
    data: {
      locationId: location.id,
      aqi: 60 + Math.random() * 150,
      pm25: 20 + Math.random() * 100,
      pm10: 30 + Math.random() * 120,
      o3: 20 + Math.random() * 60,
      no2: 10 + Math.random() * 50,
      isDemoData: true,
      source: DEMO_SOURCE,
    },
  });

  for (const category of RISK_CATEGORIES) {
    const score = Math.round(20 + Math.random() * 60);
    await prisma.riskScore.create({
      data: {
        locationId: location.id,
        category,
        score,
        level: levelForScore(score),
        factors: [{ label: "Seed factor", value: score, weight: 1, contribution: score }],
        isDemoData: true,
      },
    });
  }

  await prisma.hospital.create({
    data: {
      name: `[DEMO] ${cityDef.city} General Hospital`,
      address: `1 Hospital Road, ${cityDef.city}`,
      city: cityDef.city,
      latitude: cityDef.latitude + 0.01,
      longitude: cityDef.longitude + 0.01,
      phone: "+91-000-000-0000",
      emergency: true,
      capacity: 200,
    },
  });

  await prisma.shelter.create({
    data: {
      name: `[DEMO] ${cityDef.city} Relief Shelter`,
      address: `12 Relief Camp Road, ${cityDef.city}`,
      city: cityDef.city,
      latitude: cityDef.latitude - 0.01,
      longitude: cityDef.longitude - 0.01,
      phone: "+91-000-000-0001",
      capacity: 500,
      isActive: true,
    },
  });

  await prisma.waterPoint.create({
    data: {
      name: `[DEMO] ${cityDef.city} Public Tap`,
      type: "PUBLIC_TAP",
      status: "OPERATIONAL",
      address: `Main Market, ${cityDef.city}`,
      city: cityDef.city,
      latitude: cityDef.latitude + 0.02,
      longitude: cityDef.longitude - 0.02,
    },
  });

  await prisma.waterPoint.create({
    data: {
      name: `[DEMO] ${cityDef.city} Government Relief Center`,
      type: "RELIEF_CENTER",
      status: "OPERATIONAL",
      address: `Civic Centre, ${cityDef.city}`,
      city: cityDef.city,
      latitude: cityDef.latitude - 0.02,
      longitude: cityDef.longitude + 0.02,
    },
  });

  await prisma.alert.create({
    data: {
      locationId: location.id,
      type: "HIGH_AQI",
      severity: "WARNING",
      source: "MODELLED_RISK",
      title: `[DEMO] Elevated air quality risk in ${cityDef.city}`,
      message:
        "Seeded demo alert: modelled air-quality risk is elevated. This is not a live or official alert.",
      isActive: true,
    },
  });

  console.log(`[seed] ${cityDef.city}: location, weather, air quality, risk scores, hospital, shelter, 2 water points, alert`);
}

async function main() {
  const only = process.argv[2];

  if (only === "accounts") {
    await seedDemoAccounts();
  } else if (only) {
    const cityDef = CITIES.find((c) => c.city.toLowerCase() === only.toLowerCase());
    if (!cityDef) throw new Error(`Unknown city "${only}"`);
    await seedCity(cityDef);
  } else {
    await seedDemoAccounts();
    for (const cityDef of CITIES) {
      await seedCity(cityDef);
    }
  }
  console.log("[seed] Done. All records above are DEMO/SEED data, not live production data.");
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
