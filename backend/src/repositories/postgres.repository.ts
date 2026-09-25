import { ICodRepository, IModo, ISubmodo, IClase, IObjeto, ICodigo } from '../types/cod.types';
import { pgPool } from '../config/postgres';

export class PostgresCodRepository implements ICodRepository {
  async getAllModes(): Promise<IModo[]> {
    const query = `
      SELECT json_build_object(
        'id', m.id,
        'codigo', m.codigo,
        'nombre', m.nombre,
        'descripcion', m.descripcion,
        'submodos', COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', s.id,
              'nombre', s.nombre,
              'es_predeterminado', s.es_predeterminado,
              'orden', s.orden,
              'clases', COALESCE((
                SELECT json_agg(
                  json_build_object(
                    'id', c.id,
                    'nombre', c.nombre,
                    'objetos', COALESCE((
                      SELECT json_agg(
                        json_build_object(
                          'id', o.id,
                          'nombre', o.nombre,
                          'posicion', o.posicion,
                          'codigos', COALESCE((
                            SELECT json_agg(
                              json_build_object(
                                'id', cd.id,
                                'codigo', cd.codigo,
                                'calificacion', cd.calificacion
                              ) ORDER BY cd.calificacion DESC NULLS LAST, cd.id ASC
                            ) FROM codigos cd WHERE cd.objeto_id = o.id
                          ), '[]'::json)
                        ) ORDER BY (
                          SELECT COALESCE(MAX(cd.calificacion), 0) FROM codigos cd WHERE cd.objeto_id = o.id
                        ) DESC, o.nombre ASC
                      ) FROM objetos o WHERE o.clase_id = c.id
                    ), '[]'::json)
                  ) ORDER BY c.id
                ) FROM clases c WHERE c.submodo_id = s.id
              ), '[]'::json)
            ) ORDER BY s.orden, s.id
          ) FROM submodos s WHERE s.modo_id = m.id
        ), '[]'::json)
      ) AS data
      FROM modos m ORDER BY m.id;
    `;
    const res = await pgPool.query(query);
    return res.rows.map(r => r.data);
  }

  async getModeById(id: number): Promise<IModo | null> {
    const modes = await this.getAllModes();
    return modes.find(m => m.id === id) || null;
  }

  async createMode(codigo: string, nombre: string, descripcion: string): Promise<IModo> {
    const res = await pgPool.query(
      'INSERT INTO modos (codigo, nombre, descripcion) VALUES ($1, $2, $3) RETURNING id',
      [codigo, nombre, descripcion]
    );
    return {
      id: res.rows[0].id,
      codigo,
      nombre,
      descripcion,
      submodos: []
    };
  }

