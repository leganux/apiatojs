import moment from 'moment';
import mongoose from 'mongoose';
import validator from '../utils/validator';
import {
    ApiOptions,
    ApiResponse,
    MongooseModelType,
    MongooseRequestHandler,
    PopulationObject,
    PreRequestHook,
    PostResponseHook,
    RequestWithQuery,
    ValidationObject,
    MongooseDocument
} from '../types';

const ObjectId = mongoose.Types.ObjectId;

/**
 * This function helps to create and return population in mongoose
 */
const populateConstructor = (
    query: any,
    populate: any,
    populationObject: PopulationObject
): any => {
    if (populate && populationObject) {
        if ((typeof populate === 'boolean' || typeof populate === 'number' || typeof populate === 'string') &&
            (Boolean(populate) === true || populate === 1)) {
            for (const [key, value] of Object.entries(populationObject)) {
                query.populate({
                    path: key,
                    model: value
                });
            }
        }
        if (typeof populate === 'object') {
            for (const [key, value] of Object.entries(populate)) {
                if (value && populationObject[key]) {
                    query.populate({
                        path: key,
                        model: populationObject[key]
                    });
                }
            }
        }
    }
    return query;
};

/**
 * This function helps to create and return select fields in mongoose
 */
const selectConstructor = (query: any, select: any): void => {
    if (select) {
        let ob: { [key: string]: number } = {};
        if (typeof select === 'string') {
            select.split(',').forEach(item => {
                ob[item] = 1;
            });
        } else if (typeof select === 'object') {
            for (const [key, val] of Object.entries(select)) {
                ob[key] = Number(val);
            }
        }
        query.select(ob);
    }
};

const whereConstructor = (where: any): any => {
    if (where) {
        for (const [key, val] of Object.entries(where)) {
            if (!isNaN(Number(val))) {
                where[key] = Number(val);
                continue;
            }
            if (typeof val === 'boolean' || val === 'true' || val === 'false') {
                where[key] = Boolean(val);
                continue;
            }
        }
    }
    return where;
};

export class Apiato {
    constructor(options?: ApiOptions) {
        if (!options?.hideLogo) {
            console.log(`
     __   ____  __   __  ____  __       __  ____ 
 / _\\ (  _ \\(  ) / _\\(_  _)/  \\    _(  )/ ___)
/    \\ ) __/ )( /    \\ )( (  O )_ / \\) \\\\___ \\
\\_/\\_/(__)  (__)\\_/\\_/(__) \\__/(_)\\____/(____/
                        (c) leganux.net 2021-2025  v3.1.1
`);
        }
    }

