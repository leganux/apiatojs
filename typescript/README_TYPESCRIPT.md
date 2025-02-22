# APIATO TypeScript Documentation

<p align="center">
  <img src="https://github.com/leganux/apiatojs/blob/main/apiato.jpg?raw=true" width="550" title="APIATO logo">
</p>

## Table of Contents
- [APIATO TypeScript Documentation](#apiato-typescript-documentation)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Basic Setup](#basic-setup)
    - [Express Configuration](#express-configuration)
    - [MongoDB Setup](#mongodb-setup)
    - [Model Creation](#model-creation)
  - [CRUD Operations](#crud-operations)
    - [Create Operations](#create-operations)
    - [Read Operations](#read-operations)
    - [Update Operations](#update-operations)
    - [Delete Operations](#delete-operations)
  - [SQL Support](#sql-support)
  - [Type Definitions](#type-definitions)
  - [Examples](#examples)
    - [Complete CRUD Example](#complete-crud-example)
    - [Validation Example](#validation-example)

## Installation

```bash
npm install @apiatojs/typescript
```

## Basic Setup

### Express Configuration

```typescript
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { Apiato } from '@apiatojs/typescript/no-sql';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.listen(3000, () => {
    console.log("Server started on port 3000");
});
```

### MongoDB Setup

```typescript
import mongoose from 'mongoose';

const uri = "mongodb://localhost:27017/apiator";
mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true });

mongoose.connection.once("open", () => {
    console.log("MongoDB connection established successfully");
});
```

### Model Creation

```typescript
import { Schema, model } from 'mongoose';

// Define interface for your model
interface IEmployee {
    name: string;
    age: number;
    location?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Create schema with TypeScript types
const employeeSchema = new Schema<IEmployee>({
    name: { 
        type: String,
        required: true
    },
    age: { 
        type: Number,
        required: true
    },
    location: String,
}, {
    timestamps: true
});

// Create model with TypeScript interface
const EmployeeModel = model<IEmployee>('Employee', employeeSchema);

// Define validation object with TypeScript
const employeeValidation = {
    name: 'string,mandatory',
    age: 'number,mandatory',
    location: 'string'
};
```

## CRUD Operations

### Create Operations

```typescript
import { Apiato } from '@apiatojs/typescript/no-sql';

const apiato = new Apiato();

// Define types for configuration objects
interface PopulationConfig {
    [key: string]: any;
}

interface Options {
    customValidationCode?: number;
    customErrorCode?: number;
    customNotFoundCode?: number;
    mongooseOptions?: mongoose.QueryOptions;
}

const populationConfig: PopulationConfig = {};
const options: Options = {
    customValidationCode: 400,
    mongooseOptions: { new: true }
};

// Create routes with TypeScript
app.post('/api/employee', 
    apiato.createOne(EmployeeModel, employeeValidation, populationConfig, options)
);

app.post('/api/employees', 
    apiato.createMany(EmployeeModel, employeeValidation, populationConfig, options)
);
```

### Read Operations

```typescript
// Get many with TypeScript types
interface QueryParams {
    where?: Record<string, any>;
    like?: Record<string, any>;
    paginate?: {
        page: number;
        limit: number;
    };
    sort?: Record<string, 'ASC' | 'DESC'>;
    select?: Record<string, 1 | 0>;
}

app.get('/api/employees', apiato.getMany(EmployeeModel, populationConfig, options));
app.get('/api/employee/:id', apiato.getOneById(EmployeeModel, populationConfig, options));
app.get('/api/employee', apiato.getOneWhere(EmployeeModel, populationConfig, options));
```

### Update Operations

```typescript
app.put('/api/employee/find-update-create', 
    apiato.findUpdateOrCreate(EmployeeModel, employeeValidation, populationConfig, options)
);

app.put('/api/employee/:id',
    apiato.updateById(EmployeeModel, employeeValidation, populationConfig, options)
);

app.put('/api/employee',
    apiato.findUpdate(EmployeeModel, employeeValidation, populationConfig, options)
);
```

### Delete Operations

```typescript
app.delete('/api/employee/:id',
    apiato.findIdAndDelete(EmployeeModel, options)
);
```

## SQL Support

APIATO provides TypeScript support for SQL databases using Sequelize:

```typescript
import { Sequelize, DataTypes, Model } from 'sequelize';
import { ApiatoSQL } from '@apiatojs/typescript/sql';

// Define model interface
interface UserAttributes {
    _id: string;
    username: string;
    email: string;
    active: boolean;
}

// Define model with TypeScript
class User extends Model<UserAttributes> implements UserAttributes {
    public _id!: string;
    public username!: string;
    public email!: string;
    public active!: boolean;
}

// Initialize Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});

// Define model
User.init({
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    sequelize,
    modelName: 'User'
});

// Initialize APIATO SQL
const apiato = new ApiatoSQL('_id');

// Define routes with TypeScript
app.post('/api/user', apiato.createOne(User, validationObject, populationConfig, options));
app.get('/api/user', apiato.getMany(User, populationConfig, options));
```

## Type Definitions

APIATO provides comprehensive TypeScript definitions:

```typescript
// Request Parameters
interface RequestParams {
    body?: any;
    query?: {
        where?: Record<string, any>;
        whereObject?: Record<string, any>;
        like?: Record<string, any>;
        paginate?: {
            page: number;
            limit: number;
        };
        sort?: Record<string, 'ASC' | 'DESC'>;
        select?: Record<string, 1 | 0>;
        populate?: Record<string, 1 | 0>;
    };
}

// Response Format
interface ApiResponse<T> {
    error: any;
    success: boolean;
    message: string;
    code: number;
    data: T;
}

// Validation Schema
interface ValidationSchema {
    [key: string]: string;
}

// Population Configuration
interface PopulationConfig {
    [key: string]: any;
}

// Options Configuration
interface Options {
    customValidationCode?: number;
    customErrorCode?: number;
    customNotFoundCode?: number;
    mongooseOptions?: mongoose.QueryOptions;
}
```

## Examples

### Complete CRUD Example

```typescript
import express from 'express';
import { Apiato } from '@apiatojs/typescript/no-sql';
import { Schema, model } from 'mongoose';

// Define interfaces
interface IUser {
    name: string;
    email: string;
    age: number;
    active: boolean;
}

interface IUserModel extends IUser, Document {}

// Define schema
const userSchema = new Schema<IUserModel>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, required: true },
    active: { type: Boolean, default: true }
});

// Create model
const UserModel = model<IUserModel>('User', userSchema);

// Initialize APIATO
const apiato = new Apiato();

// Define validation
const userValidation = {
    name: 'string,mandatory',
    email: 'string,mandatory',
    age: 'number,mandatory',
    active: 'boolean'
};

// Define routes
const app = express();

app.post('/api/user', apiato.createOne(UserModel, userValidation));
app.get('/api/users', apiato.getMany(UserModel));
app.get('/api/user/:id', apiato.getOneById(UserModel));
app.put('/api/user/:id', apiato.updateById(UserModel, userValidation));
app.delete('/api/user/:id', apiato.findIdAndDelete(UserModel));

app.listen(3000);
```

### Validation Example

```typescript
// Define custom validation types
type ValidationRule = 'string' | 'number' | 'boolean' | 'date' | 'mandatory';

interface ValidationOptions {
    type: ValidationRule;
    required: boolean;
    custom?: (value: any) => boolean;
}

// Create validation schema
const userValidation = {
    name: {
        type: 'string',
        required: true,
        custom: (value: string) => value.length >= 2
    },
    email: {
        type: 'string',
        required: true,
        custom: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    age: {
        type: 'number',
        required: true,
        custom: (value: number) => value >= 18
    }
};

// Use in APIATO
app.post('/api/user', apiato.createOne(UserModel, userValidation));
```

<p align="center">
    <img src="https://leganux.net/images/circullogo.png" width="100" title="Leganux Logo">
    <br>
    APIATO is a project by <a href="https://leganux.net">leganux.net</a> © 2021 all rights reserved
</p>
