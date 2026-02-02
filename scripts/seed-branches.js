import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Sample data branches - Surya Painting locations
const SAMPLE_BRANCHES = [
  {
    name: 'Surya Painting - Jakarta Pusat',
    code: 'JPT-001',
    location: 'Jalan Kebon Sirih No. 45, Jakarta Pusat, DKI Jakarta 12140'
  },
  {
    name: 'Surya Painting - Jakarta Barat',
    code: 'JBR-001',
    location: 'Jalan Raya Panjang No. 123, Jakarta Barat, DKI Jakarta 11530'
  },
  {
    name: 'Surya Painting - Jakarta Timur',
    code: 'JTM-001',
    location: 'Jalan Mayjend Sutoyo No. 78, Jakarta Timur, DKI Jakarta 13770'
  },
  {
    name: 'Surya Painting - Jakarta Selatan',
    code: 'JSL-001',
    location: 'Jalan Cilandak Barat Raya No. 56, Jakarta Selatan, DKI Jakarta 12430'
  },
  {
    name: 'Surya Painting - Bogor',
    code: 'BGR-001',
    location: 'Jalan Raya Pajajaran No. 34, Bogor, Jawa Barat 16143'
  },
  {
    name: 'Surya Painting - Bekasi',
    code: 'BKS-001',
    location: 'Jalan Ahmad Yani No. 89, Bekasi, Jawa Barat 17147'
  }
];

let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.includes('sslmode=require')) {
  dbUrl = dbUrl.replace('sslmode=require', 'sslmode=no-verify');
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function seedBranches() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding branch data...\n');

    for (const branch of SAMPLE_BRANCHES) {
      const result = await client.query(
        'INSERT INTO branches (name, code) VALUES ($1, $2) RETURNING id, name, code',
        [branch.name, branch.code]
      );
      console.log(`✅ Added: ${result.rows[0].name}`);
    }

    console.log(`\n✅ Successfully seeded ${SAMPLE_BRANCHES.length} branches!`);
    console.log('\n📊 Summary:');
    console.log(`  Total branches: ${SAMPLE_BRANCHES.length}`);
    console.log('  Locations: Jakarta (4) + Bogor (1) + Bekasi (1)');

  } catch (error) {
    if (error.code === '23505') {
      console.log('⚠️ Branches already exist (unique constraint violation)');
      console.log('   To reset, run: DELETE FROM branches;');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

seedBranches();
