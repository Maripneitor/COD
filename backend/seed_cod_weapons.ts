import { pgPool } from './src/config/postgres';

interface MJEntry {
  clase: string;
  arma: string;
  codigo: string;
}

function normalizeWeaponName(name: string): string {
  const clean = name.trim();
  const upper = clean.toUpperCase().replace(/\s+/g, ' ');
  if (upper === 'SO14' || upper === 'S014' || upper === 'S0-14' || upper === 'SO 14') return 'SO-14';
  if (upper === 'TYPE63' || upper === 'TYPE-63' || upper === 'TYPE 63') return 'Type 63';
  if (upper === 'TYPE19' || upper === 'TYPE-19' || upper === 'TYPE 19') return 'Type 19';
  if (upper === 'FR 556' || upper === 'FR556' || upper === 'FR.556' || upper === 'FR .556') return 'FR .556';
  if (upper === 'BAL27' || upper === 'BAL 27' || upper === 'BAL-27') return 'BAL-27';
  if (upper === 'KRM262' || upper === 'KRM 262' || upper === 'KRM-262') return 'KRM-262';
  if (upper === 'DLQ33' || upper === 'DL-Q33' || upper === 'DLQ 33' || upper === 'DL Q33') return 'DL Q33';
  if (upper === 'LW3 TUNDRA' || upper === 'LW3TUNDRA' || upper === 'LW3-TUNDRA') return 'LW3-Tundra';
  if (upper === 'FSS-HURRICANE' || upper === 'FSS HURRICANE') return 'FSS Hurricane';
  if (upper === 'USS9' || upper === 'USS-9' || upper === 'USS 9') return 'USS 9';
  if (upper === 'FFAR1' || upper === 'FFAR-1' || upper === 'FFAR 1') return 'FFAR 1';
  if (upper === 'LACHMANN 556' || upper === 'LACHMANN-556') return 'Lachmann-556';
  return clean;
}

