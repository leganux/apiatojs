import { Document, Model, PopulateOptions } from 'mongoose';
import moment from 'moment';
import validator from '../utils/validator';
import {
    ApiOptions,
    ApiResponse,
    PopulationObject,
    PreRequestHook,
    PostResponseHook,
    RequestWithQuery,
    ValidationObject,
    MongooseRequestHandler
} from '../types';

/**
 * This function helps to create and return population in mongoose
 */
const populateConstructor = (
    query: any,
    populate: any,
    populationObject: PopulationObject
): PopulateOptions[] => {
    const arrayForPopulate: PopulateOptions[] = [];

    if (populate && populationObject) {
        if ((typeof populate === 'boolean' || typeof populate === 'number' || typeof populate === 'string') &&
            (Boolean(populate) === true || populate === 1)) {
            for (const [key, value] of Object.entries(populationObject)) {
                arrayForPopulate.push({
                    path: key,
                    model: value as any
                });
            }
        }
        if (typeof populate === 'object') {
            for (const [key, value] of Object.entries(populate)) {
                if (value && populationObject[key]) {
                    arrayForPopulate.push({
                        path: key,
                        model: populationObject[key] as any
                    });
                }
            }
        }
    }
    return arrayForPopulate;
};

/**
 * This function helps to create and return select fields in mongoose
 */
const selectConstructor = (query: any, select: any): string => {
    let selectString = '';
    if (select) {
        if (typeof select === 'string') {
            selectString = select;
        } else if (typeof select === 'object') {
            if (Array.isArray(select)) {
                selectString = select.join(' ');
            } else {
                selectString = Object.keys(select).join(' ');
            }
        }
    }
    return selectString;
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

                let newElement = await model.create(body);

                const query = model.findById(newElement._id);
                const populateArray = populateConstructor(query, populate, populationObject);
                const selectString = selectConstructor(query, select);

                if (populateArray.length > 0) {
                    query.populate(populateArray);
                }
                if (selectString) {
                    query.select(selectString);
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
     * This function helps to create many elements in model
     */
    createMany<T extends Document>(
        model: Model<T>,
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

                let newElements = await model.create(correct);
                const elementIds = newElements.map(item => item._id);

                const query = model.find({ _id: { $in: elementIds } });
                const populateArray = populateConstructor(query, populate, populationObject);
                const selectString = selectConstructor(query, select);

                if (populateArray.length > 0) {
                    query.populate(populateArray);
                }
                if (selectString) {
                    query.select(selectString);
                }

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
    getMany<T extends Document>(
        model: Model<T>,
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
                        find[key] = { $regex: val, $options: 'i' };
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

                const query = model.find(find);
                const populateArray = populateConstructor(query, populate, populationObject);
                const selectString = selectConstructor(query, select);

                if (populateArray.length > 0) {
                    query.populate(populateArray);
                }
                if (selectString) {
                    query.select(selectString);
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
                const populateArray = populateConstructor(query, populate, populationObject);
                const selectString = selectConstructor(query, select);

                if (populateArray.length > 0) {
                    query.populate(populateArray);
                }
                if (selectString) {
                    query.select(selectString);
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
     * This function helps to get an element by filtering parameters using where object from collection
     */
    getOneWhere<T extends Document>(
        model: Model<T>,
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

                const { where, like, whereObject, select, sort, populate } = req.query;

                const processedWhere = whereConstructor(where);
                const processedLike = whereConstructor(like);

                const find: any = {};
                if (processedLike) {
                    for (const [key, val] of Object.entries(processedLike)) {
                        find[key] = { $regex: val, $options: 'i' };
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

                const query = model.findOne(find);
                const populateArray = populateConstructor(query, populate, populationObject);
                const selectString = selectConstructor(query, select);

                if (populateArray.length > 0) {
                    query.populate(populateArray);
                }
                if (selectString) {
                    query.select(selectString);
                }

                if (sort) {
                    query.sort(sort);
                }

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
    findUpdateOrCreate<T extends Document>(
        model: Model<T>,
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
                        find[key] = val;
                    }
                }

                let element = await model.findOne(find);

                if (!element) {
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
                    element = await model.create(data);
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

                for (const [key, value] of Object.entries(data)) {
                    element[key] = value;
                }

                if (options?.updateFieldName) {
                    element[options.updateFieldName] = moment().format();
                }

                element = await element.save();

                const query = model.findById(element._id);
                const populateArray = populateConstructor(query, populate, populationObject);
                const selectString = selectConstructor(query, select);

                if (populateArray.length > 0) {
                    query.populate(populateArray);
                }
                if (selectString) {
                    query.select(selectString);
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
     * This function helps to get an element by filtering parameters using where object from collection and updating if exist
     */
    findUpdate<T extends Document>(
        model: Model<T>,
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
                        find[key] = { $regex: val, $options: 'i' };
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

                let element = await model.findOne(find);

                if (!element) {
                    response.error = '404 not found';
                    response.success = false;
                    response.message = validation.messages.join(', ');
                    response.code = options?.customNotFoundCode || 404;
                    response.data = {};
                    res.status(response.code).json(response);
                    return false;
                }

                for (const [key, value] of Object.entries(data)) {
                    element[key] = value;
                }

                if (options?.updateFieldName) {
                    element[options.updateFieldName] = moment().format();
                }

                element = await element.save();

                const query = model.findById(element._id);
                const populateArray = populateConstructor(query, populate, populationObject);
                const selectString = selectConstructor(query, select);

                if (populateArray.length > 0) {
                    query.populate(populateArray);
                }
                if (selectString) {
                    query.select(selectString);
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
     * This function helps to get an element by id from collection and updating if exist
     */
    updateById<T extends Document>(
        model: Model<T>,
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

                let updatedElement = await model.findById(id);

                if (!updatedElement) {
                    response.error = '404 not found';
                    response.success = false;
                    response.message = validation.messages.join(', ');
                    response.code = options?.customNotFoundCode || 404;
                    response.data = {};
                    res.status(response.code).json(response);
                    return false;
                }

                for (const [key, value] of Object.entries(body)) {
                    updatedElement[key] = value;
                }

                if (options?.updateFieldName) {
                    updatedElement[options.updateFieldName] = moment().format();
                }

                updatedElement = await updatedElement.save();

                const query = model.findById(updatedElement._id);
                const populateArray = populateConstructor(query, populate, populationObject);
                const selectString = selectConstructor(query, select);

                if (populateArray.length > 0) {
                    query.populate(populateArray);
                }
                if (selectString) {
                    query.select(selectString);
                }

                updatedElement = await query.exec();

                if (fOut && typeof fOut === 'function') {
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
    findIdAndDelete<T extends Document>(
        model: Model<T>,
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
}

export default ApiatoNoSQL;
