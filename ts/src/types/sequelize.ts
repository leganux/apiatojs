import { Model, ModelStatic, FindOptions, CreateOptions, UpdateOptions, DestroyOptions } from 'sequelize';

export interface SequelizeDocument extends Model {
    [key: string]: any;
}

export interface SequelizeModel<T extends SequelizeDocument> {
    findByPk(id: any, options?: FindOptions): Promise<T | null>;
    findAll(options?: FindOptions): Promise<T[]>;
    findOne(options?: FindOptions): Promise<T | null>;
    bulkCreate(records: any[], options?: CreateOptions): Promise<T[]>;
    update(values: any, options?: UpdateOptions): Promise<[number, T[]]>;
    destroy(options?: DestroyOptions): Promise<number>;
}

export type SequelizeModelType<T extends SequelizeDocument> = ModelStatic<T>;
