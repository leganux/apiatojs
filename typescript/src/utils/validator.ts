import moment from 'moment';
import { ValidationResponse, ValidationObject } from '../types';

/**
 * The format validation for dates
 */
const DATEVALIDATIONFORMAT = 'YYYY-MM-DDTHH:mm:ssZ';

/**
 * The format validation for links
 */
const URL_REGEX = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

export const validator = {
    /** 
     * This function allows you to validate a JSON Object
     * @param obj - object to validate
     * @param params - the params and characteristics 
     * @param isPost - if true, checks for mandatory fields
     */
    validateObject: (obj: any, params: ValidationObject, isPost?: boolean): ValidationResponse => {
        const response: ValidationResponse = {
            success: true,
            messages: []
        };

        if (!obj) {
            response.success = false;
            response.messages.push('Undefined Object');
            return response;
        }

        if (!params) {
            response.success = false;
            response.messages.push('There are no params defined');
            return response;
        }

        for (const [key, value] of Object.entries(params)) {
            const validations: string[] = typeof value === 'string' ? value.split(',') : value;

            if (isPost) {
                if (!obj[key] && validations.includes('mandatory')) {
                    // Check if the data type is not boolean, because booleans with false value also enter this condition
                    if (typeof obj[key] !== 'boolean' && obj[key] !== 0) {
                        response.success = false;
                        response.messages.push(`The parameter ${key} is missing`);
                    }
                }
            }

            if (obj[key] !== undefined) {
                if (validations.includes('number')) {
                    obj[key] = Number(obj[key]);
                    if (typeof obj[key] !== 'number' || isNaN(obj[key])) {
                        response.success = false;
                        response.messages.push(`The parameter ${key} is not a number`);
                    }
                }

                if (validations.includes('string') && typeof obj[key] !== 'string') {
                    response.success = false;
                    response.messages.push(`The parameter ${key} is not a string`);
                }

                if (validations.includes('boolean')) {
                    try {
                        obj[key] = typeof obj[key] === 'string' ? eval(obj[key]) : obj[key];
                        if (typeof obj[key] !== 'boolean') {
                            response.success = false;
                            response.messages.push(`The parameter ${key} is not a boolean`);
                        }
                    } catch (e) {
                        response.success = false;
                        response.messages.push(`The parameter ${key} is not a valid boolean`);
                    }
                }

                if (validations.includes('array') && (!Array.isArray(obj[key]))) {
                    response.success = false;
                    response.messages.push(`The parameter ${key} is not an array`);
                }

                if (validations.includes('object') && (typeof obj[key] !== 'object' || Array.isArray(obj[key]) || obj[key] === null)) {
                    response.success = false;
                    response.messages.push(`The parameter ${key} is not an object`);
                }

                if (validations.includes('function') && typeof obj[key] !== 'function') {
                    response.success = false;
                    response.messages.push(`The parameter ${key} is not a function`);
                }

                if (validations.includes('date') && typeof obj[key] === 'string' && !moment(obj[key], DATEVALIDATIONFORMAT, true).isValid()) {
                    response.success = false;
                    response.messages.push(`The parameter ${key} has not a valid date format`);
                }

                if (validations.includes('url') && (typeof obj[key] !== 'string' || !URL_REGEX.test(obj[key]))) {
                    response.success = false;
                    response.messages.push(`The parameter ${key} is not a valid url`);
                }
            }
        }

        return response;
    },

    /** 
     * This function validates array objects
     * @param array - the object to validate
     * @param validateIfEmpty - if true verifies that it's not empty
     */
    validateArray: (array: any, validateIfEmpty?: boolean): ValidationResponse => {
        const response: ValidationResponse = {
            success: true,
            messages: []
        };

        if (!array) {
            response.success = false;
            response.messages.push('The array is undefined');
            return response;
        }

        if (!Array.isArray(array)) {
            response.success = false;
            response.messages.push(`The object is not an array, it is a ${typeof array}`);
            return response;
        }

        if (validateIfEmpty && array.length === 0) {
            response.success = false;
            response.messages.push('The array is empty');
        }

        return response;
    }
};

export default validator;
