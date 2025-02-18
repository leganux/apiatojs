import { Document, Model, Aggregate, Query, Types, HydratedDocument } from 'mongoose';

export interface MongooseDocument extends Document {
    _id: Types.ObjectId;
    [key: string]: any;
}

export interface QueryHelpers<T> {
    exec(): Promise<T>;
    limit(n: number): this;
    skip(n: number): this;
    sort(arg: any): this;
    populate(arg: any): this;
    select(arg: any): this;
}

export interface MongooseModel<DocType extends Document> {
    dataTables(options: any): Promise<any>;
    aggregate(pipeline: any[]): Aggregate<any[]> & { allowDiskUse(value: boolean): Aggregate<any[]> };
    find(conditions: any): Query<Array<HydratedDocument<DocType>>, HydratedDocument<DocType>>;
    findOne(conditions: any): Query<HydratedDocument<DocType> | null, HydratedDocument<DocType>>;
    findById(id: any): Query<HydratedDocument<DocType> | null, HydratedDocument<DocType>>;
    findByIdAndUpdate(id: any, update: any): Promise<HydratedDocument<DocType> | null>;
    findByIdAndDelete(id: any): Promise<HydratedDocument<DocType> | null>;
    insertMany(docs: any[]): Promise<Array<HydratedDocument<DocType>>>;
}

export type MongooseModelType<DocType extends Document> = {
    new(doc: any): HydratedDocument<DocType>;
    create(doc: any): Promise<HydratedDocument<DocType>>;
    prototype: HydratedDocument<DocType>;
} & Model<DocType> & MongooseModel<DocType>;
