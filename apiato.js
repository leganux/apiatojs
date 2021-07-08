/**
 *  ** APIATO **
 *
 * A simple API basic generator for expressjs and mongoose to easy implement Rest API´s
 * quering by front end or API gateway
 */

'use strict'




let moment = require('moment');
let objectValidatorHelper = require('./validator')
var mongoose = require('mongoose');
let ObjectId = mongoose.Types.ObjectId


/** This function helps  to create and return population in mongoose */
let populateConstructor = function (query, populate, populationObject) {
    /** Fragmento que busca y construye el objeto de retorno  populado*/

    //console.log('POPULATION!!!!', populate, populationObject)

    if (populate && populationObject) {
        if ((typeof populate == "boolean" || typeof populate == "number") && eval(populate) == true) {
            for (var [key, value] of Object.entries(populationObject)) {
                query.populate({
                    path: key,
                    model: value
                })
            }
        }
        if (typeof populate == "object") {
            for (var [key, value] of Object.entries(populate)) {
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

/** Here we define the apiato constructor */
let apiato = function (options) {

    /** This function helps  to create  a new element in model*/
    this.createOne = function (model_, validationObject, populationObject, options, fIn_, fOut_) {
        return async function (req, res) {
            try {

                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let { body } = req;
                let { populate, select } = req.query;

                var response = {
                    error: '',
                    success: false,
                    message: '',
                    code: 0,
                    data: {}
                };

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
            try {

                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let { body } = req;
                let { populate, select } = req.query;

                var response = {
                    error: '',
                    success: false,
                    message: '',
                    code: 0,
                    data: {}
                };

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
                newElement = newElement.map(item => { return item._id })
                let query = model_.find({ _id: { $in: newElement } })
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
            try {


                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let { where, whereObject, like, select, paginate, sort, populate } = req.query;


                var response = {
                    error: '',
                    success: false,
                    message: '',
                    code: 0,
                    data: {}
                };

                let mongooseOptions = {}

                if (options?.mongooseOptions) {
                    mongooseOptions = options?.mongooseOptions
                }

                var find = {};
                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        find[key] = { $regex: val.trim(), $options: 'i' };
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
            try {

                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let { id } = req.params;
                let { populate, select } = req.query;

                var response = {
                    error: '',
                    success: false,
                    message: '',
                    code: 0,
                    data: {}
                };

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
        return async function (req, res) {
            try {

                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let { where, like, whereObject, select, populate } = req.query;

                var response = {};

                var find = {};
                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        find[key] = { $regex: val.trim(), $options: 'i' };
                    }
                }

                if (where) {
                    for (const [key, val] of Object.entries(where)) {
                        find[key] = val.trim();
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        find[key] = ObjectId(val.trim());
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
            try {

                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let data = req.body;
                let { populate, select, where, whereObject } = req.query;

                var response = {
                    error: '',
                    success: false,
                    message: '',
                    code: 0,
                    data: {}
                };

                let mongooseOptions = {}

                if (options?.mongooseOptions) {
                    mongooseOptions = options?.mongooseOptions
                }

                var find = {};


                if (where) {
                    for (const [key, val] of Object.entries(where)) {
                        find[key] = val.trim();
                    }
                }
                if (whereObject) {
                    for (const [key, val] of Object.entries(whereObject)) {
                        find[key] = ObjectId(val.trim());
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

                for (var [key, value] of Object.entries(data)) {
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
            try {

                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let data = req.body;
                let { populate, select, where, whereObject, like } = req.query;

                var response = {
                    error: '',
                    success: false,
                    message: '',
                    code: 0,
                    data: {}
                };

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

                var find = {};
                if (like) {
                    for (const [key, val] of Object.entries(like)) {
                        find[key] = { $regex: val.trim(), $options: 'i' };
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

                for (var [key, value] of Object.entries(data)) {
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

            try {
                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let { params, body } = req;
                let { id } = params;
                let { populate, select } = req.query;

                var response = {
                    error: '',
                    success: false,
                    message: '',
                    code: 0,
                    data: {}
                };

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

                let element = await model_.findByIdAndUpdate(id, { $set: body }, mongooseOptions);

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
            try {
                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                var id = req.params.id;
                var response = {
                    error: '',
                    success: false,
                    message: '',
                    code: 0,
                    data: {}
                };
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

                /**  Execute and process body before create new element */
                if (fIn_ && typeof (fIn_) == 'function') {
                    req = await fIn_(req)
                }

                let { populate } = req.query

                var order = {};
                if (req.body.columns && req.body.order) {
                    req.body.order.map((item, i) => {
                        var name = req.body.columns[item.column].data;
                        var dir = item.dir;
                        order[name] = dir;
                    });
                }
                var fields = []
                if (search_fields) {
                    if (typeof search_fields == 'string' && search_fields != '') {
                        fields = search_fields.split(',')
                    }
                    if (typeof search_fields == "object" && Array.isArray(search_fields)) {
                        fields = search_fields
                    }
                }


                var find = {};
                if (req.body && req.body.filter && typeof (req.body.filter) == 'object') {
                    for (var [key, value] of Object.entries(req.body.filter)) {
                        if (value && value !== '-1') {
                            find[key] = value
                        }
                    }
                }

                let objPopulate = {}
                if (populate) {
                    if (typeof populate == "boolean") {
                        for (var [key, value] of Object.entries(populationObject)) {
                            objPopulate.push({
                                path: key,
                                model: value
                            })
                        }
                    }
                    if (typeof populate == "object") {
                        for (var [key, value] of Object.entries(populate)) {
                            if (value && populationObject[key]) {
                                objPopulate.push({
                                    path: key,
                                    model: populationObject[key]
                                })
                            }

                        }
                    }
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
