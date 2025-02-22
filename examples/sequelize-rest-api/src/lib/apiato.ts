import moment from 'moment';
import { Model, ModelStatic, Op } from 'sequelize';
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

/**
 * This function helps to create and return population in Sequelize
 */
const populateConstructor = (
    query: any,
    populate: any,
    populationObject: PopulationObject
): any => {
    const arrayForJoin: any[] = [];

    if (populate && populationObject) {
        if ((typeof populate === 'boolean' || typeof populate === 'number' || typeof populate === 'string') &&
            (Boolean(populate) === true || populate === 1)) {
            for (const [key, value] of Object.entries(populationObject)) {
                arrayForJoin.push({
                    model: value,
                    required: false,
                });
            }
        }
        if (typeof populate === 'object') {
            for (const [key, value] of Object.entries(populate)) {
                if (value && populationObject[key]) {
                    arrayForJoin.push({
                        model: populationObject[key],
                        required: false,
                    });
                }
            }
        }
    }
    query.include = arrayForJoin;
    return query;
};

/**
 * This function helps to create and return select fields in Sequelize
 */
const selectConstructor = (query: any, select: any): any => {
    if (select) {
        let attributes: string[] = [];
        if (typeof select === 'string') {
            attributes = select.split(',');
        } else if (typeof select === 'object') {
            if (Array.isArray(select)) {
                attributes = select;
            } else {
                for (const [key] of Object.entries(select)) {
                    attributes.push(key);
                }
            }
        }
        query.attributes = attributes;
    }
    return query;
};

