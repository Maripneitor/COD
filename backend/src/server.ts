import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { getRepository } from './repositories';
import { ICodRepository } from './types/cod.types';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

let repo: ICodRepository;

// Inicialización de la base de datos y arranque del servidor
getRepository().then(repositoryInstance => {
  repo = repositoryInstance;

  // GET: Obtener todos los modos y jerarquía completa
  app.get('/api/modes', async (_req: Request, res: Response) => {
    try {
      const data = await repo.getAllModes();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST: Crear Modo
  app.post('/api/modes', async (req: Request, res: Response) => {
    try {
      const { codigo, nombre, descripcion } = req.body;
      const newMode = await repo.createMode(codigo, nombre, descripcion);
      res.json(newMode);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST: Crear Submodo
  app.post('/api/modes/:modeId/submodos', async (req: Request, res: Response) => {
    try {
      const { modeId } = req.params;
      const { nombre, es_predeterminado, orden } = req.body;
      const newSubmode = await repo.createSubmode(Number(modeId), nombre, es_predeterminado || false, orden || 0);
      res.json(newSubmode);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST: Crear Clase
  app.post('/api/submodos/:submodoId/clases', async (req: Request, res: Response) => {
    try {
      const { submodoId } = req.params;
      const { nombre } = req.body;
      const newClass = await repo.createClass(Number(submodoId), nombre);
      res.json(newClass);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST: Crear Objeto
  app.post('/api/clases/:claseId/objetos', async (req: Request, res: Response) => {
    try {
      const { claseId } = req.params;
      const { nombre, posicion } = req.body;
      const newObject = await repo.createObject(Number(claseId), nombre, posicion);
      res.json(newObject);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST: Crear Codigo
  app.post('/api/objetos/:objetoId/codigos', async (req: Request, res: Response) => {
    try {
      const { objetoId } = req.params;
      const { codigo } = req.body;
      const newCodigo = await repo.createCodigo(Number(objetoId), codigo);
      res.json(newCodigo);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH: Editar nombre de un modo
  app.patch('/api/modes/:modeId', async (req: Request, res: Response) => {
    try {
      const { modeId } = req.params;
      const { nombre } = req.body;
      const updated = await repo.updateModeName(Number(modeId), nombre);
      res.json({ success: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH: Editar nombre de un submodo
  app.patch('/api/submodos/:submodoId', async (req: Request, res: Response) => {
    try {
      const { submodoId } = req.params;
      const { nombre } = req.body;
      const updated = await repo.updateSubmodeName(Number(submodoId), nombre);
      res.json({ success: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH: Editar nombre de una clase
  app.patch('/api/clases/:claseId', async (req: Request, res: Response) => {
    try {
      const { claseId } = req.params;
      const { nombre } = req.body;
      const updated = await repo.updateClassName(Number(claseId), nombre);
      res.json({ success: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH: Editar nombre de un objeto
  app.patch('/api/objetos/:objetoId', async (req: Request, res: Response) => {
    try {
      const { objetoId } = req.params;
      const { nombre } = req.body;
      const updated = await repo.updateObjectName(Number(objetoId), nombre);
      res.json({ success: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH: Editar un código
  app.patch('/api/codigos/:codigoId', async (req: Request, res: Response) => {
    try {
      const { codigoId } = req.params;
      const { codigo } = req.body;
      const updated = await repo.updateCodigo(Number(codigoId), codigo);
      res.json({ success: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH: Editar rating de un código
  app.patch('/api/codigos/:codigoId/rating', async (req: Request, res: Response) => {
    try {
      const { codigoId } = req.params;
      const { calificacion } = req.body;
      const updated = await repo.updateCodigoRating(Number(codigoId), Number(calificacion));
      res.json({ success: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- RUTAS PERSONALIZADAS PARA LA UI DEL DASHBOARD ---

  // GET: Obtener TODOS los slots de todos los submodos dentro de un modo
  app.get('/api/modos/:modoId/all-slots', async (req: Request, res: Response) => {
    try {
      const { modoId } = req.params;
      const data = await repo.getAllSlotsByModoId(Number(modoId));
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET: Obtener los modos
  app.get('/api/modos', async (_req: Request, res: Response) => {
    try {
      const data = await repo.getModosBasic();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET: Obtener submodos de un modo
  app.get('/api/modos/:modoId/submodos', async (req: Request, res: Response) => {
    try {
      const { modoId } = req.params;
      const data = await repo.getSubmodosByModoId(Number(modoId));
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET: Obtener clases de un submodo con conteo
  app.get('/api/submodos/:submodoId/clases', async (req: Request, res: Response) => {
    try {
      const { submodoId } = req.params;
      const data = await repo.getClasesWithCountBySubmodoId(Number(submodoId));
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET: Obtener slots de una clase (mapa de posicion 1-7 a objeto)
  app.get('/api/clases/:claseId/slots', async (req: Request, res: Response) => {
    try {
      const { claseId } = req.params;
      const data = await repo.getSlotsByClaseId(Number(claseId));
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST: Crear o actualizar objeto en un slot (upsert)
  app.post('/api/objetos', async (req: Request, res: Response) => {
    try {
      const { clase_id, posicion, nombre } = req.body;
      const data = await repo.upsertObject(Number(clase_id), Number(posicion), nombre);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE: Eliminar objeto
  app.delete('/api/objetos/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await repo.deleteObject(Number(id));
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST: Registrar nueva arma / armero / loadout completo con jerarquía y calificación
  const handleCreateLoadout = async (req: Request, res: Response) => {
    try {
      const {
        modoCodigo,
        modo_codigo,
        modo,
        modoId,
        modo_id,
        categoria,
        category,
        clase,
        claseNombre,
        armaNombre,
        arma_nombre,
        arma,
        weapon,
        weaponName,
        submodoNombre,
        submodo_nombre,
        submodo,
        codigoArmero,
        codigo_armero,
        codigo,
        code,
        calificacion,
        rating,
        stars
      } = req.body;

      const finalModoCodigo = modoCodigo || modo_codigo || (typeof modo === 'string' ? modo : 'MJ');
      const finalModoId = modoId || modo_id;
      const finalCategoria = categoria || category || clase || claseNombre || 'Fusiles de Asalto';
      const finalArmaNombre = armaNombre || arma_nombre || arma || weapon || weaponName;
      const finalSubmodoNombre = submodoNombre || submodo_nombre || submodo || 'Primera Línea / Duelo por Equipos';
      const finalCodigoArmero = codigoArmero || codigo_armero || codigo || code;
      const finalCalificacion = calificacion !== undefined ? Number(calificacion) : (rating !== undefined ? Number(rating) : (stars !== undefined ? Number(stars) : 5));

      if (!finalArmaNombre || !finalCodigoArmero) {
        return res.status(400).json({ error: 'El nombre del arma y el código de armero son obligatorios.' });
      }

      if (repo.createLoadout) {
        const result = await repo.createLoadout({
          modoCodigo: finalModoCodigo,
          modoId: finalModoId,
          categoria: finalCategoria,
          armaNombre: finalArmaNombre,
          submodoNombre: finalSubmodoNombre,
          codigoArmero: finalCodigoArmero,
          calificacion: finalCalificacion
        });
        return res.status(201).json(result);
      }

      res.status(501).json({ error: 'createLoadout no implementado para este repositorio' });
    } catch (err: any) {
      console.error('Error creating loadout:', err);
      res.status(500).json({ error: err.message });
    }
  };

  app.post('/api/loadouts', handleCreateLoadout);
  app.post('/api/weapons', handleCreateLoadout);

  // POST: Asignar codigo a un objeto existente (usa createCodigo ya existente, solo que el endpoint es diferente)
  app.post('/api/codigos', async (req: Request, res: Response) => {
    try {
      const { objeto_id, codigo } = req.body;
      const data = await repo.createCodigo(Number(objeto_id), codigo);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE: Eliminar codigo
  app.delete('/api/codigos/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await repo.deleteCodigo(Number(id));
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE: Eliminar modo
  app.delete('/api/modes/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = repo.deleteMode ? await repo.deleteMode(Number(id)) : false;
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE: Eliminar submodo
  app.delete('/api/submodos/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = repo.deleteSubmode ? await repo.deleteSubmode(Number(id)) : false;
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE: Eliminar clase
  app.delete('/api/clases/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = repo.deleteClass ? await repo.deleteClass(Number(id)) : false;
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST: Importar datos JSON
  app.post('/api/import', async (req: Request, res: Response) => {
    try {
      const data = req.body;
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: 'Data must be an array of modes' });
      }
      if (repo.importData) {
        await repo.importData(data);
        res.json({ success: true, message: 'Datos importados exitosamente' });
      } else {
        res.status(501).json({ error: 'Import no implementado para este repositorio' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET: Exportar datos JSON completos
  app.get('/api/export', async (_req: Request, res: Response) => {
    try {
      const data = await repo.getAllModes();
      res.json({
        exportDate: new Date().toISOString(),
        version: '2.0-nexus',
        data
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor COD-Classes corriendo en http://localhost:${PORT} y en la red local`);
  });
}).catch(err => {
    console.error("Failed to start server", err);
    process.exit(1);
});

