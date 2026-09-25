import { pgPool } from './src/config/postgres';

interface MJEntry {
  clase: string;
  arma: string;
  codigo: string;
}

const MJ_DATASET: MJEntry[] = [
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'S0-14-1C2D4A5H8B' },
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
  { clase: 'Fusiles de Tirador', arma: 'Type 63', codigo: 'Type 63-1B2B4A8B9F' },
  { clase: 'Fusiles de Asalto', arma: 'FFAR 1', codigo: 'FFAR 1-1B2F7B8E9E' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B' },
  { clase: 'Subfusiles', arma: 'USS 9', codigo: 'USS 9-1C2D4A6C8B' },
  { clase: 'Ametralladoras Ligeras', arma: 'DP27', codigo: 'DP27-1D2B3A4D7D' },
  { clase: 'Fusiles de Asalto', arma: 'Type 19', codigo: 'Type 19-2B4A7B8B9B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1G2C3B4E6E' },
  { clase: 'Subfusiles', arma: 'CBR4', codigo: 'CBR4-1A2B4A5E9A' },
  { clase: 'Subfusiles', arma: 'USS 9', codigo: 'USS 9-1C2D4A6C8B' },
  { clase: 'Ametralladoras Ligeras', arma: 'Chopper', codigo: 'Chopper-1C2C5A6C7G' },
  { clase: 'Subfusiles', arma: 'USS 9', codigo: 'USS 9-1C2D4A6C8B' },
  { clase: 'Fusiles de Asalto', arma: 'BAL-27', codigo: 'BAL-27-1I2C3P7R8A' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5D8B' },
  { clase: 'Subfusiles', arma: 'VMP', codigo: 'VMP-2D4C5H8A9C' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5D8B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5D8B' },
  { clase: 'Fusiles de Asalto', arma: 'Lachmann-556', codigo: 'Lachmann-556-1B3B5B7A8B' },
  { clase: 'Fusiles de Precisión', arma: 'Koshka', codigo: 'Koshka-2A4A5G6A9C' },
  { clase: 'Fusiles de Precisión', arma: 'LW3-Tundra', codigo: 'LW3-Tundra-1A2A5A8A9E' },
  { clase: 'Fusiles de Precisión', arma: 'Locus', codigo: 'Locus-1B2A4B8C9C' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5D8B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4B6B8B' },
  { clase: 'Subfusiles', arma: 'LC10', codigo: 'LC10-1C2F4D6C8F' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1I2A4A5D9A' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4E6C7N' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D3E4A8B' },
  { clase: 'Fusiles de Precisión', arma: 'LW3-Tundra', codigo: 'LW3-Tundra-1C2B4D8A9E' },
  { clase: 'Fusiles de Precisión', arma: 'Locus', codigo: 'Locus-1B2A4B8C9C' },
  { clase: 'Fusiles de Asalto', arma: 'XM4', codigo: 'XM4-1A2G4E7C8A' },
  { clase: 'Fusiles de Precisión', arma: 'Locus', codigo: 'Locus-1B2A4B8C9C' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D3E4A8B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A9A' },
  { clase: 'Fusiles de Asalto', arma: 'FR .556', codigo: 'FR .556-1C2C4A5A8A' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1D2A4A5H8B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5D8B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4B6B8B' },
  { clase: 'Subfusiles', arma: 'LC10', codigo: 'LC10-1C2F4D6C8F' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1I2A4A5D9A' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4E6C7N' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B' },
  { clase: 'Fusiles de Tirador', arma: 'SO-14', codigo: 'SO-14-1C2D4A5A8B' },
];

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
    console.log('⚡ Iniciando consolidación de Submodos y Seeding en NexusCOD...');
    await client.query('BEGIN');

    // 1. Asegurar constraints flexibles
    await client.query('ALTER TABLE codigos DROP CONSTRAINT IF EXISTS check_codigo_formato');
    await client.query('ALTER TABLE objetos DROP CONSTRAINT IF EXISTS check_posicion');
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

    const primarySubmodeId = submodeMap['Primera Línea / Duelo por Equipos'];

    // 4. Migrar armas de submodos obsoletos hacia "Primera Línea / Duelo por Equipos" y eliminar submodos viejos
    const obsoleteSubmodesRes = await client.query(
      `SELECT id, nombre FROM submodos WHERE id NOT IN ($1, $2, $3)`,
      [
        submodeMap['Primera Línea / Duelo por Equipos'],
        submodeMap['Punto Caliente y Dominio'],
        submodeMap['Buscar y Destruir / Control']
      ]
    );

    for (const oldSm of obsoleteSubmodesRes.rows) {
      // Eliminar submodo obsoleto (cascade eliminará clases huérfanas una vez reubicados los datos)
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

        // Sembrar armas
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

    // 6. Insertar todo el dataset de Códigos de Armero en "Primera Línea / Duelo por Equipos" y en los otros 2 submodos
    console.log(`📦 Insertando dataset de códigos en los 3 submodos consolidados...`);
    let codesInserted = 0;

    for (const [submodeName, subId] of Object.entries(submodeMap)) {
      for (const item of MJ_DATASET) {
        const className = item.clase.trim();
        const weaponName = item.arma.trim() === 'SO14' ? 'SO-14' : item.arma.trim();
        const codeValue = item.codigo.trim().toUpperCase();

        // Obtener clase
        const clRes = await client.query(
          'SELECT id FROM clases WHERE submodo_id = $1 AND nombre = $2',
          [subId, className]
        );
        if (clRes.rows.length === 0) continue;
        const classId = clRes.rows[0].id;

        // Obtener arma
        let objetoId: number;
        const objRes = await client.query(
          'SELECT id FROM objetos WHERE clase_id = $1 AND nombre = $2',
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
          'SELECT id FROM codigos WHERE objeto_id = $1 AND codigo = $2',
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

    await client.query('COMMIT');
    console.log(`✅ ¡Consolidación y Seeding completados exitosamente!`);
    console.log(`🎮 Submodos oficiales activos:`);
    console.log(`  1. Primera Línea / Duelo por Equipos`);
    console.log(`  2. Punto Caliente y Dominio`);
    console.log(`  3. Buscar y Destruir / Control`);
    console.log(`🚀 ${codesInserted} códigos de armero insertados en los submodos.`);
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
