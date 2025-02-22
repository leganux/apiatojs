import moment from 'moment';
import { Model, Document } from 'mongoose';
import { Request, Response } from 'express';

export interface ApiOptions {
    hideLogo?: boolean;
    customErrorCode?: number;
    customValidationCode?: number;
    customNotFoundCode?: number;
    updateFieldName?: string;
}

export interface ApiResponse {
    error: any;
    success: boolean;
    message: string;
    code: number;
    data: any;
}

export interface ValidationObject {
    [key: string]: {
        type: string;
        required?: boolean;
        regex?: RegExp;
        min?: number;
        max?: number;
    };
}

export interface PopulationObject {
    [key: string]: any;
}

export type PreRequestHook = (req: Request) => Promise<Request>;
export type PostResponseHook<T> = (data: T) => Promise<T>;

export type RequestWithQuery = Request & {
    query: {
        where?: any;
        whereObject?: any;
        like?: any;
        select?: any;
        paginate?: { page: number; limit: number };
        sort?: any;
        populate?: any;
    };
};

const validator = {
    validateObject: (obj: any, validationObject: ValidationObject, strict = false): { success: boolean; messages: string[] } => {
        const messages: string[] = [];
        let success = true;

        // Check required fields
        for (const [key, rules] of Object.entries(validationObject)) {
            if (rules.required && (obj[key] === undefined || obj[key] === null || obj[key] === '')) {
                messages.push(`${key} is required`);
                success = false;
            }
        }

        // Check field types and additional validations
        for (const [key, value] of Object.entries(obj)) {
            const rules = validationObject[key];
            if (!rules && strict) {
                messages.push(`${key} is not allowed`);
                success = false;
                continue;
            }
            if (rules) {
                // Type validation
                if (rules.type === 'number' && typeof value !== 'number') {
                    messages.push(`${key} must be a number`);
                    success = false;
                }
                if (rules.type === 'string' && typeof value !== 'string') {
                    messages.push(`${key} must be a string`);
                    success = false;
                }
                if (rules.type === 'boolean' && typeof value !== 'boolean') {
                    messages.push(`${key} must be a boolean`);
                    success = false;
                }

                // Regex validation
                if (rules.regex && typeof value === 'string' && !rules.regex.test(value)) {
                    messages.push(`${key} has invalid format`);
                    success = false;
                }

                // Min/Max validation for numbers
                if (typeof value === 'number') {
                    if (rules.min !== undefined && value < rules.min) {
                        messages.push(`${key} must be at least ${rules.min}`);
                        success = false;
                    }
                    if (rules.max !== undefined && value > rules.max) {
                        messages.push(`${key} must be at most ${rules.max}`);
                        success = false;
                    }
                }
            }
        }

        return { success, messages };
    }
};

export class ApiatoNoSQL {
    constructor(options?: ApiOptions) {
        if (!options?.hideLogo) {
            console.log(`
     __   ____  __   __  ____  __       __  ____ 
 / _\\ (  _ \\(  ) / _\\(_  _)/  \\    _(  )/ ___)
/    \\ ) __/ )( /    \\ )( (  O )_ / \\) \\\\___ \\
\\_/\\_/(__)  (__)\\_/\\_/(__) \\__/(_)\\____/(____/
                        ForNoSQL BETA 0.0.1 (c) leganux.net 2021-2025  v3.1.1
`);
        }
    }

