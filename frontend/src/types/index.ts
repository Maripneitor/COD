export interface ICodigo {
  id: number;
  codigo: string;
  calificacion?: number;
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
  submodo_id?: number;
  objetos: IObjeto[];
  count?: number;
}

export interface ISubmodo {
  id: number;
  modo_id?: number;
  nombre: string;
  es_predeterminado: boolean;
  orden: number;
  clases: IClase[];
}

export interface IModo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  submodos: ISubmodo[];
}

export type ActiveView = 'dashboard' | 'tree' | 'global';

export interface ToastNotification {
  show: boolean;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export interface SearchResultItem {
  type: 'mode' | 'submode' | 'class' | 'weapon' | 'code';
  title: string;
  subtitle: string;
  badge?: string;
  modeId: number;
  submodeId?: number;
  classId?: number;
  weaponId?: number;
  codeString?: string;
}
