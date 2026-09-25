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

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor COD-Classes corriendo en http://localhost:${PORT}`);
  });
}).catch(err => {
    console.error("Failed to start server", err);
    process.exit(1);
});