const whereConstructor = (where: any): any => {
    if (where) {
        for (const [key, val] of Object.entries(where)) {
            if (Number(val)) {
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

export class ApiatoSQL {
    private id_name: string;

    constructor(id_name = '_id', options?: ApiOptions) {
        this.id_name = id_name || '_id';

        if (!options?.hideLogo) {
            console.log(`
     __   ____  __   __  ____  __       __  ____ 
 / _\\ (  _ \\(  ) / _\\(_  _)/  \\    _(  )/ ___)
/    \\ ) __/ )( /    \\ )( (  O )_ / \\) \\\\___ \\
\\_/\\_/(__)  (__)\\_/\\_/(__) \\__/(_)\\____/(____/
                        ForSQL BETA 0.0.1 (c) leganux.net 2021-2025  v3.1.1
`);
        }
    }

    /**
     * This function helps to create a new element in model
     */
    createOne<T extends Model>(
        model: ModelStatic<Model>,
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

                const newElement = await model.create(body);

                const query: any = {
                    where: {}
                };
                query.where[this.id_name] = (newElement as any)[this.id_name];

                populateConstructor(query, populate, populationObject);
                selectConstructor(query, select);

                const element = await model.findOne(query);

                if (fOut && typeof fOut === 'function') {
                    const processedElement = await fOut(element as T);
                    response.data = processedElement;
                } else {
                    response.data = element;
                }

                response.error = {};
                response.success = true;
                response.message = 'ok';
                response.code = 200;
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
    getMany<T extends Model>(
        model: ModelStatic<Model>,
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

                const processedWhere = whereConstructor(where);
                const processedLike = whereConstructor(like);

                const find: any = {};
                if (processedLike) {
                    for (const [key, val] of Object.entries(processedLike)) {
                        find[key] = { [Op.like]: `%${val}%` };
                    }
                }
                if (processedWhere) {
                    for (const [key, val] of Object.entries(processedWhere)) {
                        find[key] = val;
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        find[key] = val;
                    }
                }

                const query: any = { where: find };

                populateConstructor(query, populate, populationObject);
                selectConstructor(query, select);

                if (paginate && paginate.limit && paginate.page) {
                    query.limit = Number(paginate.limit);
                    const offset = (Number(paginate.page) - 1) * Number(paginate.limit);
                    query.offset = offset;
                }

                if (sort) {
                    const order: any[] = [];
                    for (const [key, val] of Object.entries(sort)) {
                        let orderDir = 'ASC';
                        if (val === -1) {
                            orderDir = 'DESC';
                        } else if (val === 1) {
                            orderDir = 'ASC';
                        } else {
                            orderDir = val as string;
                        }
                        order.push([key, orderDir.toUpperCase()]);
                    }
                    query.order = order;
                }

                const elements = await model.findAll(query);

                if (fOut && typeof fOut === 'function') {
                    const processedElements = await fOut(elements as T[]);
                    response.data = processedElements;
                } else {
                    response.data = elements;
                }

                response.error = {};
                response.success = true;
                response.message = 'ok';
                response.code = 200;
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
    getOneById<T extends Model>(
        model: ModelStatic<Model>,
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

                const query: any = {
                    where: {}
                };
                query.where[this.id_name] = id;

                populateConstructor(query, populate, populationObject);
                selectConstructor(query, select);

                const element = await model.findOne(query);

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
                    const processedElement = await fOut(element as T);
                    response.data = processedElement;
                } else {
                    response.data = element;
                }

                response.error = {};
                response.success = true;
                response.message = 'ok';
                response.code = 200;
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
    updateById<T extends Model>(
        model: ModelStatic<Model>,
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

                const query: any = {
                    where: {}
                };
                query.where[this.id_name] = id;

                let element = await model.findOne(query);

                if (!element) {
                    response.error = '404 not found';
                    response.success = false;
                    response.message = validation.messages.join(', ');
                    response.code = options?.customNotFoundCode || 404;
                    response.data = {};
                    res.status(response.code).json(response);
                    return false;
                }

                await element.update(body);

                if (options?.updateFieldName) {
                    await element.update({
                        [options.updateFieldName]: moment().format()
                    });
                }

                populateConstructor(query, populate, populationObject);
                selectConstructor(query, select);

                element = await model.findOne(query);

                if (fOut && typeof fOut === 'function') {
                    const processedElement = await fOut(element as T);
                    response.data = processedElement;
                } else {
                    response.data = element;
                }

                response.error = {};
                response.success = true;
                response.message = 'ok';
                response.code = 200;
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
    findIdAndDelete<T extends Model>(
        model: ModelStatic<Model>,
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

                const query: any = {
                    where: {}
                };
                query.where[this.id_name] = id;

                const element = await model.findOne(query);

                if (!element) {
                    response.error = '404 not found';
                    response.success = false;
                    response.message = '404 not found';
                    response.code = options?.customNotFoundCode || 404;
                    response.data = {};
                    res.status(response.code).json(response);
                    return false;
                }

                await element.destroy();

                if (fOut && typeof fOut === 'function') {
                    const processedElement = await fOut(element as T);
                    response.data = processedElement;
                } else {
                    response.data = element;
                }

                response.error = {};
                response.success = true;
                response.message = 'ok';
                response.code = 200;
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
     * This function helps to get datatable data format
     */
    datatable_aggregate<T extends Model>(
        model: ModelStatic<Model>,
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

                const query: any = { where: {} };

                if (req.body.columns && req.body.order) {
                    for (const item of req.body.order) {
                        const name = req.body.columns[item.column].data;
                        const search = req.body.columns[item.column]?.search?.value || '';
                        const dir = item.dir;
                        order.push([name, dir]);

                        if (search !== '' && options.search_by_field) {
                            const inner: any = {};
                            inner[name] = { [Op.like]: `%${search}%` };
                            search_columns_or.push(inner);
                        }
                    }
                }
                query.order = order;

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
                            inner[item] = { [Op.like]: `%${body.search.value}%` };
                            OR__.push(inner);
                        } else {
                            inner[item] = Number(body.search.value);
                            OR__.push(inner);
                        }
                    }
                    query.where = { [Op.or]: OR__ };
                }

                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        query.where[key] = { [Op.like]: `%${val}%` };
                    }
                }
                if (where) {
                    for (const [key, val] of Object.entries(where)) {
                        query.where[key] = val;
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        query.where[key] = val;
                    }
                }

                const query2 = { ...query };

                const table = await model.findAll(query);
                const total = table.length;

                query2.limit = Number(body?.length || 0);
                query2.offset = Number(body?.start || 0);

                const table2 = await model.findAll(query2);

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
