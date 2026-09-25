export interface ICodigo {
  id: number;
  codigo: string;
}

export interface IObjeto {
  id: number;
  nombre: string;
  posicion: number;
  codigos: ICodigo[];
}

export interface IClase {
  id: number;
  nombre: string;
  objetos: IObjeto[];
}

export interface ISubmodo {
  id: number;
  nombre: string;
  es_predeterminado: boolean;
  orden: number;
  clases: IClase[];
}

export interface IModo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  submodos: ISubmodo[];
}

export interface ICodRepository {
  getAllModes(): Promise<IModo[]>;
  getModeById(id: number): Promise<IModo | null>;
  createMode(codigo: string, nombre: string, descripcion: string): Promise<IModo>;
  createSubmode(modoId: number, nombre: string, esPredeterminado: boolean, orden: number): Promise<ISubmodo>;
  createClass(submodoId: number, nombre: string): Promise<IClase>;
  createObject(claseId: number, nombre: string, posicion: number): Promise<IObjeto>;
  createCodigo(objetoId: number, codigo: string): Promise<ICodigo>;
  updateModeName(id: number, newName: string): Promise<boolean>;
  updateSubmodeName(id: number, newName: string): Promise<boolean>;
  updateClassName(id: number, newName: string): Promise<boolean>;
  updateObjectName(id: number, newName: string): Promise<boolean>;
  updateCodigo(id: number, newCodigo: string): Promise<boolean>;
  updateCodigoRating(id: number, rating: number): Promise<boolean>;
  
  // Custom queries for the UI
  getModosBasic(): Promise<{id: number, codigo: string, nombre: string}[]>;
  getSubmodosByModoId(modoId: number): Promise<ISubmodo[]>;
  getClasesWithCountBySubmodoId(submodoId: number): Promise<(IClase & { count: number })[]>;
  getSlotsByClaseId(claseId: number): Promise<Record<number, any>>;
  getAllSlotsByModoId(modoId: number): Promise<any>;
  upsertObject(claseId: number, posicion: number, nombre: string): Promise<IObjeto>;
  deleteObject(id: number): Promise<boolean>;
  deleteCodigo(id: number): Promise<boolean>;
}
