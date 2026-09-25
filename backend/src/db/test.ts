import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { PostgresCodRepository } from '../repositories/postgres.repository';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runTests() {
  const repo = new PostgresCodRepository();
  
  console.log('Testing getting all modes...');
  let modes = await repo.getAllModes();
  console.log(JSON.stringify(modes, null, 2));
  
  if (modes.length > 0) {
    const firstMode = modes[0];
    console.log(`Testing changing mode name from ${firstMode.nombre} to 'Multijugador (Editado)'`);
    await repo.updateModeName(firstMode.id, 'Multijugador (Editado)');
    
    modes = await repo.getAllModes();
    console.log(`New name: ${modes[0].nombre}`);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  
  try {
    console.log('Testing constraint CHECK (posicion BETWEEN 1 AND 7)...');
    await client.query("INSERT INTO objetos (clase_id, nombre, posicion) VALUES (1, 'Arma de Prueba', 8)");
    console.log('❌ Error: Inserted object with invalid position 8');
  } catch (err: any) {
    console.log('✅ Success: Caught expected error for position:', err.message);
  }
  
  try {
    console.log("Testing constraint CHECK (codigo ~ '^[A-Za-z]+-[A-Za-z0-9]{10}$')...");
    await client.query("INSERT INTO codigos (objeto_id, codigo) VALUES (1, 'INVALIDO')");
    console.log('❌ Error: Inserted invalid code format');
  } catch (err: any) {
    console.log('✅ Success: Caught expected error for code format:', err.message);
  }

  await client.end();
}

runTests();
