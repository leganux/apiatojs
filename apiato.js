/**
 *  ** APIATO **
 *
 * A simple API basic generator for expressjs and mongoose to easy implement Rest API´s
 * quering by front end or API gateway
 */

'use strict'


let moment = require('moment');
let objectValidatorHelper = require('./validator')
let mongoose = require('mongoose');
let ObjectId = mongoose.Types.ObjectId


/** This function helps  to create and return population in mongoose */
let populateConstructor = function (query, populate, populationObject) {
    /** Fragmento que busca y construye el objeto de retorno  populado*/

    //console.log('POPULATION!!!!', populate, populationObject)

    if (populate && populationObject) {
        if ((typeof populate == "boolean" || typeof populate == "number" || typeof populate == "string") && (Boolean(populate) == true || populate == 1)) {
            for (let [key, value] of Object.entries(populationObject)) {
                query.populate({
                    path: key,
                    model: value
                })
            }
        }
        if (typeof populate == "object") {
            for (let [key, value] of Object.entries(populate)) {
                if (value && populationObject[key]) {
                    query.populate({
                        path: key,
                        model: populationObject[key]
                    })
                }

            }
        }
    }
    return query
}

/** This function helps  to create and return seelct fields in mongoose */
let selectConstructor = function (query, select) {
    /** Fragmento que busca y construye el objeto de retorno  select*/
    if (select) {
        let ob = {}
        if (typeof select == 'string') {
            select = select.split(',')
            select.map(function (item, i) {
                ob[item] = 1
            });
        } else if (typeof select == 'object') {
            for (const [key, val] of Object.entries(select)) {
                ob[key] = Number(val);
            }
        }

        query.select(ob)
    }

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
let apiato = function (options) {

    if(!options?.hideLogo){
        console.log(`
     __   ____  __   __  ____  __       __  ____ 
 / _\\ (  _ \\(  ) / _\\(_  _)/  \\    _(  )/ ___)
/    \\ ) __/ )( /    \\ )( (  O )_ / \\) \\\\___ \\
\\_/\\_/(__)  (__)\\_/\\_/(__) \\__/(_)\\____/(____/
                        (c) leganux.net 2021-2022  v1.1.7
`)
    }


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

                let newElement = new model_(body);
                newElement = await newElement.save();

                let query = model_.findById(newElement._id)
                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)
                newElement = await query.exec()

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

                let newElement = await model_.insertMany(correct);
                newElement = newElement.map(item => {
                    return item._id
                })
                let query = model_.find({_id: {$in: newElement}})
                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)
                newElement = await query.exec()

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

                let mongooseOptions = {}

                if (options?.mongooseOptions) {
                    mongooseOptions = options?.mongooseOptions
                }

                let find = {};
                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        find[key] = {$regex: String(val).trim(), $options: 'i'};
                    }
                }
                if (where) {
                    for (const [key, val] of Object.entries(where)) {
                        find[key] = val;
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        find[key] = ObjectId(val);
                    }
                }

                let query = model_.find(find);


                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)

                if (paginate && paginate.limit && paginate.page) {
                    paginate.limit = Number(paginate.limit);
                    paginate.page = Number(paginate.page);
                    query.limit(paginate.limit).skip(paginate.page * paginate.limit);
                }
                if (sort) {
                    let order = {};
                    for (const [key, val] of Object.entries(sort)) {
                        order[key] = val;
                    }
                    query.sort(order);
                }


                let list_of_elements = await query.exec()

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


                let mongooseOptions = {}

                if (options?.mongooseOptions) {
                    mongooseOptions = options?.mongooseOptions
                }

                let query = model_.findById(id, mongooseOptions)
                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)
                let newElement = await query.exec()

                if (!newElement) {
                    response.error = '404 not found'
                    response.success = false
                    response.message = validation.messages.join(', ')
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

                let {where, like, whereObject, select, populate} = req.query;

                where = whereConstructor(where)
                like = whereConstructor(like)


                let find = {};
                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        find[key] = {$regex: String(val).trim(), $options: 'i'};
                    }
                }

                if (where) {
                    for (const [key, val] of Object.entries(where)) {
                        find[key] = val;
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        find[key] = ObjectId(String(val).trim());
                    }
                }

                let mongooseOptions = {}

                if (options?.mongooseOptions) {
                    mongooseOptions = options?.mongooseOptions
                }


                let query = model_.findOne(find, mongooseOptions);

                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)

                let newElement = await query.exec()

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


                let mongooseOptions = {}

                if (options?.mongooseOptions) {
                    mongooseOptions = options?.mongooseOptions
                }

                let find = {};


                if (where) {
                    for (const [key, val] of Object.entries(where)) {
                        find[key] = val;
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        find[key] = ObjectId(String(val).trim());
                    }
                }


                let newElement = await model_.findOne(find, mongooseOptions);
                if (!newElement) {
                    newElement = new model_(find);
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

                for (let [key, value] of Object.entries(data)) {
                    newElement[key] = value
                }

                if (options?.updateFieldName) {
                    newElement[updateFieldName] = moment().format()
                }

                newElement = await newElement.save();

                let query = model_.findById(newElement._id, mongooseOptions)
                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)
                newElement = await query.exec()


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


                let mongooseOptions = {}

                if (options?.mongooseOptions) {
                    mongooseOptions = options?.mongooseOptions
                }

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
                        find[key] = {$regex: String(val).trim(), $options: 'i'};
                    }
                }
                if (where) {
                    for (const [key, val] of Object.entries(where)) {
                        find[key] = val;
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        find[key] = ObjectId(val);
                    }
                }

                let newElement = await model_.findOne(find, mongooseOptions);
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

                if (options?.updateFieldName) {
                    newElement[updateFieldName] = moment().format()
                }

                newElement = await newElement.save();

                let query = model_.findById(newElement._id, mongooseOptions)
                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)
                newElement = await query.exec()


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


                let mongooseOptions = {}

                if (options?.mongooseOptions) {
                    mongooseOptions = options?.mongooseOptions
                }

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

                if (options?.updateFieldName) {
                    body[updateFieldName] = moment().format()
                }

                let element = await model_.findByIdAndUpdate(id, {$set: body}, mongooseOptions);

                if (!element) {
                    response.error = '404 not found'
                    response.success = false
                    response.message = validation.messages.join(', ')
                    response.code = options && options.customNotFoundCode ? options.customNotFoundCode : 404
                    response.data = {}
                    res.status(options && options.customNotFoundCode ? options.customNotFoundCode : 404).json(response)
                    return false
                }


                let query = model_.findById(element._id, mongooseOptions)
                populateConstructor(query, populate, populationObject)
                selectConstructor(query, select)
                let newElement = await query.exec()

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

                let newElement = await model_.findByIdAndRemove(id);

                if (!newElement) {
                    response.error = '404 not found'
                    response.success = false
                    response.message = '404 not found'
                    response.code = options && options.customNotFoundCode ? options.customNotFoundCode : 404
                    response.data = {}
                    res.status(options && options.customNotFoundCode ? options.customNotFoundCode : 404).json(response)
                    return false
                }

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

    /** This function helps  to manage content using  mongoose-datatables-fork */

    this.datatable = function (model_, populationObject, search_fields, fIn_, fOut_) {

        return async function (req, res) {
            try {

                console.log('BODY ', JSON.stringify(req.body))
                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let {populate} = req.query

                let order = {};
                if (req.body.columns && req.body.order) {
                    req.body.order.map((item, i) => {
                        let name = req.body.columns[item.column].data;
                        let dir = item.dir;
                        order[name] = dir;
                    });
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


                let find = {};
                if (req.body && req.body.filter && typeof (req.body.filter) == 'object') {
                    for (let [key, value] of Object.entries(req.body.filter)) {
                        if (value && value !== '-1') {
                            find[key] = value
                        }
                    }
                }

                let objPopulate = []

                if (populate) {
                    if (typeof populate == "boolean" || populate == "true" || populate == 1) {
                        console.log('a')
                        for (let [key, value] of Object.entries(populationObject)) {
                            objPopulate.push(
                                key
                            )
                        }
                    }
                    if (typeof populate == "object") {
                        console.log('b')
                        for (let [key, value] of Object.entries(populate)) {
                            if (value && populationObject[key]) {
                                objPopulate.push(
                                    key
                                )
                            }

                        }
                    }
                } else {
                    objPopulate = false
                }


                model_.dataTables({
                    limit: req.body.length,
                    skip: req.body.start,
                    search: {
                        value: req.body.search.value,
                        fields: fields
                    },
                    sort: order,
                    populate: objPopulate,
                    find
                }).then(async function (table) {
                    table.success = true;
                    table.message = 'OK';
                    table.recordsTotal = table.total
                    table.recordsFiltered = table.total

                    if (fOut_ && typeof (fOut_) == 'function') {
                        table = await fOut_(table)
                    }
                    res.status(200).json(table);  // table.total, table.data
                }).catch(async function (e) {
                    throw e
                })
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


    /** This function helps  to get datable data format  using an agreggation */
    this.datatable_aggregate = function (model_, pipeline_ = [], search_fields, options = {
        allowDiskUse: true,
        search_by_field: false
    }, fIn_, fOut_)
    {


        return async function (req, res) {

            let pipeline2 = []
            let pipeline = [...pipeline_]

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
                    let res_ = await fIn_(req, pipeline)
                    req = res_.req
                    pipeline = res_.pipeline
                }

                let {where, whereObject, like} = req.body


                let order = {};
                let search_columns_or = []

                if (req.body.columns && req.body.order) {
                    for (let item of req.body.order) {
                        let name = req.body.columns[item.column].data;
                        let search = (req.body.columns[item.column]?.search?.value) || '';
                        let dir = item.dir;
                        order[name] = dir.toUpperCase() == 'DESC' ? -1 : 1;

                        if (search !== "" && options.search_by_field) {
                            let inner = {}
                            inner[name] = {$regex: search, $options: 'i'}
                            search_columns_or.push(inner)
                        }
                    }
                }

                if (options.search_by_field) {
                    pipeline.push({
                        $match: {$or: search_columns_or}
                    })
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
                    let or = []
                    for (let item of fields) {
                        let inner = {}
                        if (isNaN(Number(body?.search?.value))) {
                            inner[item] = {$regex: body?.search?.value, $options: 'i'}
                        } else {
                            inner[item] = Number(body?.search?.value)
                        }
                        or.push(inner)
                    }
                    pipeline.push({
                        $match: {$or: or}
                    })
                }

                let find = {};
                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        find[key] = {$regex: String(val).trim(), $options: 'i'};
                    }
                }
                if (where) {
                    for (const [key, val] of Object.entries(where)) {
                        find[key] = val;
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        find[key] = ObjectId(val);
                    }
                }

                pipeline.push({
                    $match: find
                })


                let table = await model_.aggregate(pipeline).allowDiskUse(options.allowDiskUse)
                let total = table.length
                console.log('total', total)

                pipeline2 = [...pipeline]

                pipeline2.push({
                    $skip: Number(body?.start || 0)
                })
                pipeline2.push({
                    $limit: Number(body?.length || 0)
                })

                pipeline2.push({
                    $sort: order
                })


                let table2 = await model_.aggregate(pipeline2).allowDiskUse(options.allowDiskUse)


                response.data = table2
                response.recordsTotal = total
                response.recordsFiltered = total
                response.total = total

                if (fOut_ && typeof (fOut_) == 'function') {
                    response = await fOut_(response)
                }

                console.log('Pipeline', JSON.stringify(pipeline2))
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
}


module.exports = apiato;
