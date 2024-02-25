/**
 *  ** APIATO for SQL **
 *
 * A simple API basic generator for expressjs and SEQULIZE to easy implement Rest API´s
 * quering by front end or API gateway
 */

'use strict'


let objectValidatorHelper = require('./validator')
const {Sequelize, DataTypes, Op} = require("sequelize");


/** This function helps  to create and return population in mongoose */
let populateConstructor = function (query, populate, populationObject) {
    /** Fragmento que busca y construye el objeto de retorno  populado*/

    let arrayForJoin = []

    if (populate && populationObject) {
        if ((typeof populate == "boolean" || typeof populate == "number" || typeof populate == "string") && (Boolean(populate) == true || populate == 1)) {
            for (let [key, value] of Object.entries(populationObject)) {
                arrayForJoin.push({
                    model: value,
                    required: false,
                })
            }
        }
        if (typeof populate == "object") {
            for (let [key, value] of Object.entries(populate)) {
                if (value && populationObject[key]) {
                    arrayForJoin.push({
                        model: populationObject[key],
                        required: false,
                    })
                }

            }
        }
    }
    query.include = arrayForJoin
    return query
}

/** This function helps  to create and return seelct fields in mongoose */
let selectConstructor = function (query, select) {


    /** Fragmento que busca y construye el objeto de retorno  select*/
    if (select) {
        let attributes = []
        if (typeof select == 'string') {
            attributes = select.split(',')
        } else if (typeof select == 'object') {
            if (Array.isArray(select)) {
                attributes = select
            } else {
                for (const [key, val] of Object.entries(select)) {
                    attributes.push(key);
                }
            }

        }
        query.attributes = attributes
    }
    return query
}

let whereConstructor = function (where) {

    if (where) {
        for (const [key, val] of Object.entries(where)) {
            if (Number(val)) {
                where[key] = Number(val)
                continue
            }
            if (typeof val == 'boolean' || val == 'true' || val == 'false') {
                where[key] = Boolean(val)
                continue
            }
        }
    }

    return where
}

