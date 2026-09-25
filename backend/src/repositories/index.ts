import { ICodRepository } from '../types/cod.types';
import { PostgresCodRepository } from './postgres.repository';
import { MongoCodRepository } from './mongo.repository';
import { connectMongo } from '../config/mongo';
import { pgPool } from '../config/postgres';

export const getRepository = async (): Promise<ICodRepository> => {
  const driver = process.env.DB_DRIVER || 'postgres';

  if (driver === 'mongodb') {
    await connectMongo();
    console.log('[Factory] Usando Repositorio: MongoDB Atlas');
    return new MongoCodRepository() as any;
  }

  // Verificación básica del pool de Postgres
  try {
    await pgPool.query('SELECT 1');
    console.log('[Factory] Usando Repositorio: PostgreSQL Local');
    return new PostgresCodRepository();
  } catch (err) {
    console.error('[Factory] Error conectando a PostgreSQL:', err);
    throw err;
  }
};
