import { pgPool } from './src/config/postgres';

interface SeedRow {
  modo: string;
  submodo: string;
  clase: string;
  arma: string;
  codigo: string;
  calificacion?: number;
}

const RAW_DATA: SeedRow[] = [
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Fusiles de Tirador', arma: 'SO14', codigo: 'S0-14-1C2D4A5H8B', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Temporada 1', clase: 'Subfusiles', arma: 'VMP', codigo: 'VMP-2D4E5H6B8A', calificacion: 5 },
  { modo: 'Battle Royale', submodo: 'Temporada 1', clase: 'Fusiles de Precisión', arma: 'DL Q33', codigo: 'DL Q33-2A4A5H6A7A', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Fusiles de Precisión', arma: 'LW3-Tundra', codigo: 'LW3-Tundra-1A2A5A8A9E', calificacion: 5 },
  { modo: 'Battle Royale', submodo: 'Temporada 2', clase: 'Subfusiles', arma: 'Type 63', codigo: 'Type 63-1B2B4A8B9F', calificacion: 5 },
  { modo: 'Zombies', submodo: 'Supervivencia', clase: 'Ametralladoras Ligeras', arma: 'RPD', codigo: 'RPD-5K3M7Z-ZM', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Predeterminado', clase: 'Escopetas', arma: 'KRM-262', codigo: 'KRM-2X8L4Q-MP', calificacion: 4 },
  { modo: 'Battle Royale', submodo: 'Temporada 2', clase: 'Fusiles de Tirador', arma: 'Type 63', codigo: 'Type 63-1B2B4A8B9F', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Subfusiles', arma: 'VMP', codigo: 'VMP-2D4C5H8E9B', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Temporada 1', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D3E4A8B', calificacion: 4 },
  { modo: 'Battle Royale', submodo: 'Temporada 2', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D3N4A8B', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Subfusiles', arma: 'FSS Hurricane', codigo: 'FSS Hurricane-1C2B3A6C7C', calificacion: 4 },
  { modo: 'Battle Royale', submodo: 'Temporada 1', clase: 'Ametralladoras Ligeras', arma: 'Chopper', codigo: 'Chopper-1C2C5A6C7G', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Ametralladoras Ligeras', arma: 'MG42', codigo: 'MG42-1E2D5E8D9A', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Predeterminado', clase: 'Fusiles de Asalto', arma: 'XM4', codigo: 'XM4-1A2G4E8F9E', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Temporada 2', clase: 'Fusiles de Asalto', arma: 'BAL-27', codigo: 'BAL-27-1D2C4A8A9A', calificacion: 4 },
  { modo: 'Battle Royale', submodo: 'Temporada 1', clase: 'Subfusiles', arma: 'FSS Hurricane', codigo: 'FSS Hurricane-1C2B4C5B8B', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Fusiles de Tirador', arma: 'Type 63', codigo: 'Type 63-1B2B4A8B9F', calificacion: 5 },
  { modo: 'Battle Royale', submodo: 'Temporada 2', clase: 'Fusiles de Asalto', arma: 'FFAR 1', codigo: 'FFAR 1-1B2F7B8E9E', calificacion: 4 },
  { modo: 'Zombies', submodo: 'Supervivencia', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Subfusiles', arma: 'USS 9', codigo: 'USS 9-1C2D4A6C8B', calificacion: 4 },
  { modo: 'Zombies', submodo: 'Supervivencia', clase: 'Ametralladoras Ligeras', arma: 'DP27', codigo: 'DP27-1D2B3A4D7D', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Fusiles de Asalto', arma: 'Type 19', codigo: 'Type 19-2B4A7B8B9B', calificacion: 5 },
  { modo: 'Battle Royale', submodo: 'Temporada 1', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1G2C3B4E6E', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Subfusiles', arma: 'CBR4', codigo: 'CBR4-1A2B4A5E9A', calificacion: 5 },
  { modo: 'Battle Royale', submodo: 'Temporada 1', clase: 'Subfusiles', arma: 'USS 9', codigo: 'USS 9-1C2D4A6C8B', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Ametralladoras Ligeras', arma: 'Chopper', codigo: 'Chopper-1C2C5A6C7G', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Temporada 2', clase: 'Subfusiles', arma: 'USS 9', codigo: 'USS 9-1C2D4A6C8B', calificacion: 4 },
  { modo: 'Battle Royale', submodo: 'Temporada 2', clase: 'Fusiles de Asalto', arma: 'BAL-27', codigo: 'BAL-27-1I2C3P7R8A', calificacion: 4 },
  { modo: 'Zombies', submodo: 'Supervivencia', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5D8B', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Subfusiles', arma: 'VMP', codigo: 'VMP-2D4C5H8A9C', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B', calificacion: 5 },
  { modo: 'Battle Royale', submodo: 'Temporada 1', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5D8B', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Temporada 2', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B', calificacion: 4 },
  { modo: 'Battle Royale', submodo: 'Temporada 2', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5D8B', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Fusiles de Asalto', arma: 'Lachmann-556', codigo: 'Lachmann-556-1B3B5B7A8B', calificacion: 4 },
  { modo: 'Battle Royale', submodo: 'Temporada 2', clase: 'Fusiles de Precisión', arma: 'Koshka', codigo: 'Koshka-2A4A5G6A9C', calificacion: 5 },
  { modo: 'Battle Royale', submodo: 'Temporada 1', clase: 'Fusiles de Precisión', arma: 'LW3-Tundra', codigo: 'LW3-Tundra-1A2A5A8A9E', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Fusiles de Precisión', arma: 'Locus', codigo: 'Locus-1B2A4B8C9C', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5D8B', calificacion: 4 },
  { modo: 'Battle Royale', submodo: 'Temporada 2', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4B6B8B', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Subfusiles', arma: 'LC10', codigo: 'LC10-1C2F4D6C8F', calificacion: 5 },
  { modo: 'Battle Royale', submodo: 'Temporada 1', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1I2A4A5D9A', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Temporada 2', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4E6C7N', calificacion: 4 },
  { modo: 'Battle Royale', submodo: 'Temporada 2', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Predeterminado', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B', calificacion: 5 },
  { modo: 'Zombies', submodo: 'Supervivencia', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B', calificacion: 5 },
  { modo: 'Battle Royale', submodo: 'Temporada 1', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D3E4A8B', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Fusiles de Precisión', arma: 'LW3-Tundra', codigo: 'LW3-Tundra-1C2B4D8A9E', calificacion: 5 },
  { modo: 'Battle Royale', submodo: 'Temporada 2', clase: 'Fusiles de Precisión', arma: 'Locus', codigo: 'Locus-1B2A4B8C9C', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Fusiles de Asalto', arma: 'XM4', codigo: 'XM4-1A2G4E7C8A', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Temporada 1', clase: 'Fusiles de Precisión', arma: 'Locus', codigo: 'Locus-1B2A4B8C9C', calificacion: 4 },
  { modo: 'Battle Royale', submodo: 'Temporada 1', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D3E4A8B', calificacion: 5 },
  { modo: 'Battle Royale', submodo: 'Temporada 2', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A9A', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Fusiles de Asalto', arma: 'FR .556', codigo: 'FR .556-1C2C4A5A8A', calificacion: 4 },
  { modo: 'Battle Royale', submodo: 'Temporada 2', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1D2A4A5H8B', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Predeterminado', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5D8B', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4B6B8B', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Temporada 2', clase: 'Subfusiles', arma: 'LC10', codigo: 'LC10-1C2F4D6C8F', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Competitivo / Ranked', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1I2A4A5D9A', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Temporada 1', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4E6C7N', calificacion: 4 },
  { modo: 'Multijugador', submodo: 'Temporada 1', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B', calificacion: 5 },
  { modo: 'Multijugador', submodo: 'Predeterminado', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B', calificacion: 5 },
  { modo: 'Zombies', submodo: 'Supervivencia', clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B', calificacion: 5 },
];

const WEAPONS_CATALOG: Record<string, string[]> = {
  'Fusiles de Asalto': ['XM4', 'BAL-27', 'FFAR 1', 'Type 19', 'Lachmann-556', 'FR .556', 'M4', 'AK-47', 'M13', 'Kilo 141', 'Grau 5.56', 'BP50'],
  'Subfusiles': ['VMP', 'Type 63', 'FSS Hurricane', 'USS 9', 'CBR4', 'LC10', 'QQ9', 'Fennec', 'PP19 Bizon', 'Switchblade X9', 'CX-9'],
  'Fusiles de Precisión': ['DL Q33', 'LW3-Tundra', 'Koshka', 'Locus', 'Arctic .50', 'Rytec AMR', 'HDR', 'ZRG 20mm'],
  'Fusiles de Tirador': ['SO-14', 'Type 63', 'SO14', 'SKS', 'SP-R 208', 'MK2'],
  'Ametralladoras Ligeras': ['RPD', 'Chopper', 'MG42', 'DP27', 'Holger 26', 'Hades', 'Bruen Mk9'],
  'Escopetas': ['KRM-262', 'BY15', 'HS0405', 'JAK-12', 'Argus', 'R9-0'],
};

const MODOS_CONFIG = [
  {
    codigo: 'MJ',
    nombre: 'Multijugador',
    descripcion: 'Partidas competitivas, Ranked y Modos Clásicos',
    submodos: [
      { nombre: 'Competitivo / Ranked', es_predeterminado: false, orden: 1 },
      { nombre: 'Temporada 1', es_predeterminado: false, orden: 2 },
      { nombre: 'Temporada 2', es_predeterminado: false, orden: 3 },
      { nombre: 'Predeterminado', es_predeterminado: true, orden: 4 },
    ]
  },
  {
    codigo: 'BR',
    nombre: 'Battle Royale',
    descripcion: 'Supervivencia a gran escala en Isolated y Blackout',
    submodos: [
      { nombre: 'Temporada 1', es_predeterminado: false, orden: 1 },
      { nombre: 'Temporada 2', es_predeterminado: false, orden: 2 },
      { nombre: 'Predeterminado', es_predeterminado: true, orden: 3 },
    ]
  },
  {
    codigo: 'ZM',
    nombre: 'Zombies',
    descripcion: 'Supervivencia horda y brote zombie',
    submodos: [
      { nombre: 'Supervivencia', es_predeterminado: false, orden: 1 },
      { nombre: 'Predeterminado', es_predeterminado: true, orden: 2 },
    ]
  }
];

async function seed() {
  const client = await pgPool.connect();
  try {
    console.log('⚡ Iniciando Seeding de NexusCOD con Armas Reales...');
    await client.query('BEGIN');

    // 1. Ajustar constraints de la base de datos
    await client.query('ALTER TABLE codigos DROP CONSTRAINT IF EXISTS check_codigo_formato');
    await client.query('ALTER TABLE objetos DROP CONSTRAINT IF EXISTS check_posicion');
    await client.query('ALTER TABLE codigos ADD COLUMN IF NOT EXISTS calificacion SMALLINT DEFAULT 0 CHECK (calificacion BETWEEN 0 AND 5)');

    // 2. Crear o actualizar Modos y Submodos
    const modeMap: Record<string, number> = {};
    const submodeMap: Record<string, number> = {}; // key: "ModoName|SubmodeName" -> id
    const classMap: Record<string, number> = {}; // key: "submodeId|ClassName" -> id

    for (const m of MODOS_CONFIG) {
      const modeRes = await client.query(
        `INSERT INTO modos (codigo, nombre, descripcion) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (codigo) 
         DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion 
         RETURNING id`,
        [m.codigo, m.nombre, m.descripcion]
      );
      const modeId = modeRes.rows[0].id;
      modeMap[m.nombre] = modeId;

      for (const sm of m.submodos) {
        let submodeId: number;
        const smRes = await client.query(
          'SELECT id FROM submodos WHERE modo_id = $1 AND nombre = $2',
          [modeId, sm.nombre]
        );
        if (smRes.rows.length > 0) {
          submodeId = smRes.rows[0].id;
          await client.query(
            'UPDATE submodos SET es_predeterminado = $1, orden = $2 WHERE id = $3',
            [sm.es_predeterminado, sm.orden, submodeId]
          );
        } else {
          const insertSm = await client.query(
            'INSERT INTO submodos (modo_id, nombre, es_predeterminado, orden) VALUES ($1, $2, $3, $4) RETURNING id',
            [modeId, sm.nombre, sm.es_predeterminado, sm.orden]
          );
          submodeId = insertSm.rows[0].id;
        }
        submodeMap[`${m.nombre}|${sm.nombre}`] = submodeId;

        // 3. Crear Clases estándar en cada submodo
        for (const [className, weaponList] of Object.entries(WEAPONS_CATALOG)) {
          let classId: number;
          const clRes = await client.query(
            'SELECT id FROM clases WHERE submodo_id = $1 AND nombre = $2',
            [submodeId, className]
          );
          if (clRes.rows.length > 0) {
            classId = clRes.rows[0].id;
          } else {
            const insertCl = await client.query(
              'INSERT INTO clases (submodo_id, nombre) VALUES ($1, $2) RETURNING id',
              [submodeId, className]
            );
            classId = insertCl.rows[0].id;
          }
          classMap[`${submodeId}|${className}`] = classId;

          // Sembrar armas catálogo en slots
          for (let i = 0; i < weaponList.length; i++) {
            const wName = weaponList[i];
            const pos = i + 1;
            await client.query(
              `INSERT INTO objetos (clase_id, posicion, nombre) 
               VALUES ($1, $2, $3)
               ON CONFLICT (clase_id, posicion) 
               DO UPDATE SET nombre = EXCLUDED.nombre`,
              [classId, pos, wName]
            );
          }
        }
      }
    }

    // 4. Inserción de los Códigos del dataset real
    console.log(`📦 Insertando ${RAW_DATA.length} configuraciones de armero con códigos reales...`);
    let codesInserted = 0;

    for (const row of RAW_DATA) {
      const modeId = modeMap[row.modo];
      if (!modeId) continue;

      let submodeName = row.submodo.trim();
      if (!submodeName) submodeName = 'Temporada 1';

      let submodeId = submodeMap[`${row.modo}|${submodeName}`];
      if (!submodeId) {
        // Fallback or create submode if needed
        const smRes = await client.query(
          'SELECT id FROM submodos WHERE modo_id = $1 AND nombre ILIKE $2',
          [modeId, `%${submodeName}%`]
        );
        if (smRes.rows.length > 0) {
          submodeId = smRes.rows[0].id;
        } else {
          const newSm = await client.query(
            'INSERT INTO submodos (modo_id, nombre, es_predeterminado, orden) VALUES ($1, $2, false, 9) RETURNING id',
            [modeId, submodeName]
          );
          submodeId = newSm.rows[0].id;
          submodeMap[`${row.modo}|${submodeName}`] = submodeId;
        }
      }

      let classId = classMap[`${submodeId}|${row.clase}`];
      if (!classId) {
        const clRes = await client.query(
          'SELECT id FROM clases WHERE submodo_id = $1 AND nombre = $2',
          [submodeId, row.clase]
        );
        if (clRes.rows.length > 0) {
          classId = clRes.rows[0].id;
        } else {
          const insertCl = await client.query(
            'INSERT INTO clases (submodo_id, nombre) VALUES ($1, $2) RETURNING id',
            [submodeId, row.clase]
          );
          classId = insertCl.rows[0].id;
        }
        classMap[`${submodeId}|${row.clase}`] = classId;
      }

      // Buscar u obtener el objeto (arma) en esta clase
      let objetoId: number;
      const objRes = await client.query(
        'SELECT id FROM objetos WHERE clase_id = $1 AND nombre = $2',
        [classId, row.arma]
      );

      if (objRes.rows.length > 0) {
        objetoId = objRes.rows[0].id;
      } else {
        // Calcular la siguiente posición disponible
        const maxPosRes = await client.query(
          'SELECT COALESCE(MAX(posicion), 0) + 1 AS next_pos FROM objetos WHERE clase_id = $1',
          [classId]
        );
        const nextPos = maxPosRes.rows[0].next_pos;
        const newObj = await client.query(
          'INSERT INTO objetos (clase_id, nombre, posicion) VALUES ($1, $2, $3) RETURNING id',
          [classId, row.arma, nextPos]
        );
        objetoId = newObj.rows[0].id;
      }

      // Insertar código con calificación si no existe ya
      const codeCheck = await client.query(
        'SELECT id FROM codigos WHERE objeto_id = $1 AND codigo = $2',
        [objetoId, row.codigo]
      );

      const rating = row.calificacion ? Math.round(row.calificacion) : 0;

      if (codeCheck.rows.length === 0) {
        await client.query(
          'INSERT INTO codigos (objeto_id, codigo, calificacion) VALUES ($1, $2, $3)',
          [objetoId, row.codigo, rating]
        );
        codesInserted++;
      } else {
        await client.query(
          'UPDATE codigos SET calificacion = $1 WHERE id = $2',
          [rating, codeCheck.rows[0].id]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`✅ ¡Seeding completado con éxito!`);
    console.log(`📊 Modos activos: ${Object.keys(modeMap).length}`);
    console.log(`🎯 Códigos insertados/actualizados: ${codesInserted}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error ejecutando seeding:', error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
