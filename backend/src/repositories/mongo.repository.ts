// @ts-nocheck
import { ICodRepository } from '../types/cod.types';
import { ModeModel } from '../config/mongo';

export class MongoCodRepository implements ICodRepository {
  async getAllModes(): Promise<IMode[]> {
    const docs = await ModeModel.find().lean();
    return docs.map(doc => ({
      mode_id: doc.mode_id,
      name: doc.name,
      is_default: doc.is_default,
      classes: doc.classes as any
    }));
  }

  async getModeById(modeId: string): Promise<IMode | null> {
    const doc = await ModeModel.findOne({ mode_id: modeId }).lean();
    if (!doc) return null;
    return {
      mode_id: doc.mode_id,
      name: doc.name,
      is_default: doc.is_default,
      classes: doc.classes as any
    };
  }

  async createMode(name: string): Promise<IMode> {
    const modeId = 'mode_' + Date.now().toString(36);
    const newMode = {
      mode_id: modeId,
      name,
      is_default: false,
      classes: []
    };
    await ModeModel.create(newMode);
    return newMode;
  }

  async createClass(modeId: string, name: string): Promise<IClass | null> {
    const classId = 'class_' + Date.now().toString(36);
    const newClass: IClass = {
      class_id: classId,
      name,
      sort_order: 0,
      objects: []
    };
    const res = await ModeModel.updateOne(
      { mode_id: modeId },
      { $push: { classes: newClass } }
    );
    if (res.modifiedCount === 0) return null;
    return newClass;
  }

  async createObject(classId: string, name: string): Promise<IClassObject | null> {
    const objectId = 'obj_' + Date.now().toString(36);
    const newObject: IClassObject = {
      object_id: objectId,
      name,
      codes: []
    };
    const res = await ModeModel.updateOne(
      { "classes.class_id": classId },
      { $push: { "classes.$.objects": newObject } }
    );
    if (res.modifiedCount === 0) return null;
    return newObject;
  }

  async updateModeName(modeId: string, newName: string): Promise<boolean> {
    const res = await ModeModel.updateOne(
      { mode_id: modeId },
      { $set: { name: newName } }
    );
    return res.modifiedCount > 0;
  }

  async updateClassName(classId: string, newName: string): Promise<boolean> {
    const res = await ModeModel.updateOne(
      { "classes.class_id": classId },
      { $set: { "classes.$.name": newName } }
    );
    return res.modifiedCount > 0;
  }

  async updateObjectName(objectId: string, newName: string): Promise<boolean> {
    const res = await ModeModel.updateOne(
      { "classes.objects.object_id": objectId },
      { $set: { "classes.$[].objects.$[obj].name": newName } },
      { arrayFilters: [{ "obj.object_id": objectId }] }
    );
    return res.modifiedCount > 0;
  }

  async upsertCode(objectId: string, slot: number, codeName: string, alphanumericVal: string): Promise<ICode> {
    const fullCode = `${codeName}-${alphanumericVal}`;
    const newCodeItem: ICode = {
      slot,
      code_name: codeName,
      alphanumeric_val: alphanumericVal,
      full_code: fullCode
    };

    // 1. Quitar el código previo en ese slot si existe
    await ModeModel.updateOne(
      { "classes.objects.object_id": objectId },
      { $pull: { "classes.$[].objects.$[obj].codes": { slot } } },
      { arrayFilters: [{ "obj.object_id": objectId }] }
    );

    // 2. Insertar el nuevo valor en el slot
    await ModeModel.updateOne(
      { "classes.objects.object_id": objectId },
      { $push: { "classes.$[].objects.$[obj].codes": newCodeItem } },
      { arrayFilters: [{ "obj.object_id": objectId }] }
    );

    return newCodeItem;
  }

  // --- STUBS PARA CUMPLIR CON ICodRepository (IMPLEMENTADO EN POSTGRES) ---
  async getModosBasic(): Promise<any> { throw new Error('Not implemented for Mongo'); }
  async getSubmodosByModoId(modoId: number): Promise<any> { throw new Error('Not implemented for Mongo'); }
  async getClasesWithCountBySubmodoId(submodoId: number): Promise<any> { throw new Error('Not implemented for Mongo'); }
  async getSlotsByClaseId(claseId: number): Promise<any> { throw new Error('Not implemented for Mongo'); }
  async upsertObject(claseId: number, posicion: number, nombre: string): Promise<any> { throw new Error('Not implemented for Mongo'); }
  async deleteObject(id: number): Promise<any> { throw new Error('Not implemented for Mongo'); }
  async deleteCodigo(id: number): Promise<any> { throw new Error('Not implemented for Mongo'); }
}
