import { Request, Response } from 'express';
import { MongooseDocument, MongooseModelType, QueryHelpers } from './mongoose';
import { SequelizeDocument, SequelizeModel } from './sequelize';

export interface ApiResponse<T = any> {
  error: any;
  success: boolean;
  message: string;
  code: number;
  data: T;
}

export interface ValidationResponse {
  success: boolean;
  messages: string[];
}

export interface ApiOptions {
  hideLogo?: boolean;
  customValidationCode?: number;
  customErrorCode?: number;
  customNotFoundCode?: number;
  mongooseOptions?: any;
  updateFieldName?: string;
}

export interface PopulationObject {
  [key: string]: any;
}

export interface ValidationObject {
  [key: string]: string | string[];
}

export interface QueryParams {
  populate?: boolean | number | string | { [key: string]: boolean };
  select?: string | { [key: string]: number | boolean };
  where?: { [key: string]: any };
  whereObject?: { [key: string]: any };
  like?: { [key: string]: any };
  paginate?: {
    limit: number;
    page: number;
  };
  sort?: { [key: string]: number | string };
}

export interface RequestWithQuery extends Request {
  query: QueryParams & { [key: string]: string | string[] };
}

export type PreRequestHook = (req: RequestWithQuery) => Promise<RequestWithQuery>;
export type PostResponseHook<T = any> = (data: T) => Promise<T>;

export { MongooseDocument, MongooseModelType, QueryHelpers } from './mongoose';
export { SequelizeDocument, SequelizeModel, SequelizeModelType } from './sequelize';

// NoSQL (Mongoose) specific types
export interface MongooseRequestHandler {
  (req: RequestWithQuery, res: Response): Promise<boolean | void>;
}

// SQL (Sequelize) specific types
export interface SequelizeRequestHandler {
  (req: RequestWithQuery, res: Response): Promise<boolean | void>;
}

export interface DataTableOptions {
  search_by_field?: boolean;
  allowDiskUse?: boolean;
}

export interface DataTableResponse<T = any> {
  message: string;
  recordsFiltered: number;
  recordsTotal: number;
  total: number;
  success: boolean;
  data: T;
}

export interface DataTableQuery {
  length?: number;
  start?: number;
  search?: {
    value: string;
  };
  columns?: Array<{
    data: string;
    search?: {
      value: string;
    };
  }>;
  order?: Array<{
    column: number;
    dir: string;
  }>;
  filter?: {
    [key: string]: any;
  };
}

export interface RequestWithDataTable extends RequestWithQuery {
  body: DataTableQuery;
}
