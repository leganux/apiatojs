/**
 * V1.0 Erick Cruz & Marlon Calderon
 * Helper library that allows easy implement validation of parameters in body that comes from front end
 */

const moment = require('moment')

/**
 * The format validatin for dates
 */
const DATEVALIDATIONFORMAT = 'YYYY-MM-DDTHH:mm:ssZ'

/**
 * The format validation for links
 */
const URL_REGEX = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/

module.exports = {

    /** This functions allows you to validate a JSON Object
     * obj =  object to validate
     * params= the params and characteristics 
     */
    validateObject: function (obj, params, isPost) {
        let response = {
            success: true,
            messages: []
        };
        if (!obj) {
            response.success = false;
            response.messages.push('Undefined Object');
        }
        if (!params) {
            response.success = false;
            response.messages.push('There are no  params defined');
        }

        for (var [key, value] of Object.entries(params)) {

            if (value && typeof (value) == 'string') {
                value = value.split(',')
            }
            if (isPost) {
                if (!obj[key] && value.includes('mandatory')) {
                    // Evaluar si el tipo de dato no es booleano, por que los booleanos en false también entran a esta condición
                    if (typeof obj[key] !== 'boolean' && obj[key] !== 0) {
                        response.success = false;
                        response.messages.push('The parameter ' + key + ' is missing');
                    }
                }
            }


            if (obj[key] && value.includes('number')) {
                obj[key] = Number(obj[key])
                if (typeof (obj[key]) !== 'number') {
                    response.success = false;
                    response.messages.push('The parameter ' + key + ' is not a number');
                }
            }
            if (obj[key] && value.includes('string') && typeof (obj[key]) !== 'string') {
                response.success = false;
                response.messages.push('The parameter ' + key + ' is not a string');
            }

            if (obj[key] && value.includes('boolean')) {
                obj[key] = eval(obj[key])
                if (typeof (obj[key]) !== 'boolean') {
                    response.success = false;
                    response.messages.push('The parameter ' + key + ' is not a bolean');
                }

            }

            if (obj[key] && value.includes('array') && (typeof (obj[key]) !== 'object' || !Array.isArray(obj[key]))) {
                response.success = false;
                response.messages.push('The parameter ' + key + ' is not an array ');
            }

            if (obj[key] && value.includes('object') && typeof (obj[key]) !== 'object') {
                response.success = false;
                response.messages.push('The parameter ' + key + ' is not an object');
            }

            if (obj[key] && value.includes('function') && typeof (obj[key]) !== 'function') {
                response.success = false;
                response.messages.push('The parameter ' + key + ' is not a function');
            }

            if (obj[key] && value.includes('date') && typeof (obj[key]) === 'string' && !moment(obj[key], DATEVALIDATIONFORMAT, true).isValid()) {
                response.success = false;
                response.messages.push('The parameter ' + key + ' has not a valid date format')
            }

            if (obj[key] && value.includes('url') && typeof (obj[key] !== 'string') && !URL_REGEX.test(obj[key])) {
                response.success = false
                response.messages.push('The parameter' + key + 'is not a valid url')
            }
        }

        return response;
    },

    /** Esta funcion valida objetos de tipo array
     * array =  el objeto a validar
     * valideIfEmpty= si es verdadero verificara que no este vacio
     */
    validateArray: function (array, validateIfEmpty) {
        let response = {
            success: true,
            messages: []
        }
        if (!array) {
            response.success = false;
            response.messages.push('The array is undefined')
        }

        if (array && (typeof (array) !== 'object' || !Array.isArray(array))) {
            response.success = false;
            response.messages.push('The object is not an array is a ', typeof (array));
        }
        if (array && Array.isArray(array) && validateIfEmpty) {
            if (array.length == 0) {
                response.success = false;
                response.messages.push('The array is empty');
            }
        }
        return response;
    }
}