/** Here we define the apiato constructor */
let apiato_sql = function (id_name = '_id', options) {
    if (!id_name) {
        this.id_name = '_id'
    } else {
        this.id_name = id_name
    }


    if (!options?.hideLogo) {
        console.log(`
     __   ____  __   __  ____  __       __  ____ 
 / _\\ (  _ \\(  ) / _\\(_  _)/  \\    _(  )/ ___)
/    \\ ) __/ )( /    \\ )( (  O )_ / \\) \\\\___ \\
\\_/\\_/(__)  (__)\\_/\\_/(__) \\__/(_)\\____/(____/
                        ForSQL BETA 0.0.1 (c) leganux.net 2021-2022  v1.2.5
`)
    }

    let el = this
    /** This function helps  to create  a new element in model*/
    this.createOne = function (model_, validationObject, populationObject, options, fIn_, fOut_) {
        return async function (req, res) {

            let response = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };

            try {

                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let {body} = req;
                let {populate, select} = req.query;


                let validation = objectValidatorHelper.validateObject(body, validationObject, true);

                if (!validation.success) {
                    response.error = validation.messages
                    response.success = false
                    response.message = validation.messages.join(', ')
                    response.code = options && options.customValidationCode ? options.customValidationCode : 435
                    response.data = {}
                    res.status(options && options.customValidationCode ? options.customValidationCode : 435).json(response)
                    return false
                }

                let newElement = await model_.create(body);

                let query = {
                    where: {}
                }
                query.where[el.id_name] = newElement[el.id_name]

                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)
                console.log('APIATO ** SQL-Query', query)
                newElement = await model_.findOne(query)

                /**  Execute and process body After create new element */
                if (fOut_ && typeof (fOut_) == 'function') {
                    newElement = await fOut_(newElement)
                }

                response.error = {}
                response.success = true
                response.message = 'ok'
                response.code = 200
                response.data = newElement
                res.status(200).json(response)

            } catch (e) {
                response.error = e
                response.success = false
                response.message = e
                response.code = options && options.customErrorCode ? options.customErrorCode : 500
                response.data = {}
                res.status(options && options.customErrorCode ? options.customErrorCode : 500).json(response)
                throw e
            }

        }
    }

    /** This function helps  to create  a new elements in model*/
    this.createMany = function (model_, validationObject, populationObject, options, fIn_, fOut_) {
        return async function (req, res) {
            let response = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };
            try {

                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let {body} = req;
                let {populate, select} = req.query;


                if (body && typeof body == 'object' && !Array.isArray(body)) {
                    let arr = []
                    console.info('An object was recieved instead an array, trying make the convertion ')
                    for (let [key, value] of Object.entries(body)) {
                        value._key_ = key
                        arr.push(value)

                    }
                    body = arr
                    console.info('A generated array is', body)
                }

                let validationErrors = []
                let correct = []
                for (let item of body) {
                    let validation = objectValidatorHelper.validateObject(item, validationObject, true);
                    if (validation.success) {
                        correct.push(item)
                    } else {
                        validationErrors.push({
                            error: item,
                            detail: validation.messages
                        })
                    }
                }

                let newElement = await model_.bulkCreate(correct);
                newElement = newElement.map(item => {
                    return item[el.id_name]
                })

                let query = {
                    where: {}
                }
                query.where[el.id_name] = newElement

                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)
                console.log('APIATO ** SQL-Query', query)

                newElement = await model_.findAll(query)

                /**  Execute and process body After create new element */
                if (fOut_ && typeof (fOut_) == 'function') {
                    newElement = await fOut_(newElement)
                }

                response.error = validationErrors
                response.success = true
                response.message = 'ok'
                response.code = 200
                response.data = newElement
                res.status(200).json(response)

            } catch (e) {
                response.error = e
                response.success = false
                response.message = e
                response.code = options && options.customErrorCode ? options.customErrorCode : 500
                response.data = {}
                res.status(options && options.customErrorCode ? options.customErrorCode : 500).json(response)
                throw e
            }


        }
    }

    /** This function helps  to get many elements from  collection*/
    this.getMany = function (model_, populationObject, options, fIn_, fOut_) {
        return async function (req, res) {
            let response = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };
            try {


                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let {where, whereObject, like, select, paginate, sort, populate} = req.query;


                where = whereConstructor(where)
                like = whereConstructor(like)


                let find = {};
                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        find[key] = {[Op.like]: `%${val}%`}
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

                let query = {where: find};


                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)

                if (paginate && paginate.limit && paginate.page) {
                    query.limit = paginate.limit
                    let offset = (paginate.page - 1) * paginate.limit;
                    query.offset = offset
                }

                if (sort) {
                    let order = [];
                    for (const [key, val] of Object.entries(sort)) {
                        let or_der = 'ASC'
                        if (val == -1) {
                            or_der = 'DESC'
                        } else if (val == 1) {
                            or_der = 'ASC'
                        } else {
                            or_der = val
                        }
                        order.push([key, or_der.toUpperCase()])
                    }
                    query.order = order;
                }

                console.log('APIATO ** SQL-Query', query)
                let list_of_elements = await model_.findAll(query)

                /**  Execute and process body After create new element */
                if (fOut_ && typeof (fOut_) == 'function') {
                    list_of_elements = await fOut_(list_of_elements)
                }

                response.error = {}
                response.success = true
                response.message = 'ok'
                response.code = 200
                response.data = list_of_elements
                res.status(200).json(response)

                return true;

            } catch (e) {
                response.error = e
                response.success = false
                response.message = e
                response.code = options && options.customErrorCode ? options.customErrorCode : 500
                response.data = {}
                res.status(options && options.customErrorCode ? options.customErrorCode : 500).json(response)
                throw e
            }

        }
    }

    /** This function helps  to get an element by id from  collection*/
    this.getOneById = function (model_, populationObject, options, fIn_, fOut_) {

        return async function (req, res) {
            let response = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };
            try {

                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let {id} = req.params;
                let {populate, select} = req.query;


                let query = {
                    where: {}
                }
                query.where[el.id_name] = id
                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)
                console.log('APIATO ** SQL-Query', query)
                let newElement = await model_.findOne(query)

                if (!newElement) {
                    response.error = '404 not found'
                    response.success = false
                    response.message = 'Object not found'
                    response.code = options && options.customNotFoundCode ? options.customNotFoundCode : 404
                    response.data = {}
                    res.status(options && options.customNotFoundCode ? options.customNotFoundCode : 404).json(response)
                    return false
                }

                /**  Execute and process body After create new element */
                if (fOut_ && typeof (fOut_) == 'function') {
                    newElement = await fOut_(newElement)
                }

                response.error = {}
                response.success = true
                response.message = 'ok'
                response.code = 200
                response.data = newElement
                res.status(200).json(response)

            } catch (e) {
                response.error = e
                response.success = false
                response.message = e
                response.code = options && options.customErrorCode ? options.customErrorCode : 500
                response.data = {}
                res.status(options && options.customErrorCode ? options.customErrorCode : 500).json(response)
                throw e
            }
        }
    }

    /** This function helps  to get an element by filtering parameters using where object from  collection*/
    this.getOneWhere = function (model_, populationObject, options, fIn_, fOut_) {
        let response = {
            error: '',
            success: false,
            message: '',
            code: 0,
            data: {}
        };

        return async function (req, res) {
            try {

                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let {where, like, whereObject, select, sort, populate} = req.query;

                where = whereConstructor(where)
                like = whereConstructor(like)


                let find = {};
                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        find[key] = {[Op.like]: `%${val}%`}
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

                let query = {where: find};

                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)

                if (sort) {
                    let order = [];
                    for (const [key, val] of Object.entries(sort)) {
                        let or_der = 'ASC'
                        if (val == -1) {
                            or_der = 'DESC'
                        } else if (val == 1) {
                            or_der = 'ASC'
                        } else {
                            or_der = val
                        }
                        order.push([key, or_der.toUpperCase()])
                    }
                    query.order = order;
                }

                console.log('APIATO ** SQL-Query', query)
                let newElement = await model_.findOne(query)

                if (!newElement) {
                    response.error = '404 not found'
                    response.success = false
                    response.message = '404 not found'
                    response.code = options && options.customNotFoundCode ? options.customNotFoundCode : 404
                    response.data = {}
                    res.status(options && options.customNotFoundCode ? options.customNotFoundCode : 404).json(response)
                    return false
                }

                /**  Execute and process body After create new element */
                if (fOut_ && typeof (fOut_) == 'function') {
                    newElement = await fOut_(newElement)
                }

                response.error = {}
                response.success = true
                response.message = 'ok'
                response.code = 200
                response.data = newElement
                res.status(200).json(response)

            } catch (e) {
                response.error = e
                response.success = false
                response.message = e
                response.code = options && options.customErrorCode ? options.customErrorCode : 500
                response.data = {}
                res.status(options && options.customErrorCode ? options.customErrorCode : 500).json(response)
                throw e
            }
        }
    }

    /** This function helps  to get an element by filtering parameters using where object from  collection and updating if exist or create if not exist*/
    this.findUpdateOrCreate = function (model_, validationObject, populationObject, options, fIn_, fOut_) {
        return async function (req, res) {

            let response = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };

            try {

                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let data = req.body;
                let {populate, select, where, whereObject} = req.query;

                where = whereConstructor(where)

                let find = {};
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

                let query = {
                    where: find
                }
                console.log('APIATO ** SQL-Query', query)
                let newElement = await model_.findOne(query)
                if (!newElement) {
                    let validation = objectValidatorHelper.validateObject(data, validationObject, true);
                    if (!validation.success) {
                        response.error = validation.messages
                        response.success = false
                        response.message = validation.messages.join(', ')
                        response.code = options && options.customValidationCode ? options.customValidationCode : 435
                        response.data = {}
                        res.status(options && options.customValidationCode ? options.customValidationCode : 435).json(response)
                        return false
                    }
                    newElement = await model_.create(data);
                } else {
                    let validation = objectValidatorHelper.validateObject(data, validationObject);
                    if (!validation.success) {
                        response.error = validation.messages
                        response.success = false
                        response.message = validation.messages.join(', ')
                        response.code = options && options.customValidationCode ? options.customValidationCode : 435
                        response.data = {}
                        res.status(options && options.customValidationCode ? options.customValidationCode : 435).json(response)
                        return false
                    }
                }

                query = {
                    where: {}
                }
                query.where[el.id_name] = newElement[el.id_name]
                console.log('APIATO ** SQL-Query', query)
                newElement = await model_.findOne(query)
                for (let [key, value] of Object.entries(data)) {
                    newElement[key] = value
                }
                newElement = await newElement.save();

                query = {
                    where: {}
                }
                query.where[el.id_name] = newElement[el.id_name]

                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)
                console.log('APIATO ** SQL-Query', query)
                newElement = await model_.findOne(query)


                /**  Execute and process body After create new element */
                if (fOut_ && typeof (fOut_) == 'function') {
                    newElement = await fOut_(newElement)
                }

                response.error = {}
                response.success = true
                response.message = 'ok'
                response.code = 200
                response.data = newElement
                res.status(200).json(response)
            } catch (e) {
                response.error = e
                response.success = false
                response.message = e
                response.code = options && options.customErrorCode ? options.customErrorCode : 500
                response.data = {}
                res.status(options && options.customErrorCode ? options.customErrorCode : 500).json(response)
                throw e
            }


        }
    }

    /** This function helps  to get an element by filtering parameters using where object from  collection and updating if exist */
    this.findUpdate = function (model_, validationObject, populationObject, options, fIn_, fOut_) {
        return async function (req, res) {

            let response = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };
            try {

                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let data = req.body;
                let {populate, select, where, whereObject, like} = req.query;

                where = whereConstructor(where)
                like = whereConstructor(like)


                let validation = objectValidatorHelper.validateObject(data, validationObject);
                if (!validation.success) {
                    response.error = validation.messages
                    response.success = false
                    response.message = validation.messages.join(', ')
                    response.code = options && options.customValidationCode ? options.customValidationCode : 435
                    response.data = {}
                    res.status(options && options.customValidationCode ? options.customValidationCode : 435).json(response)
                    return false
                }

                let find = {};
                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        find[key] = {[Op.like]: `%${val}%`}
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

                let query = {where: find};
                console.log('APIATO ** SQL-Query', query)
                let newElement = await model_.findOne(query)

                if (!newElement) {
                    response.error = '404 not found'
                    response.success = false
                    response.message = validation.messages.join(', ')
                    response.code = options && options.customNotFoundCode ? options.customNotFoundCode : 404
                    response.data = {}
                    res.status(options && options.customNotFoundCode ? options.customNotFoundCode : 404).json(response)
                    return false
                }

                for (let [key, value] of Object.entries(data)) {
                    newElement[key] = value
                }

                newElement = await newElement.save();

                query = {
                    where: {}
                }
                query.where[el.id_name] = newElement[el.id_name]

                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)
                console.log('APIATO ** SQL-Query', query)
                newElement = await model_.findOne(query)

                /**  Execute and process body After create new element */
                if (fOut_ && typeof (fOut_) == 'function') {
                    newElement = await fOut_(newElement)
                }

                response.error = {}
                response.success = true
                response.message = 'ok'
                response.code = 200
                response.data = newElement
                res.status(200).json(response)
            } catch (e) {
                response.error = e
                response.success = false
                response.message = e
                response.code = options && options.customErrorCode ? options.customErrorCode : 500
                response.data = {}
                res.status(options && options.customErrorCode ? options.customErrorCode : 500).json(response)
                throw e
            }


        }
    }


    /** This function helps  to get an element by id from  collection and updating if exist */
    this.updateById = function (model_, validationObject, populationObject, options, fIn_, fOut_) {
        return async function (req, res) {
            let response = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };

            try {
                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let {params, body} = req;
                let {id} = params;
                let {populate, select} = req.query;


                let validation = objectValidatorHelper.validateObject(body, validationObject);
                if (!validation.success) {
                    response.error = validation.messages
                    response.success = false
                    response.message = validation.messages.join(', ')
                    response.code = options && options.customValidationCode ? options.customValidationCode : 435
                    response.data = {}
                    res.status(options && options.customValidationCode ? options.customValidationCode : 435).json(response)
                    return false
                }

                let query = {
                    where: {}
                }
                query.where[el.id_name] = id

                let element = await model_.findOne(query);

                if (!element) {
                    response.error = '404 not found'
                    response.success = false
                    response.message = validation.messages.join(', ')
                    response.code = options && options.customNotFoundCode ? options.customNotFoundCode : 404
                    response.data = {}
                    res.status(options && options.customNotFoundCode ? options.customNotFoundCode : 404).json(response)
                    return false
                }
                for (let [key, val] of Object.entries(body)) {
                    element[key] = val
                }
                await element.save()

                query = {
                    where: {}
                }
                query.where[el.id_name] = element[el.id_name]
                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)
                console.log('APIATO ** SQL-Query', query)
                let newElement = await model_.findOne(query)

                /**  Execute and process body After create new element */
                if (fOut_ && typeof (fOut_) == 'function') {
                    newElement = await fOut_(newElement)
                }

                response.error = {}
                response.success = true
                response.message = 'ok'
                response.code = 200
                response.data = newElement
                res.status(200).json(response)

            } catch (e) {
                response.error = e
                response.success = false
                response.message = e
                response.code = options && options.customErrorCode ? options.customErrorCode : 500
                response.data = {}
                res.status(options && options.customErrorCode ? options.customErrorCode : 500).json(response)
                throw e
            }
        }
    }


    /** This function helps  to delete an element by id */
    this.findIdAndDelete = function (model_, options, fIn_, fOut_) {
        return async function (req, res) {
            let response = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };
            try {
                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let id = req.params.id;

                let query = {
                    where: {}
                }
                query.where[el.id_name] = id

                console.log('APIATO ** SQL-Query', query)
                let newElement = await model_.findOne(query);

                if (!newElement) {
                    response.error = '404 not found'
                    response.success = false
                    response.message = '404 not found'
                    response.code = options && options.customNotFoundCode ? options.customNotFoundCode : 404
                    response.data = {}
                    res.status(options && options.customNotFoundCode ? options.customNotFoundCode : 404).json(response)
                    return false
                }

                newElement = await newElement.destroy()

                if (fOut_ && typeof (fOut_) == 'function') {
                    newElement = await fOut_(newElement)
                }

                response.error = {}
                response.success = true
                response.message = 'ok'
                response.code = 200
                response.data = newElement
                res.status(200).json(response)
                return true;
            } catch (e) {
                response.error = e
                response.success = false
                response.message = e
                response.code = options && options.customErrorCode ? options.customErrorCode : 500
                response.data = {}
                res.status(options && options.customErrorCode ? options.customErrorCode : 500).json(response)
                throw e
            }
        }
    }


    /** This function helps  to get datable data format  using an agreggation */
    this.datatable_aggregate = function (model_, populationObject, search_fields, options = {
        search_by_field: false
    }, fIn_, fOut_) {

        return async function (req, res) {
            try {

                let response = {
                    message: 'OK',
                    recordsFiltered: 0,
                    recordsTotal: 0,
                    total: 0,
                    success: true,
                    data: {}
                };

                let body = req.body

                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let {where, whereObject, like} = req.body


                let order = [];
                let search_columns_or = []

                let query = {where: {}}

                if (req.body.columns && req.body.order) {
                    for (let item of req.body.order) {

                        let name = req.body.columns[item.column].data;
                        let search = (req.body.columns[item.column]?.search?.value) || '';
                        let dir = item.dir;
                        order.push([name, dir])

                        if (search !== "" && options.search_by_field) {
                            let inner = {}
                            inner[name] = {[Op.like]: `%${search}%`}
                            search_columns_or.push(inner)
                        }
                    }
                }
                query.order = order

                let OR__ = []
                if (options.search_by_field) {
                    OR__ = search_columns_or
                }


                let fields = []
                if (search_fields) {
                    if (typeof search_fields == 'string' && search_fields != '') {
                        fields = search_fields.split(',')
                    }
                    if (typeof search_fields == "object" && Array.isArray(search_fields)) {
                        fields = search_fields
                    }
                }

                if (fields.length > 0 && body?.search?.value != '') {

                    for (let item of fields) {
                        let inner = {}
                        if (isNaN(Number(body?.search?.value))) {
                            inner[item] = {[Op.like]: `%${body?.search?.value}%`}
                            OR__.push(inner)
                        } else {
                            inner[item] = Number(body?.search?.value)
                            OR__.push(inner)
                        }
                    }
                    query.where = {[Op.or]: OR__}
                }

                let find = {};
                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        query.where[key] = {[Op.like]: `%${val}%`}
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

                console.log('APIATO ** SQL-Query', query)

                let query2 = {...query}

                let table = await model_.findAll(query)
                let total = table.length

                query2.limit = Number(body?.length || 0)
                query2.offset = Number(body?.start || 0)


                let table2 = await model_.findAll(query2)


                response.data = table2
                response.recordsTotal = total
                response.recordsFiltered = total
                response.total = total

                if (fOut_ && typeof (fOut_) == 'function') {
                    response = await fOut_(response)
                }

                res.status(200).json(response)


            } catch (e) {
                let response = {}
                response.error = e
                response.success = false
                response.message = e
                response.code = options && options.customErrorCode ? options.customErrorCode : 500
                response.data = {}
                res.status(options && options.customErrorCode ? options.customErrorCode : 500).json(response)
                throw e
            }

        }
    }


    /** This function helps  to get  data   using an agreggation */
    this.aggregate = function (model_, rawQuery = {}, options, fIn_, fMid_, fOut_) {
        return async function (req, res) {
            let response = {
                error: '',
                success: false,
                message: '',
                code: 0,
                data: {}
            };
            try {


                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let {where, whereObject, like, select, paginate, sort} = req.query;


                where = whereConstructor(where)
                like = whereConstructor(like)

                let query = rawQuery
                if (!query.where) {
                    query.where = {}
                }
                let find = {};
                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        query.where[key] = {[Op.like]: `%${val}%`}
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

                selectConstructor(query, select)

                if (paginate && paginate.limit && paginate.page) {
                    query.limit = paginate.limit
                    let offset = (paginate.page - 1) * paginate.limit;
                    query.offset = offset
                }

                if (sort) {
                    let order = [];
                    for (const [key, val] of Object.entries(sort)) {
                        let or_der = 'ASC'
                        if (val == -1) {
                            or_der = 'DESC'
                        } else if (val == 1) {
                            or_der = 'ASC'
                        } else {
                            or_der = val
                        }
                        order.push([key, or_der.toUpperCase()])
                    }
                    query.order = order;
                }

                console.log('APIATO ** SQL-Query', query)
                let list_of_elements = await model_.findAll(query)

                /**  Execute and process body After create new element */
                if (fOut_ && typeof (fOut_) == 'function') {
                    list_of_elements = await fOut_(list_of_elements)
                }

                response.error = {}
                response.success = true
                response.message = 'ok'
                response.code = 200
                response.data = list_of_elements
                res.status(200).json(response)

                return true;

            } catch (e) {
                response.error = e
                response.success = false
                response.message = e
                response.code = options && options.customErrorCode ? options.customErrorCode : 500
                response.data = {}
                res.status(options && options.customErrorCode ? options.customErrorCode : 500).json(response)
                throw e
            }

        }
    }
}


module.exports = apiato_sql;
