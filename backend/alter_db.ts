import { pgPool } from './src/config/postgres';

async function run() {
  try {
    await pgPool.query(`ALTER TABLE codigos ADD COLUMN IF NOT EXISTS calificacion SMALLINT DEFAULT 0 CHECK (calificacion BETWEEN 0 AND 5)`);
    console.log('Successfully added calificacion column');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
