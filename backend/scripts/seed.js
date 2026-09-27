require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/database');
const User = require('../src/models/userModel');
const Gig = require('../src/models/gigModel');
const Booking = require('../src/models/bookingModel');
const Transaction = require('../src/models/transactionModel');
const { hashPassword } = require('../src/services/passwordService');

// Same strength rules as registration: 8+ characters with uppercase, lowercase and a number
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function generateBookingReference() {
  return `HH-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function seed() {
  // Safety check: never wipe a production database
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeding is disabled when NODE_ENV is production.');
  }

  // Demo accounts use a password from .env, so no password is stored in the code
  const password = process.env.SEED_PASSWORD;
  if (!password || !STRONG_PASSWORD.test(password)) {
    throw new Error(
      'Set SEED_PASSWORD in .env (at least 8 characters with uppercase, lowercase and a number).'
    );
  }

  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    Transaction.deleteMany({}),
    Booking.deleteMany({}),
    Gig.deleteMany({}),
    User.deleteMany({}),
  ]);

  console.log('Creating demo users...');
  const passwordHash = await hashPassword(password);
  const [admin, freelancerOne, freelancerTwo, clientOne, clientTwo] = await User.create([
    { email: 'admin@hustlehub.com', passwordHash, role: 'admin' },
    { email: 'freelancer1@hustlehub.com', passwordHash, role: 'freelancer' },
    { email: 'freelancer2@hustlehub.com', passwordHash, role: 'freelancer' },
    { email: 'client1@hustlehub.com', passwordHash, role: 'client' },
    { email: 'client2@hustlehub.com', passwordHash, role: 'client' },
  ]);

  console.log('Creating demo gigs...');
  const gigs = await Gig.create([
    {
      freelancer: freelancerOne._id,
      title: 'Logo Design for Small Businesses',
      description: 'A clean, modern logo for your brand with two rounds of revisions included.',
      category: 'Design',
      price: 850,
      deliveryDays: 5,
    },
    {
      freelancer: freelancerOne._id,
      title: 'Responsive Business Website',
      description: 'A mobile-friendly website of up to five pages, built and ready to launch.',
      category: 'Development',
      price: 4500,
      deliveryDays: 14,
    },
    {
      freelancer: freelancerOne._id,
      title: 'Social Media Graphics Pack',
      description: 'Ten custom graphics sized for Instagram, Facebook and LinkedIn posts.',
      category: 'Design',
      price: 600,
      deliveryDays: 3,
    },
    {
      freelancer: freelancerTwo._id,
      title: 'SEO Blog Article Writing',
      description: 'A well-researched 1000-word blog article optimised for search engines.',
      category: 'Writing',
      price: 400,
      deliveryDays: 2,
    },
    {
      freelancer: freelancerTwo._id,
      title: 'Social Media Marketing Plan',
      description: 'A one-month content and posting plan tailored to your target audience.',
      category: 'Marketing',
      price: 1200,
      deliveryDays: 7,
    },
    {
      freelancer: freelancerTwo._id,
      title: 'Matric Mathematics Tutoring',
      description: 'A one-hour online tutoring session covering Grade 12 mathematics topics.',
      category: 'Tutoring',
      price: 250,
      deliveryDays: 1,
    },
  ]);

  console.log('Creating demo bookings and transactions...');
  const demoBookings = [
    { client: clientOne, gig: gigs[0] },
    { client: clientOne, gig: gigs[3] },
    { client: clientTwo, gig: gigs[1] },
  ];

  // Every booking gets a matching transaction, the same as a real booking
  for (const { client, gig } of demoBookings) {
    const booking = await Booking.create({
      client: client._id,
      freelancer: gig.freelancer,
      gig: gig._id,
      gigTitle: gig.title,
      amount: gig.price,
      reference: generateBookingReference(),
    });

    await Transaction.create({
      booking: booking._id,
      client: booking.client,
      freelancer: booking.freelancer,
      amount: booking.amount,
    });
  }

  console.log('\nSeeding complete. Demo accounts (password from SEED_PASSWORD):');
  for (const user of [admin, freelancerOne, freelancerTwo, clientOne, clientTwo]) {
    console.log(`  ${user.role.padEnd(10)} ${user.email}`);
  }
  console.log(`\n${gigs.length} gigs and ${demoBookings.length} bookings with transactions created.`);
}

seed()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Seeding failed:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  });