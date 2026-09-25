import { pgPool } from './src/config/postgres';

const WEAPONS_DATA = {
  "Fusiles de Asalto": [
    "M4", "AK-47", "M16", "AK117", "Type 25", "LK24", "BK57", "ASM10", "ICR-1", 
    "HBRa3", "HVK-30", "DR-H", "Peacekeeper MK2", "FR .556", "AS VAL", "CR-56 AMAX", 
    "M13", "Swordfish", "Kilo 141", "Oden", "Krig 6", "EM2", "Maddox", "Grau 5.56", 
    "Groza", "Type 19", "BP50", "LAG 53", "XM4"
  ],
  "Subfusiles": [
    "RUS-79U", "Chicom", "PDW-57", "MSMC", "HG 40", "Pharo", "GKS", "Cordite", 
    "QQ9", "Fennec", "AGR 556", "QXR", "PP19 Bizon", "MX9", "CBR4", "PPSh-41", 
    "KSP 45", "Switchblade X9", "LAPA", "OTS 9", "Striker 45", "CX-9", "TEC-9", 
    "ISO", "USS 9"
  ],
  "Fusiles de Precisión": [
    "DL Q33", "Arctic .50", "M21 EBR", "XPR-50", "Locus", "NA-45", "Outlaw", 
    "Rytec AMR", "SVD", "Koshka", "ZRG 20mm", "HDR", "LW3-Tundra"
  ],
  "Ametralladoras Ligeras": [
    "RPD", "M4LMG", "UL736", "S36", "Chopper", "Holger 26", "Hades", "Dingo", 
    "PKM", "Bruen Mk9", "MG42", "RAAL MG"
  ],
  "Escopetas": [
    "BY15", "HS0405", "HS2126", "Striker", "KRM-262", "Echo", "JAK-12", "R9-0", "Argus"
  ],
  "Fusiles de Tirador": [
    "Kilo con cerrojo", "SKS", "SP-R 208", "MK2", "Type 63"
  ],
  "Pistolas": [
    "MW11", "J358", ".50 GS", "Renetti", "Shorty", "Cuchillo balístico", "Dobvra", "Machine Pistol"
  ],
  "Lanzadores": [
    "SMRS", "FHJ-18", "Thumper", "D13 Sector"
  ],
  "Cuerpo a Cuerpo": [
    "Cuchillo", "Cuchillo táctico", "Hacha", "Pala", "Bate de béisbol", "Katana", 
    "Nunchakus", "Hoz", "Guantes de boxeo", "Machete", "Cuchillo mariposa", 
    "Palos de kali", "Púa de hielo", "Sai", "Garrote", "Guadaña", "Lanza", 
    "Mangual", "Llave inglesa"
  ]
};

async function seed() {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    
    // Ensure the unique constraint exists for upsert
    await client.query('ALTER TABLE objetos DROP CONSTRAINT IF EXISTS objetos_clase_posicion_key');
    await client.query('ALTER TABLE objetos ADD CONSTRAINT objetos_clase_posicion_key UNIQUE (clase_id, posicion)');
    await client.query('ALTER TABLE objetos DROP CONSTRAINT IF EXISTS check_posicion');
    
    // Get all submodes that are not default
    const submodosRes = await client.query('SELECT id FROM submodos WHERE es_predeterminado = false');
    const submodos = submodosRes.rows;

    for (const sm of submodos) {
      // For each submode, ensure classes and weapons exist
      for (const [className, weapons] of Object.entries(WEAPONS_DATA)) {
        // Create or get class
        let classId;
        const classRes = await client.query('SELECT id FROM clases WHERE submodo_id = $1 AND nombre = $2', [sm.id, className]);
        if (classRes.rows.length > 0) {
          classId = classRes.rows[0].id;
        } else {
          const insertClass = await client.query('INSERT INTO clases (submodo_id, nombre) VALUES ($1, $2) RETURNING id', [sm.id, className]);
          classId = insertClass.rows[0].id;
        }

        // Insert weapons
        for (let i = 0; i < weapons.length; i++) {
          const weaponName = weapons[i];
          const position = i + 1;
          await client.query(
            `INSERT INTO objetos (clase_id, posicion, nombre) VALUES ($1, $2, $3)
             ON CONFLICT (clase_id, posicion) DO UPDATE SET nombre = EXCLUDED.nombre`,
            [classId, position, weaponName]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('Successfully seeded weapons data into existing submodes');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed error:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
