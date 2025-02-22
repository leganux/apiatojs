import { Router } from 'express';
import { ApiatoSQL } from 'apiato-typescript';
import User from '../models/User';

const router = Router();
const apiato = new ApiatoSQL('id', { hideLogo: true });

// Validation schema for User model
const userValidation = {
    name: {
        type: 'string',
        required: true
    },
    email: {
        type: 'string',
        required: true,
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    age: {
        type: 'number',
        required: true,
        min: 0
    }
};

// Population object (empty since we don't have any relations yet)
const populationObject = {};

// Create a new user
router.post('/', apiato.createOne(User, userValidation, populationObject));

// Get all users
router.get('/', apiato.getMany(User, populationObject));

// Get user by ID
router.get('/:id', apiato.getOneById(User, populationObject));

// Update user by ID
router.put('/:id', apiato.updateById(User, userValidation, populationObject));

// Delete user by ID
router.delete('/:id', apiato.findIdAndDelete(User));

// Get users with datatable format
router.post('/datatable', apiato.datatable_aggregate(
    User,
    populationObject,
    ['name', 'email'], // searchable fields
    { search_by_field: true }
));

export default router;
