import { Model, ModelStatic } from 'sequelize';
import { ApiOptions } from './index';

export interface SequelizeDocument extends Model {}

export type SequelizeModel<T extends Model = Model> = ModelStatic<T>;

export interface SequelizeModelType<T extends Model> extends ModelStatic<T> {}

export interface DatatableOptions extends ApiOptions {
  search_by_field?: boolean;
  customErrorCode?: number;
}

export interface DatatableResponse<T = any> {
  message: string;
  recordsFiltered: number;
  recordsTotal: number;
  total: number;
  success: boolean;
  data: T;
}