const RAW_MJ_DATASET: MJEntry[] = [
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5H8B' },
  { clase: 'Subfusiles', arma: 'VMP', codigo: 'VMP-2D4E5H6B8A' },
  { clase: 'Fusiles de Precisión', arma: 'DL Q33', codigo: 'DL Q33-2A4A5H6A7A' },
  { clase: 'Fusiles de Precisión', arma: 'LW3-Tundra', codigo: 'LW3-Tundra-1A2A5A8A9E' },
  { clase: 'Subfusiles', arma: 'Type 63', codigo: 'Type 63-1B2B4A8B9F' },
  { clase: 'Ametralladoras Ligeras', arma: 'RPD', codigo: 'RPD-5K3M7Z-ZM' },
  { clase: 'Escopetas', arma: 'KRM-262', codigo: 'KRM-2X8L4Q-MP' },
  { clase: 'Fusiles de Tirador', arma: 'Type 63', codigo: 'Type 63-1B2B4A8B9F' },
  { clase: 'Subfusiles', arma: 'VMP', codigo: 'VMP-2D4C5H8E9B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D3E4A8B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D3N4A8B' },
  { clase: 'Subfusiles', arma: 'FSS Hurricane', codigo: 'FSS Hurricane-1C2B3A6C7C' },
  { clase: 'Ametralladoras Ligeras', arma: 'Chopper', codigo: 'Chopper-1C2C5A6C7G' },
  { clase: 'Ametralladoras Ligeras', arma: 'MG42', codigo: 'MG42-1E2D5E8D9A' },
  { clase: 'Fusiles de Asalto', arma: 'XM4', codigo: 'XM4-1A2G4E8F9E' },
  { clase: 'Fusiles de Asalto', arma: 'BAL-27', codigo: 'BAL-27-1D2C4A8A9A' },
  { clase: 'Subfusiles', arma: 'FSS Hurricane', codigo: 'FSS Hurricane-1C2B4C5B8B' },
  { clase: 'Fusiles de Asalto', arma: 'FFAR 1', codigo: 'FFAR 1-1B2F7B8E9E' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B' },
  { clase: 'Subfusiles', arma: 'USS 9', codigo: 'USS 9-1C2D4A6C8B' },
  { clase: 'Ametralladoras Ligeras', arma: 'DP27', codigo: 'DP27-1D2B3A4D7D' },
  { clase: 'Fusiles de Asalto', arma: 'Type 19', codigo: 'Type 19-2B4A7B8B9B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1G2C3B4E6E' },
  { clase: 'Subfusiles', arma: 'CBR4', codigo: 'CBR4-1A2B4A5E9A' },
  { clase: 'Fusiles de Asalto', arma: 'BAL-27', codigo: 'BAL-27-1I2C3P7R8A' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5D8B' },
  { clase: 'Subfusiles', arma: 'VMP', codigo: 'VMP-2D4C5H8A9C' },
  { clase: 'Fusiles de Asalto', arma: 'Lachmann-556', codigo: 'Lachmann-556-1B3B5B7A8B' },
  { clase: 'Fusiles de Precisión', arma: 'Koshka', codigo: 'Koshka-2A4A5G6A9C' },
  { clase: 'Fusiles de Precisión', arma: 'Locus', codigo: 'Locus-1B2A4B8C9C' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4B6B8B' },
  { clase: 'Subfusiles', arma: 'LC10', codigo: 'LC10-1C2F4D6C8F' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1I2A4A5D9A' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4E6C7N' },
  { clase: 'Fusiles de Precisión', arma: 'LW3-Tundra', codigo: 'LW3-Tundra-1C2B4D8A9E' },
  { clase: 'Fusiles de Asalto', arma: 'XM4', codigo: 'XM4-1A2G4E7C8A' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A9A' },
  { clase: 'Fusiles de Asalto', arma: 'FR .556', codigo: 'FR .556-1C2C4A5A8A' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1D2A4A5H8B' },
];

// Deduplicate the raw dataset strictly by weapon and normalized code
const DEDUPED_MJ_DATASET: MJEntry[] = [];
const seenEntries = new Set<string>();

for (const item of RAW_MJ_DATASET) {
  const normWeapon = normalizeWeaponName(item.arma);
  const normCode = item.codigo.trim().toUpperCase();
  const key = `${item.clase.trim()}|${normWeapon}|${normCode}`;
  if (!seenEntries.has(key)) {
    seenEntries.add(key);
    DEDUPED_MJ_DATASET.push({
      clase: item.clase.trim(),
      arma: normWeapon,
      codigo: normCode,
    });
  }
}

const WEAPONS_CATALOG: Record<string, string[]> = {
  'Fusiles de Asalto': ['XM4', 'BAL-27', 'FFAR 1', 'Type 19', 'Lachmann-556', 'FR .556', 'M4', 'AK-47', 'M13', 'Kilo 141'],
  'Subfusiles': ['VMP', 'Type 63', 'FSS Hurricane', 'USS 9', 'CBR4', 'LC10', 'QQ9', 'Fennec', 'PP19 Bizon'],
  'Fusiles de Precisión': ['DL Q33', 'LW3-Tundra', 'Koshka', 'Locus', 'Arctic .50', 'Rytec AMR', 'HDR'],
  'Fusiles de Tirador': ['SO-14', 'Type 63', 'SKS', 'SP-R 208', 'MK2'],
  'Ametralladoras Ligeras': ['RPD', 'Chopper', 'MG42', 'DP27', 'Holger 26', 'Hades'],
  'Escopetas': ['KRM-262', 'BY15', 'HS0405', 'JAK-12', 'Argus'],
};

// Los 3 Submodos consolidados oficiales
const CONSOLIDATED_SUBMODES = [
  { nombre: 'Primera Línea / Duelo por Equipos', es_predeterminado: true, orden: 1 },
  { nombre: 'Punto Caliente y Dominio', es_predeterminado: false, orden: 2 },
  { nombre: 'Buscar y Destruir / Control', es_predeterminado: false, orden: 3 },
];

async function seed() {
  const client = await pgPool.connect();
  try {
    console.log('⚡ Iniciando consolidación, deduplicación y seeding estricto en NexusCOD...');
    await client.query('BEGIN');

    // 1. Asegurar constraints flexibles y columna de calificación
    await client.query('ALTER TABLE codigos DROP CONSTRAINT IF EXISTS check_codigo_formato');
    await client.query('ALTER TABLE objetos DROP CONSTRAINT IF EXISTS check_posicion');
    await client.query('ALTER TABLE objetos DROP CONSTRAINT IF EXISTS objetos_clase_posicion_key');
    await client.query('ALTER TABLE codigos ADD COLUMN IF NOT EXISTS calificacion SMALLINT DEFAULT 5 CHECK (calificacion BETWEEN 0 AND 5)');

    // 2. Modos Oficiales (MJ, BR, Zombies)
    const MODES = [
      { codigo: 'MJ', nombre: 'Multijugador', descripcion: 'Modos competitivos y clásicos de Call of Duty' },
      { codigo: 'BR', nombre: 'Battle Royale', descripcion: 'Supervivencia a gran escala en Isolated y Blackout' },
      { codigo: 'ZM', nombre: 'Zombies', descripcion: 'Supervivencia táctica por rondas' },
    ];

    const modeIds: Record<string, number> = {};

    for (const m of MODES) {
      const modeRes = await client.query(
        `INSERT INTO modos (codigo, nombre, descripcion) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (codigo) 
         DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion
         RETURNING id`,
        [m.codigo, m.nombre, m.descripcion]
      );
      modeIds[m.codigo] = modeRes.rows[0].id;
    }

    const mjModeId = modeIds['MJ'];

    // 3. Crear los 3 Submodos consolidados en Multijugador
    const submodeMap: Record<string, number> = {};

    for (const sm of CONSOLIDATED_SUBMODES) {
      const smCheck = await client.query(
        'SELECT id FROM submodos WHERE modo_id = $1 AND nombre = $2',
        [mjModeId, sm.nombre]
      );

      let submodeId: number;
      if (smCheck.rows.length > 0) {
        submodeId = smCheck.rows[0].id;
        await client.query(
          'UPDATE submodos SET es_predeterminado = $1, orden = $2 WHERE id = $3',
          [sm.es_predeterminado, sm.orden, submodeId]
        );
      } else {
        const insertSm = await client.query(
          'INSERT INTO submodos (modo_id, nombre, es_predeterminado, orden) VALUES ($1, $2, $3, $4) RETURNING id',
          [mjModeId, sm.nombre, sm.es_predeterminado, sm.orden]
        );
        submodeId = insertSm.rows[0].id;
      }
      submodeMap[sm.nombre] = submodeId;
    }

    // 4. Eliminar submodos obsoletos
    const obsoleteSubmodesRes = await client.query(
      `SELECT id, nombre FROM submodos WHERE modo_id = $1 AND id NOT IN ($2, $3, $4)`,
      [
        mjModeId,
        submodeMap['Primera Línea / Duelo por Equipos'],
        submodeMap['Punto Caliente y Dominio'],
        submodeMap['Buscar y Destruir / Control']
      ]
    );

    for (const oldSm of obsoleteSubmodesRes.rows) {
      await client.query('DELETE FROM submodos WHERE id = $1', [oldSm.id]);
    }

    // 5. Sembrar las 6 categorías y armas en los 3 submodos consolidados
    for (const [submodeName, subId] of Object.entries(submodeMap)) {
      for (const [className, weaponList] of Object.entries(WEAPONS_CATALOG)) {
        let classId: number;
        const clRes = await client.query(
          'SELECT id FROM clases WHERE submodo_id = $1 AND nombre = $2',
          [subId, className]
        );
        if (clRes.rows.length > 0) {
          classId = clRes.rows[0].id;
        } else {
          const insertCl = await client.query(
            'INSERT INTO clases (submodo_id, nombre) VALUES ($1, $2) RETURNING id',
            [subId, className]
          );
          classId = insertCl.rows[0].id;
        }

        // Sembrar armas normalizadas
        for (let i = 0; i < weaponList.length; i++) {
          const rawName = weaponList[i];
          const wName = normalizeWeaponName(rawName);
          const pos = i + 1;
          
          // Buscar si el arma ya existe por nombre exacto o fuzzy
          const objCheck = await client.query(
            `SELECT id FROM objetos 
             WHERE clase_id = $1 
               AND (LOWER(nombre) = LOWER($2) OR LOWER(REPLACE(REPLACE(nombre, '-', ''), ' ', '')) = LOWER(REPLACE(REPLACE($2, '-', ''), ' ', '')))
             LIMIT 1`,
            [classId, wName]
          );

          if (objCheck.rows.length > 0) {
            // Actualizar nombre al estándar normalizado
            await client.query('UPDATE objetos SET nombre = $1 WHERE id = $2', [wName, objCheck.rows[0].id]);
          } else {
            const nextPos = await client.query('SELECT COALESCE(MAX(posicion), 0) + 1 AS np FROM objetos WHERE clase_id = $1', [classId]);
            await client.query(
              'INSERT INTO objetos (clase_id, posicion, nombre) VALUES ($1, $2, $3)',
              [classId, nextPos.rows[0].np, wName]
            );
          }
        }
      }
    }

    // 6. Limpiar códigos duplicados previos en la base de datos (conservar solo el de mayor rating / id menor)
    await client.query(`
      DELETE FROM codigos a USING codigos b
      WHERE a.id > b.id 
        AND a.objeto_id = b.objeto_id 
        AND UPPER(TRIM(a.codigo)) = UPPER(TRIM(b.codigo));
    `);

    // 7. Insertar el dataset deduplicado
    console.log(`📦 Insertando dataset de códigos únicos (${DEDUPED_MJ_DATASET.length} registros) en los 3 submodos...`);
    let codesInserted = 0;

    for (const [submodeName, subId] of Object.entries(submodeMap)) {
      for (const item of DEDUPED_MJ_DATASET) {
        const className = item.clase.trim();
        const weaponName = normalizeWeaponName(item.arma);
        const codeValue = item.codigo.trim().toUpperCase();

        // Obtener clase
        const clRes = await client.query(
          'SELECT id FROM clases WHERE submodo_id = $1 AND nombre = $2',
          [subId, className]
        );
        if (clRes.rows.length === 0) continue;
        const classId = clRes.rows[0].id;

        // Obtener arma (búsqueda normalizada)
        let objetoId: number;
        const objRes = await client.query(
          `SELECT id FROM objetos 
           WHERE clase_id = $1 
             AND (LOWER(nombre) = LOWER($2) OR LOWER(REPLACE(REPLACE(nombre, '-', ''), ' ', '')) = LOWER(REPLACE(REPLACE($2, '-', ''), ' ', '')))
           LIMIT 1`,
          [classId, weaponName]
        );

        if (objRes.rows.length > 0) {
          objetoId = objRes.rows[0].id;
        } else {
          const maxPosRes = await client.query(
            'SELECT COALESCE(MAX(posicion), 0) + 1 AS next_pos FROM objetos WHERE clase_id = $1',
            [classId]
          );
          const nextPos = maxPosRes.rows[0].next_pos;
          const newObj = await client.query(
            'INSERT INTO objetos (clase_id, nombre, posicion) VALUES ($1, $2, $3) RETURNING id',
            [classId, weaponName, nextPos]
          );
          objetoId = newObj.rows[0].id;
        }

        // Insertar código si no existe
        const codeCheck = await client.query(
          'SELECT id FROM codigos WHERE objeto_id = $1 AND UPPER(TRIM(codigo)) = UPPER(TRIM($2))',
          [objetoId, codeValue]
        );

        if (codeCheck.rows.length === 0) {
          await client.query(
            'INSERT INTO codigos (objeto_id, codigo, calificacion) VALUES ($1, $2, 5)',
            [objetoId, codeValue]
          );
          codesInserted++;
        }
      }
    }

    // 8. Crear índice único para prevenir duplicados a nivel de motor de base de datos
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_codigos_objeto_codigo_unique 
      ON codigos (objeto_id, UPPER(TRIM(codigo)));
    `);

    await client.query('COMMIT');
    console.log(`✅ ¡Consolidación, deduplicación y constraint UNIQUE completados!`);
    console.log(`🚀 ${codesInserted} códigos insertados/asegurados sin duplicados.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en el proceso:', error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