  async createSubmode(modoId: number, nombre: string, esPredeterminado: boolean, orden: number): Promise<ISubmodo> {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const res = await client.query(
        'INSERT INTO submodos (modo_id, nombre, es_predeterminado, orden) VALUES ($1, $2, $3, $4) RETURNING id',
        [modoId, nombre, esPredeterminado, orden]
      );
      const newId = res.rows[0].id;
      const WEAPONS_DATA: Record<string, string[]> = {
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

      for (const [className, weapons] of Object.entries(WEAPONS_DATA)) {
        const classRes = await client.query('INSERT INTO clases (submodo_id, nombre) VALUES ($1, $2) RETURNING id', [newId, className]);
        const classId = classRes.rows[0].id;
        for (let i = 0; i < weapons.length; i++) {
          await client.query('INSERT INTO objetos (clase_id, posicion, nombre) VALUES ($1, $2, $3)', [classId, i + 1, weapons[i]]);
        }
      }
      await client.query('COMMIT');
      return {
        id: newId,
        nombre,
        es_predeterminado: esPredeterminado,
        orden,
        clases: []
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async createClass(submodoId: number, nombre: string): Promise<IClase> {
    const res = await pgPool.query(
      'INSERT INTO clases (submodo_id, nombre) VALUES ($1, $2) RETURNING id',
      [submodoId, nombre]
    );
    return {
      id: res.rows[0].id,
      nombre,
      objetos: []
    };
  }

  async createObject(claseId: number, nombre: string, posicion: number): Promise<IObjeto> {
    const res = await pgPool.query(
      'INSERT INTO objetos (clase_id, nombre, posicion) VALUES ($1, $2, $3) RETURNING id',
      [claseId, nombre, posicion]
    );
    return {
      id: res.rows[0].id,
      nombre,
      posicion,
      codigos: []
    };
  }

  async createCodigo(objetoId: number, codigo: string): Promise<ICodigo> {
    const res = await pgPool.query(
      'INSERT INTO codigos (objeto_id, codigo) VALUES ($1, $2) RETURNING id',
      [objetoId, codigo]
    );
    return {
      id: res.rows[0].id,
      codigo
    };
  }

  async updateModeName(id: number, newName: string): Promise<boolean> {
    const res = await pgPool.query('UPDATE modos SET nombre = $1 WHERE id = $2', [newName, id]);
    return (res.rowCount ?? 0) > 0;
  }

  async updateSubmodeName(id: number, newName: string): Promise<boolean> {
    const res = await pgPool.query('UPDATE submodos SET nombre = $1 WHERE id = $2', [newName, id]);
    return (res.rowCount ?? 0) > 0;
  }

  async updateClassName(id: number, newName: string): Promise<boolean> {
    const res = await pgPool.query('UPDATE clases SET nombre = $1 WHERE id = $2', [newName, id]);
    return (res.rowCount ?? 0) > 0;
  }

  async updateObjectName(id: number, newName: string): Promise<boolean> {
    const res = await pgPool.query('UPDATE objetos SET nombre = $1 WHERE id = $2', [newName, id]);
    return (res.rowCount ?? 0) > 0;
  }

  async updateCodigo(id: number, newCodigo: string): Promise<boolean> {
    const res = await pgPool.query('UPDATE codigos SET codigo = $1 WHERE id = $2', [newCodigo, id]);
    return (res.rowCount ?? 0) > 0;
  }

  async updateCodigoRating(id: number, rating: number): Promise<boolean> {
    const res = await pgPool.query('UPDATE codigos SET calificacion = $1 WHERE id = $2', [rating, id]);
    return (res.rowCount ?? 0) > 0;
  }

  // Custom queries for the UI
  async getModosBasic(): Promise<{id: number, codigo: string, nombre: string}[]> {
    const res = await pgPool.query('SELECT id, codigo, nombre FROM modos ORDER BY id');
    return res.rows;
  }

  async getSubmodosByModoId(modoId: number): Promise<ISubmodo[]> {
    const res = await pgPool.query('SELECT * FROM submodos WHERE modo_id = $1 ORDER BY orden', [modoId]);
    return res.rows;
  }

  async getClasesWithCountBySubmodoId(submodoId: number): Promise<(IClase & { count: number })[]> {
    const query = `
      SELECT c.*, COUNT(o.id) as count 
      FROM clases c 
      LEFT JOIN objetos o ON o.clase_id = c.id 
      WHERE c.submodo_id = $1 
      GROUP BY c.id
      ORDER BY c.id;
    `;
    const res = await pgPool.query(query, [submodoId]);
    return res.rows;
  }

  async getSlotsByClaseId(claseId: number): Promise<Record<number, any>> {
    const query = `
      SELECT o.id AS objeto_id, o.nombre, o.posicion, 
             COALESCE(json_agg(json_build_object('id', c.id, 'codigo', c.codigo, 'calificacion', c.calificacion) ORDER BY c.calificacion DESC NULLS LAST) FILTER (WHERE c.id IS NOT NULL), '[]') AS codigos
      FROM objetos o
      LEFT JOIN codigos c ON c.objeto_id = o.id
      WHERE o.clase_id = $1
      GROUP BY o.id, o.nombre, o.posicion;
    `;
    const res = await pgPool.query(query, [claseId]);
    const slotsMap: Record<number, any> = {};
    res.rows.forEach((r: any) => {
      slotsMap[r.posicion] = { 
        id: r.objeto_id, 
        name: r.nombre, 
        codes: r.codigos 
      };
    });
    return slotsMap;
  }

  async getAllSlotsByModoId(modoId: number): Promise<any> {
    const query = `
      SELECT 
        c.nombre as clase_nombre,
        o.id as objeto_id, o.nombre as objeto_nombre, o.posicion,
        s.nombre as submodo_nombre,
        COALESCE(json_agg(
          json_build_object('id', cd.id, 'codigo', cd.codigo, 'calificacion', cd.calificacion) ORDER BY cd.calificacion DESC NULLS LAST
        ) FILTER (WHERE cd.id IS NOT NULL), '[]') AS codigos
      FROM clases c
      JOIN submodos s ON s.id = c.submodo_id
      JOIN objetos o ON o.clase_id = c.id
      LEFT JOIN codigos cd ON cd.objeto_id = o.id
      WHERE s.modo_id = $1 AND s.es_predeterminado = false
      GROUP BY c.id, c.nombre, o.id, o.nombre, o.posicion, s.nombre
      ORDER BY c.nombre, o.nombre;
    `;
    const res = await pgPool.query(query, [modoId]);
    return res.rows;
  }

  async upsertObject(claseId: number, posicion: number, nombre: string): Promise<IObjeto> {
    const query = `
      INSERT INTO objetos (clase_id, posicion, nombre)
      VALUES ($1, $2, $3)
      ON CONFLICT (clase_id, posicion) 
      DO UPDATE SET nombre = EXCLUDED.nombre
      RETURNING *;
    `;
    const res = await pgPool.query(query, [claseId, posicion, nombre]);
    return res.rows[0];
  }

  async deleteClass(id: number): Promise<boolean> {
    const res = await pgPool.query('DELETE FROM clases WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async deleteSubmode(id: number): Promise<boolean> {
    const res = await pgPool.query('DELETE FROM submodos WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async deleteMode(id: number): Promise<boolean> {
    const res = await pgPool.query('DELETE FROM modos WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async deleteObject(id: number): Promise<boolean> {
    const res = await pgPool.query('DELETE FROM objetos WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async deleteCodigo(id: number): Promise<boolean> {
    const res = await pgPool.query('DELETE FROM codigos WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async importData(data: IModo[]): Promise<boolean> {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      for (const modo of data) {
        let modoId = modo.id;
        // Check if mode exists by codigo or create
        const mRes = await client.query(
          'INSERT INTO modos (codigo, nombre, descripcion) VALUES ($1, $2, $3) ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id',
          [modo.codigo || modo.nombre.substring(0, 5).toUpperCase(), modo.nombre, modo.descripcion || '']
        );
        modoId = mRes.rows[0]?.id;

        if (modo.submodos && Array.isArray(modo.submodos)) {
          for (const sm of modo.submodos) {
            const smRes = await client.query(
              'INSERT INTO submodos (modo_id, nombre, es_predeterminado, orden) VALUES ($1, $2, $3, $4) RETURNING id',
              [modoId, sm.nombre, sm.es_predeterminado || false, sm.orden || 0]
            );
            const smId = smRes.rows[0]?.id;

            if (sm.clases && Array.isArray(sm.clases)) {
              for (const cl of sm.clases) {
                const clRes = await client.query(
                  'INSERT INTO clases (submodo_id, nombre) VALUES ($1, $2) RETURNING id',
                  [smId, cl.nombre]
                );
                const clId = clRes.rows[0]?.id;

                if (cl.objetos && Array.isArray(cl.objetos)) {
                  for (const obj of cl.objetos) {
                    const objRes = await client.query(
                      'INSERT INTO objetos (clase_id, nombre, posicion) VALUES ($1, $2, $3) RETURNING id',
                      [clId, obj.nombre, obj.posicion || 1]
                    );
                    const objId = objRes.rows[0]?.id;

                    if (obj.codigos && Array.isArray(obj.codigos)) {
                      for (const cd of obj.codigos) {
                        const codeStr = typeof cd === 'string' ? cd : cd.codigo;
                        const rating = typeof cd === 'object' && cd.calificacion ? cd.calificacion : 0;
                        if (codeStr) {
                          await client.query(
                            'INSERT INTO codigos (objeto_id, codigo, calificacion) VALUES ($1, $2, $3)',
                            [objId, codeStr, rating]
                          );
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      await client.query('COMMIT');
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Error importing data:', e);
      throw e;
    } finally {
  async createLoadout(params: {
    modoCodigo?: string;
    modoId?: number;
    categoria: string;
    armaNombre: string;
    submodoNombre: string;
    codigoArmero: string;
    calificacion?: number;
  }): Promise<any> {
    const { modoCodigo = 'MJ', modoId, categoria, armaNombre, submodoNombre, codigoArmero, calificacion = 5 } = params;
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Resolver modo_id
      let mId = modoId;
      if (!mId) {
        const mRes = await client.query(
          'SELECT id FROM modos WHERE codigo ILIKE $1 OR nombre ILIKE $1 ORDER BY id LIMIT 1',
          [`%${modoCodigo}%`]
        );
        if (mRes.rows.length > 0) {
          mId = mRes.rows[0].id;
        } else {
          const firstM = await client.query('SELECT id FROM modos ORDER BY id LIMIT 1');
          if (firstM.rows.length > 0) {
            mId = firstM.rows[0].id;
          } else {
            const newM = await client.query(
              'INSERT INTO modos (codigo, nombre, descripcion) VALUES ($1, $2, $3) RETURNING id',
              [modoCodigo, modoCodigo, '']
            );
            mId = newM.rows[0].id;
          }
        }
      }

      // 2. Resolver submodo_id
      let smId: number;
      const smClean = submodoNombre.trim();
      const smPrefix = smClean.split('/')[0].trim();
      const smRes = await client.query(
        'SELECT id FROM submodos WHERE modo_id = $1 AND (nombre ILIKE $2 OR nombre ILIKE $3) ORDER BY id LIMIT 1',
        [mId, smClean, `%${smPrefix}%`]
      );
      if (smRes.rows.length > 0) {
        smId = smRes.rows[0].id;
      } else {
        const newSm = await client.query(
          'INSERT INTO submodos (modo_id, nombre, es_predeterminado, orden) VALUES ($1, $2, false, (SELECT COALESCE(MAX(orden), 0) + 1 FROM submodos WHERE modo_id = $1)) RETURNING id',
          [mId, smClean]
        );
        smId = newSm.rows[0].id;
      }

      // 3. Resolver clase_id (Categoría de arma)
      let clId: number;
      const clClean = categoria.trim();
      const clRes = await client.query(
        'SELECT id FROM clases WHERE submodo_id = $1 AND nombre ILIKE $2 ORDER BY id LIMIT 1',
        [smId, clClean]
      );
      if (clRes.rows.length > 0) {
        clId = clRes.rows[0].id;
      } else {
        const newCl = await client.query(
          'INSERT INTO clases (submodo_id, nombre) VALUES ($1, $2) RETURNING id',
          [smId, clClean]
        );
        clId = newCl.rows[0].id;
      }

      // 4. Resolver objeto_id (Arma)
      let objId: number;
      const weaponClean = armaNombre.trim();
      const objRes = await client.query(
        'SELECT id FROM objetos WHERE clase_id = $1 AND nombre ILIKE $2 ORDER BY id LIMIT 1',
        [clId, weaponClean]
      );
      if (objRes.rows.length > 0) {
        objId = objRes.rows[0].id;
      } else {
        const posRes = await client.query(
          'SELECT COALESCE(MAX(posicion), 0) + 1 AS next_pos FROM objetos WHERE clase_id = $1',
          [clId]
        );
        const nextPos = posRes.rows[0]?.next_pos || 1;
        const newObj = await client.query(
          'INSERT INTO objetos (clase_id, nombre, posicion) VALUES ($1, $2, $3) RETURNING id',
          [clId, weaponClean, nextPos]
        );
        objId = newObj.rows[0].id;
      }

      // 5. Insertar código
      const codeClean = codigoArmero.trim();
      const ratingNum = Math.min(5, Math.max(1, Number(calificacion) || 5));
      const codeRes = await client.query(
        'INSERT INTO codigos (objeto_id, codigo, calificacion) VALUES ($1, $2, $3) RETURNING id, codigo, calificacion',
        [objId, codeClean, ratingNum]
      );
      const newCode = codeRes.rows[0];

      await client.query('COMMIT');

      return {
        success: true,
        modoId: mId,
        submodoId: smId,
        claseId: clId,
        objetoId: objId,
        codigoId: newCode.id,
        codigo: newCode.codigo,
        calificacion: newCode.calificacion,
        armaNombre: weaponClean,
        categoria: clClean,
        submodoNombre: smClean
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}


