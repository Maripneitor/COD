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
                                'codigo', cd.codigo
                              )
                            ) FROM codigos cd WHERE cd.objeto_id = o.id
                          ), '[]'::json)
                        )
                      ) FROM objetos o WHERE o.clase_id = c.id
                    ), '[]'::json)
                  )
                ) FROM clases c WHERE c.submodo_id = s.id
              ), '[]'::json)
            )
          ) FROM submodos s WHERE s.modo_id = m.id
        ), '[]'::json)
      ) AS data
      FROM modos m;
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

  async deleteObject(id: number): Promise<boolean> {
    const res = await pgPool.query('DELETE FROM objetos WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async deleteCodigo(id: number): Promise<boolean> {
    const res = await pgPool.query('DELETE FROM codigos WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}