    /**
     * This function helps to create a new element in model
     */
    createOne<T extends Document>(
        model: Model<T>,
        validationObject: ValidationObject,
        populationObject: PopulationObject,
        options?: ApiOptions,
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<T>
    ) {
        return async (req: Request, res: Response) => {
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

                let newElement = await model.create(body);

                const query = model.findById(newElement._id);
                if (populate) {
                    query.populate(populate as any);
                }
                if (select) {
                    query.select(select as any);
                }

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
     * This function helps to get many elements from collection
     */
    getMany<T extends Document>(
        model: Model<T>,
        populationObject: PopulationObject,
        options?: ApiOptions,
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<T[]>
    ) {
        return async (req: RequestWithQuery, res: Response) => {
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

                const find: any = {};
                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        find[key] = { $regex: val, $options: 'i' };
                    }
                }
                if (where) {
                    for (const [key, val] of Object.entries(where)) {
                        find[key] = val;
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        find[key] = val;
                    }
                }

                const query = model.find(find);

                if (populate) {
                    query.populate(populate as any);
                }
                if (select) {
                    query.select(select as any);
                }

                if (paginate && paginate.limit && paginate.page) {
                    query.limit(Number(paginate.limit));
                    const skip = (Number(paginate.page) - 1) * Number(paginate.limit);
                    query.skip(skip);
                }

                if (sort) {
                    query.sort(sort);
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
    getOneById<T extends Document>(
        model: Model<T>,
        populationObject: PopulationObject,
        options?: ApiOptions,
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<T>
    ) {
        return async (req: Request, res: Response) => {
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
                if (populate) {
                    query.populate(populate as any);
                }
                if (select) {
                    query.select(select as any);
                }

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
     * This function helps to update an element by id from collection
     */
    updateById<T extends Document>(
        model: Model<T>,
        validationObject: ValidationObject,
        populationObject: PopulationObject,
        options?: ApiOptions,
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<T>
    ) {
        return async (req: Request, res: Response) => {
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

                let element = await model.findById(id);

                if (!element) {
                    response.error = '404 not found';
                    response.success = false;
                    response.message = validation.messages.join(', ');
                    response.code = options?.customNotFoundCode || 404;
                    response.data = {};
                    res.status(response.code).json(response);
                    return false;
                }

                for (const [key, value] of Object.entries(body)) {
                    element[key] = value;
                }

                if (options?.updateFieldName) {
                    element[options.updateFieldName] = moment().format();
                }

                element = await element.save();

                const query = model.findById(element._id);
                if (populate) {
                    query.populate(populate as any);
                }
                if (select) {
                    query.select(select as any);
                }

                element = await query.exec();

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
     * This function helps to delete an element by id
     */
    findIdAndDelete<T extends Document>(
        model: Model<T>,
        options?: ApiOptions,
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<T>
    ) {
        return async (req: Request, res: Response) => {
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

                let element = await model.findById(id);

                if (!element) {
                    response.error = '404 not found';
                    response.success = false;
                    response.message = '404 not found';
                    response.code = options?.customNotFoundCode || 404;
                    response.data = {};
                    res.status(response.code).json(response);
                    return false;
                }

                await element.deleteOne();

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
     * This function helps to get datatable data format using an aggregation
     */
    datatable_aggregate<T extends Document>(
        model: Model<T>,
        populationObject: PopulationObject,
        search_fields: string | string[],
        options: { search_by_field: boolean } = {
            search_by_field: false
        },
        fIn?: PreRequestHook,
        fOut?: PostResponseHook<any>
    ) {
        return async (req: Request, res: Response) => {
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

                const query: any = { $match: {} };

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

                let OR__: any[] = [];
                if (options.search_by_field) {
                    OR__ = search_columns_or;
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

                if (fields.length > 0 && body?.search?.value) {
                    for (const item of fields) {
                        const inner: any = {};
                        if (isNaN(Number(body.search.value))) {
                            inner[item] = { $regex: body.search.value, $options: 'i' };
                            OR__.push(inner);
                        } else {
                            inner[item] = Number(body.search.value);
                            OR__.push(inner);
                        }
                    }
                    query.$match = { $or: OR__ };
                }

                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        query.$match[key] = { $regex: val, $options: 'i' };
                    }
                }
                if (where) {
                    for (const [key, val] of Object.entries(where)) {
                        query.$match[key] = val;
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        query.$match[key] = val;
                    }
                }

                const pipeline = [query];

                if (order.length > 0) {
                    const sort: any = {};
                    for (const [field, dir] of order) {
                        sort[field] = dir === 'DESC' ? -1 : 1;
                    }
                    pipeline.push({ $sort: sort });
                }

                const total = await model.countDocuments(query.$match);

                if (body?.start) {
                    pipeline.push({ $skip: Number(body.start) });
                }
                if (body?.length) {
                    pipeline.push({ $limit: Number(body.length) });
                }

                const table = await model.aggregate(pipeline);

                response.data = table;
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