    /**
     * This function helps to create a new element in model
     */
    createOne<T extends MongooseDocument>(
        model: MongooseModelType<T>,
        validationObject: ValidationObject,
        populationObject: PopulationObject,
        options?: ApiOptions,
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<T>
    ): MongooseRequestHandler {
        return async (req, res) => {
            const response: ApiResponse = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };

            try {
                if (fIn && typeof fIn === 'function') {
                    req = await fIn(req);
                }

                const { body } = req;
                const { populate, select } = req.query;

                const validation = validator.validateObject(body, validationObject, true);

                if (!validation.success) {
                    response.error = validation.messages;
                    response.success = false;
                    response.message = validation.messages.join(', ');
                    response.code = options?.customValidationCode || 435;
                    response.data = {};
                    res.status(response.code).json(response);
                    return false;
                }

                let newElement = new (model as any)(body);
                newElement = await newElement.save();
                const query = model.findById(newElement._id);
                populateConstructor(query, populate, populationObject);
                selectConstructor(query, select);
                newElement = await query.exec();

                if (fOut && typeof fOut === 'function') {
                    newElement = await fOut(newElement);
                }

                response.error = {};
                response.success = true;
                response.message = 'ok';
                response.code = 200;
                response.data = newElement;
                res.status(200).json(response);

            } catch (e) {
                response.error = e;
                response.success = false;
                response.message = e as string;
                response.code = options?.customErrorCode || 500;
                response.data = {};
                res.status(response.code).json(response);
                throw e;
            }
        };
    }

    /**
     * This function helps to create many elements in model
     */
    createMany<T extends MongooseDocument>(
        model: MongooseModelType<T>,
        validationObject: ValidationObject,
        populationObject: PopulationObject,
        options?: ApiOptions,
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<T[]>
    ): MongooseRequestHandler {
        return async (req, res) => {
            const response: ApiResponse = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };

            try {
                if (fIn && typeof fIn === 'function') {
                    req = await fIn(req);
                }

                let { body } = req;
                const { populate, select } = req.query;

                if (body && typeof body === 'object' && !Array.isArray(body)) {
                    const arr = [];
                    console.info('An object was received instead of an array, trying to make the conversion');
                    for (const [key, value] of Object.entries(body)) {
                        (value as any)._key_ = key;
                        arr.push(value);
                    }
                    body = arr;
                    console.info('A generated array is', body);
                }

                const validationErrors = [];
                const correct = [];

                for (const item of body) {
                    const validation = validator.validateObject(item, validationObject, true);
                    if (validation.success) {
                        correct.push(item);
                    } else {
                        validationErrors.push({
                            error: item,
                            detail: validation.messages
                        });
                    }
                }

                let newElements = await model.insertMany(correct);
                const elementIds = newElements.map(item => item._id);

                const query = model.find({ _id: { $in: elementIds } });
                populateConstructor(query, populate, populationObject);
                selectConstructor(query, select);
                newElements = await query.exec();

                if (fOut && typeof fOut === 'function') {
                    newElements = await fOut(newElements);
                }

                response.error = validationErrors;
                response.success = true;
                response.message = 'ok';
                response.code = 200;
                response.data = newElements;
                res.status(200).json(response);

            } catch (e) {
                response.error = e;
                response.success = false;
                response.message = e as string;
                response.code = options?.customErrorCode || 500;
                response.data = {};
                res.status(response.code).json(response);
                throw e;
            }
        };
    }

    /**
     * This function helps to get many elements from collection
     */
    getMany<T extends MongooseDocument>(
        model: MongooseModelType<T>,
        populationObject: PopulationObject,
        options?: ApiOptions,
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<T[]>
    ): MongooseRequestHandler {
        return async (req, res) => {
            const response: ApiResponse = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };

            try {
                if (fIn && typeof fIn === 'function') {
                    req = await fIn(req);
                }

                const { where, whereObject, like, select, paginate, sort, populate } = req.query;

                const processedWhere = whereConstructor(where);
                const processedLike = whereConstructor(like);

                const find: any = {};
                if (processedLike) {
                    for (const [key, val] of Object.entries(processedLike)) {
                        find[key] = { $regex: String(val).trim(), $options: 'i' };
                    }
                }
                if (processedWhere) {
                    for (const [key, val] of Object.entries(processedWhere)) {
                        find[key] = val;
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        find[key] = new ObjectId(String(val));
                    }
                }

                const query = model.find(find);

                populateConstructor(query, populate, populationObject);
                selectConstructor(query, select);

                if (paginate && paginate.limit && paginate.page) {
                    const limit = Number(paginate.limit);
                    const page = Number(paginate.page);
                    query.limit(limit).skip(page * limit);
                }

                if (sort) {
                    const order: any = {};
                    for (const [key, val] of Object.entries(sort)) {
                        order[key] = val;
                    }
                    query.sort(order);
                }

                let elements = await query.exec();

                if (fOut && typeof fOut === 'function') {
                    elements = await fOut(elements);
                }

                response.error = {};
                response.success = true;
                response.message = 'ok';
                response.code = 200;
                response.data = elements;
                res.status(200).json(response);

                return true;

            } catch (e) {
                response.error = e;
                response.success = false;
                response.message = e as string;
                response.code = options?.customErrorCode || 500;
                response.data = {};
                res.status(response.code).json(response);
                throw e;
            }
        };
    }

    /**
     * This function helps to get an element by id from collection
     */
    getOneById<T extends MongooseDocument>(
        model: MongooseModelType<T>,
        populationObject: PopulationObject,
        options?: ApiOptions,
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<T>
    ): MongooseRequestHandler {
        return async (req, res) => {
            const response: ApiResponse = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };

            try {
                if (fIn && typeof fIn === 'function') {
                    req = await fIn(req);
                }

                const { id } = req.params;
                const { populate, select } = req.query;

                const query = model.findById(id);
                populateConstructor(query, populate, populationObject);
                selectConstructor(query, select);
                let element = await query.exec();

                if (!element) {
                    response.error = '404 not found';
                    response.success = false;
                    response.message = 'Object not found';
                    response.code = options?.customNotFoundCode || 404;
                    response.data = {};
                    res.status(response.code).json(response);
                    return false;
                }

                if (fOut && typeof fOut === 'function') {
                    element = await fOut(element);
                }

                response.error = {};
                response.success = true;
                response.message = 'ok';
                response.code = 200;
                response.data = element;
                res.status(200).json(response);

            } catch (e) {
                response.error = e;
                response.success = false;
                response.message = e as string;
                response.code = options?.customErrorCode || 500;
                response.data = {};
                res.status(response.code).json(response);
                throw e;
            }
        };
    }

    /**
     * This function helps to get an element by filtering parameters using where object from collection
     */
    getOneWhere<T extends MongooseDocument>(
        model: MongooseModelType<T>,
        populationObject: PopulationObject,
        options?: ApiOptions,
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<T>
    ): MongooseRequestHandler {
        return async (req, res) => {
            const response: ApiResponse = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };

            try {
                if (fIn && typeof fIn === 'function') {
                    req = await fIn(req);
                }

                const { where, like, whereObject, select, populate } = req.query;

                const processedWhere = whereConstructor(where);
                const processedLike = whereConstructor(like);

                const find: any = {};
                if (processedLike) {
                    for (const [key, val] of Object.entries(processedLike)) {
                        find[key] = { $regex: String(val).trim(), $options: 'i' };
                    }
                }
                if (processedWhere) {
                    for (const [key, val] of Object.entries(processedWhere)) {
                        find[key] = val;
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        find[key] = new ObjectId(String(val).trim());
                    }
                }

                const query = model.findOne(find);
                populateConstructor(query, populate, populationObject);
                selectConstructor(query, select);

                let element = await query.exec();

                if (!element) {
                    response.error = '404 not found';
                    response.success = false;
                    response.message = '404 not found';
                    response.code = options?.customNotFoundCode || 404;
                    response.data = {};
                    res.status(response.code).json(response);
                    return false;
                }

                if (fOut && typeof fOut === 'function') {
                    element = await fOut(element);
                }

                response.error = {};
                response.success = true;
                response.message = 'ok';
                response.code = 200;
                response.data = element;
                res.status(200).json(response);

            } catch (e) {
                response.error = e;
                response.success = false;
                response.message = e as string;
                response.code = options?.customErrorCode || 500;
                response.data = {};
                res.status(response.code).json(response);
                throw e;
            }
        };
    }

    /**
     * This function helps to get an element by filtering parameters using where object from collection and updating if exist or create if not exist
     */
    findUpdateOrCreate<T extends MongooseDocument>(
        model: MongooseModelType<T>,
        validationObject: ValidationObject,
        populationObject: PopulationObject,
        options?: ApiOptions,
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<T>
    ): MongooseRequestHandler {
        return async (req, res) => {
            const response: ApiResponse = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };

            try {
                if (fIn && typeof fIn === 'function') {
                    req = await fIn(req);
                }

                const data = req.body;
                const { populate, select, where, whereObject } = req.query;

                const processedWhere = whereConstructor(where);

                const find: any = {};
                if (processedWhere) {
                    for (const [key, val] of Object.entries(processedWhere)) {
                        find[key] = val;
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        find[key] = new ObjectId(String(val).trim());
                    }
                }

                let element = await model.findOne(find).exec();
                if (!element) {
                    element = new (model as any)(find);
                    element = await element.save();
                    const validation = validator.validateObject(data, validationObject, true);
                    if (!validation.success) {
                        response.error = validation.messages;
                        response.success = false;
                        response.message = validation.messages.join(', ');
                        response.code = options?.customValidationCode || 435;
                        response.data = {};
                        res.status(response.code).json(response);
                        return false;
                    }
                } else {
                    const validation = validator.validateObject(data, validationObject);
                    if (!validation.success) {
                        response.error = validation.messages;
                        response.success = false;
                        response.message = validation.messages.join(', ');
                        response.code = options?.customValidationCode || 435;
                        response.data = {};
                        res.status(response.code).json(response);
                        return false;
                    }
                }

                if (element) {
                    Object.assign(element, data);
                    if (options?.updateFieldName) {
                        (element as any)[options.updateFieldName] = moment().format();
                    }
                }

                const query = model.findById(element._id);
                populateConstructor(query, populate, populationObject);
                selectConstructor(query, select);
                const result = await query.exec();

                if (fOut && typeof fOut === 'function') {
                    element = await fOut(element);
                }

                response.error = {};
                response.success = true;
                response.message = 'ok';
                response.code = 200;
                response.data = element;
                res.status(200).json(response);

            } catch (e) {
                response.error = e;
                response.success = false;
                response.message = e as string;
                response.code = options?.customErrorCode || 500;
                response.data = {};
                res.status(response.code).json(response);
                throw e;
            }
        };
    }

    /**
     * This function helps to get an element by filtering parameters using where object from collection and updating if exist
     */
    findUpdate<T extends MongooseDocument>(
        model: MongooseModelType<T>,
        validationObject: ValidationObject,
        populationObject: PopulationObject,
        options?: ApiOptions,
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<T>
    ): MongooseRequestHandler {
        return async (req, res) => {
            const response: ApiResponse = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };

            try {
                if (fIn && typeof fIn === 'function') {
                    req = await fIn(req);
                }

                const data = req.body;
                const { populate, select, where, whereObject, like } = req.query;

                const processedWhere = whereConstructor(where);
                const processedLike = whereConstructor(like);

                const validation = validator.validateObject(data, validationObject);
                if (!validation.success) {
                    response.error = validation.messages;
                    response.success = false;
                    response.message = validation.messages.join(', ');
                    response.code = options?.customValidationCode || 435;
                    response.data = {};
                    res.status(response.code).json(response);
                    return false;
                }

                const find: any = {};
                if (processedLike) {
                    for (const [key, val] of Object.entries(processedLike)) {
                        find[key] = { $regex: String(val).trim(), $options: 'i' };
                    }
                }
                if (processedWhere) {
                    for (const [key, val] of Object.entries(processedWhere)) {
                        find[key] = val;
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        find[key] = new ObjectId(String(val));
                    }
                }

                let element = await model.findOne(find).exec();

                if (!element) {
                    response.error = '404 not found';
                    response.success = false;
                    response.message = validation.messages.join(', ');
                    response.code = options?.customNotFoundCode || 404;
                    response.data = {};
                    res.status(response.code).json(response);
                    return false;
                }

                if (element) {
                    Object.assign(element, data);
                    if (options?.updateFieldName) {
                        (element as any)[options.updateFieldName] = moment().format();
                    }
                }

                element = await element.save();

                const query = model.findById(element._id);
                populateConstructor(query, populate, populationObject);
                selectConstructor(query, select);
                element = await query.exec();

                if (element && fOut && typeof fOut === 'function') {
                    element = await fOut(element);
                }

                response.error = {};
                response.success = true;
                response.message = 'ok';
                response.code = 200;
                response.data = element;
                res.status(200).json(response);

            } catch (e) {
                response.error = e;
                response.success = false;
                response.message = e as string;
                response.code = options?.customErrorCode || 500;
                response.data = {};
                res.status(response.code).json(response);
                throw e;
            }
        };
    }

    /**
     * This function helps to get an element by id from collection and updating if exist
     */
    updateById<T extends MongooseDocument>(
        model: MongooseModelType<T>,
        validationObject: ValidationObject,
        populationObject: PopulationObject,
        options?: ApiOptions,
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<T>
    ): MongooseRequestHandler {
        return async (req, res) => {
            const response: ApiResponse = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };

            try {
                if (fIn && typeof fIn === 'function') {
                    req = await fIn(req);
                }

                const { params, body } = req;
                const { id } = params;
                const { populate, select } = req.query;

                const validation = validator.validateObject(body, validationObject);
                if (!validation.success) {
                    response.error = validation.messages;
                    response.success = false;
                    response.message = validation.messages.join(', ');
                    response.code = options?.customValidationCode || 435;
                    response.data = {};
                    res.status(response.code).json(response);
                    return false;
                }

                if (options?.updateFieldName) {
                    body[options.updateFieldName] = moment().format();
                }

                const element = await model.findByIdAndUpdate(id, { $set: body });

                if (!element) {
                    response.error = '404 not found';
                    response.success = false;
                    response.message = validation.messages.join(', ');
                    response.code = options?.customNotFoundCode || 404;
                    response.data = {};
                    res.status(response.code).json(response);
                    return false;
                }

                const query = model.findById(element._id);
                populateConstructor(query, populate, populationObject);
                selectConstructor(query, select);
                let updatedElement = await query.exec();

                if (updatedElement && fOut && typeof fOut === 'function') {
                    updatedElement = await fOut(updatedElement);
                }

                response.error = {};
                response.success = true;
                response.message = 'ok';
                response.code = 200;
                response.data = updatedElement;
                res.status(200).json(response);

            } catch (e) {
                response.error = e;
                response.success = false;
                response.message = e as string;
                response.code = options?.customErrorCode || 500;
                response.data = {};
                res.status(response.code).json(response);
                throw e;
            }
        };
    }

    /**
     * This function helps to delete an element by id
     */
    findIdAndDelete<T extends MongooseDocument>(
        model: MongooseModelType<T>,
        options?: ApiOptions,
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<T>
    ): MongooseRequestHandler {
        return async (req, res) => {
            const response: ApiResponse = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };

            try {
                if (fIn && typeof fIn === 'function') {
                    req = await fIn(req);
                }

                const id = req.params.id;
                let element = await model.findByIdAndDelete(id);

                if (!element) {
                    response.error = '404 not found';
                    response.success = false;
                    response.message = '404 not found';
                    response.code = options?.customNotFoundCode || 404;
                    response.data = {};
                    res.status(response.code).json(response);
                    return false;
                }

                if (fOut && typeof fOut === 'function') {
                    element = await fOut(element);
                }

                response.error = {};
                response.success = true;
                response.message = 'ok';
                response.code = 200;
                response.data = element;
                res.status(200).json(response);
                return true;

            } catch (e) {
                response.error = e;
                response.success = false;
                response.message = e as string;
                response.code = options?.customErrorCode || 500;
                response.data = {};
                res.status(response.code).json(response);
                throw e;
            }
        };
    }

    /**
     * This function helps to manage content using mongoose-datatables-fork
     */
    datatable<T extends MongooseDocument>(
        model: MongooseModelType<T>,
        populationObject: PopulationObject,
        search_fields: string | string[],
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<any>
    ): MongooseRequestHandler {
        return async (req, res) => {
            try {
                console.log('BODY ', JSON.stringify(req.body));

                if (fIn && typeof fIn === 'function') {
                    req = await fIn(req);
                }

                const { populate } = req.query;

                const order: { [key: string]: string } = {};
                if (req.body.columns && req.body.order) {
                    req.body.order.forEach((item: any) => {
                        const name = req.body.columns[item.column].data;
                        const dir = item.dir;
                        order[name] = dir;
                    });
                }

                let fields: string[] = [];
                if (search_fields) {
                    if (typeof search_fields === 'string' && search_fields !== '') {
                        fields = search_fields.split(',');
                    }
                    if (Array.isArray(search_fields)) {
                        fields = search_fields;
                    }
                }

                const find: any = {};
                if (req.body && req.body.filter && typeof req.body.filter === 'object') {
                    for (const [key, value] of Object.entries(req.body.filter)) {
                        if (value && value !== '-1') {
                            find[key] = value;
                        }
                    }
                }

                const objPopulate: string[] = [];

                if (populate) {
                    if (typeof populate === 'boolean' || populate === 'true' || populate === 1) {
                        for (const [key] of Object.entries(populationObject)) {
                            objPopulate.push(key);
                        }
                    }
                    if (typeof populate === 'object') {
                        for (const [key, value] of Object.entries(populate)) {
                            if (value && populationObject[key]) {
                                objPopulate.push(key);
                            }
                        }
                    }
                }

                if (model.dataTables) {
                    model.dataTables({
                        limit: req.body.length,
                        skip: req.body.start,
                        search: {
                            value: req.body.search.value,
                            fields: fields
                        },
                        sort: order,
                        populate: objPopulate.length > 0 ? objPopulate : false,
                        find
                    }).then(async (table: any) => {
                        table.success = true;
                        table.message = 'OK';
                        table.recordsTotal = table.total;
                        table.recordsFiltered = table.total;

                        if (fOut && typeof fOut === 'function') {
                            table = await fOut(table);
                        }

                        res.status(200).json(table);
                    }).catch(async (e: any) => {
                        throw e;
                    });
                } else {
                    throw new Error('dataTables method not found on model');
                }

            } catch (e) {
                const response: ApiResponse = {
                    error: e,
                    success: false,
                    message: e as string,
                    code: 500,
                    data: {}
                };
                res.status(500).json(response);
                throw e;
            }
        };
    }

    /**
     * This function helps to get datatable data format using an aggregation
     */
    datatable_aggregate<T extends MongooseDocument>(
        model: MongooseModelType<T>,
        pipeline: any[] = [],
        search_fields: string | string[],
        options: { allowDiskUse?: boolean; search_by_field?: boolean } = {
            allowDiskUse: true,
            search_by_field: false
        },
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<any>
    ): MongooseRequestHandler {
        return async (req, res) => {
            try {
                const response = {
                    message: 'OK',
                    recordsFiltered: 0,
                    recordsTotal: 0,
                    total: 0,
                    success: true,
                    data: {}
                };

                const body = req.body;

                if (fIn && typeof fIn === 'function') {
                    req = await fIn(req);
                }

                const { where, whereObject, like } = req.body;
                const order: any[] = [];
                const search_columns_or: any[] = [];

                if (req.body.columns && req.body.order) {
                    for (const item of req.body.order) {
                        const name = req.body.columns[item.column].data;
                        const search = req.body.columns[item.column]?.search?.value || '';
                        const dir = item.dir;
                        order.push([name, dir]);

                        if (search !== '' && options.search_by_field) {
                            const inner: any = {};
                            inner[name] = { $regex: search, $options: 'i' };
                            search_columns_or.push(inner);
                        }
                    }
                }

                const OR__: any[] = options.search_by_field ? search_columns_or : [];

                let fields: string[] = [];
                if (search_fields) {
                    if (typeof search_fields === 'string' && search_fields !== '') {
                        fields = search_fields.split(',');
                    }
                    if (Array.isArray(search_fields)) {
                        fields = search_fields;
                    }
                }

                if (fields.length > 0 && body?.search?.value) {
                    for (const item of fields) {
                        const inner: any = {};
                        if (isNaN(Number(body.search.value))) {
                            inner[item] = { $regex: body.search.value, $options: 'i' };
                        } else {
                            inner[item] = Number(body.search.value);
                        }
                        OR__.push(inner);
                    }
                }

                if (OR__.length > 0) {
                    pipeline.push({ $match: { $or: OR__ } });
                }

                const find: any = {};
                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        find[key] = { $regex: String(val).trim(), $options: 'i' };
                    }
                }
                if (where) {
                    for (const [key, val] of Object.entries(where)) {
                        find[key] = val;
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        find[key] = typeof val === 'string' ? new ObjectId(val) : val;
                    }
                }

                if (Object.keys(find).length > 0) {
                    pipeline.push({ $match: find });
                }

                const table = await model.aggregate(pipeline).allowDiskUse(options.allowDiskUse || false);
                const total = table.length;

                const pipeline2 = [...pipeline];

                pipeline2.push({ $skip: Number(body?.start || 0) });
                pipeline2.push({ $limit: Number(body?.length || 10) });

                if (order.length > 0) {
                    const sortObj: any = {};
                    order.forEach(([field, dir]) => {
                        sortObj[field] = dir.toUpperCase() === 'DESC' ? -1 : 1;
                    });
                    pipeline2.push({ $sort: sortObj });
                }

                const table2 = await model.aggregate(pipeline2).allowDiskUse(options.allowDiskUse || false);

                response.data = table2;
                response.recordsTotal = total;
                response.recordsFiltered = total;
                response.total = total;

                if (fOut && typeof fOut === 'function') {
                    const processedResponse = await fOut(response);
                    res.status(200).json(processedResponse);
                } else {
                    res.status(200).json(response);
                }

            } catch (e) {
                const response: ApiResponse = {
                    error: e,
                    success: false,
                    message: e as string,
                    code: 500,
                    data: {}
                };
                res.status(500).json(response);
                throw e;
            }
        };
    }
}

export default Apiato;
