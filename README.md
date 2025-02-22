# APIATO.JS

<p align="center">
  <img src="https://github.com/leganux/apiatojs/blob/main/apiato.jpg?raw=true" width="550" title="APIATO logo">
</p>

## Table of Contents
- [APIATO.JS](#apiatojs)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
  - [Quick Start](#quick-start)
    - [Installation](#installation)
    - [Basic Setup](#basic-setup)
    - [Creating Your First API](#creating-your-first-api)
  - [Core Concepts](#core-concepts)
    - [Models and Schemas](#models-and-schemas)
    - [Validation](#validation)
    - [Query Parameters](#query-parameters)
    - [Population](#population)
  - [API Methods](#api-methods)
    - [Create Operations](#create-operations)
    - [Read Operations](#read-operations)
    - [Update Operations](#update-operations)
    - [Delete Operations](#delete-operations)
    - [Special Operations](#special-operations)
  - [Advanced Features](#advanced-features)
    - [TypeScript Support](#typescript-support)
    - [Socket.IO Integration](#socketio-integration)
    - [SQL Support](#sql-support)
  - [Examples](#examples)
    - [Basic CRUD Example](#basic-crud-example)
    - [Advanced Query Example](#advanced-query-example)
  - [Documentation](#documentation)

## Overview

APIATO.JS is a powerful CRUD API generator for Express and Mongoose that simplifies the creation of REST APIs and microservices. It provides a comprehensive solution for building standardized HTTP endpoints with enhanced querying capabilities, making API development faster and more efficient.

## Features

- 🚀 Quick and easy CRUD operations setup
- 🔍 Advanced query capabilities
- 📦 Flexible data filtering and searching
- 📄 Pagination support
- 🔗 Field selection and population
- 🔄 Sorting functionality
- 💾 SQL and NoSQL database support
- 🔌 Socket.IO real-time communication
- 📝 TypeScript integration
- ✅ Comprehensive validation system

## Quick Start

### Installation

```bash
npm install apiato
```

### Basic Setup

```javascript
const express = require("express");
const mongoose = require("mongoose");
const apiato = require('apiato');

// Express setup
const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/apiator");

// Initialize APIATO
const api = new apiato();
```

### Creating Your First API

```javascript
// Define your model
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    age: Number
});

const UserModel = mongoose.model("User", userSchema);

// Define validation
const validation = {
    name: 'string,mandatory',
    email: 'string,mandatory',
    age: 'number'
};

// Create API endpoints
app.post('/api/user', api.createOne(UserModel, validation));
app.get('/api/users', api.getMany(UserModel));
app.get('/api/user/:id', api.getOneById(UserModel));
app.put('/api/user/:id', api.updateById(UserModel, validation));
app.delete('/api/user/:id', api.findIdAndDelete(UserModel));
```

## Core Concepts

### Models and Schemas

APIATO works with Mongoose models for MongoDB and Sequelize models for SQL databases. Define your data structure using schemas:

```javascript
const schema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true },
    age: Number,
    active: { type: Boolean, default: true }
});
```

### Validation

Built-in validation system supports various data types and rules:

```javascript
const validation = {
    name: 'string,mandatory',
    email: 'string,mandatory',
    age: 'number,mandatory',
    active: 'boolean'
};
```

### Query Parameters

Powerful query parameters for filtering, sorting, and pagination:

```javascript
// Filter by exact match
GET /api/users?where[age]=25

// Search with LIKE
GET /api/users?like[name]=john

// Pagination
GET /api/users?paginate[page]=1&paginate[limit]=10

// Sorting
GET /api/users?sort[name]=ASC&sort[age]=DESC

// Field selection
GET /api/users?select[name]=1&select[email]=1
```

### Population

Easily populate related documents:

```javascript
const populationConfig = {
    posts: PostModel,
    comments: CommentModel
};

app.get('/api/users', api.getMany(UserModel, populationConfig));
```

## API Methods

APIATO provides a comprehensive set of API methods. For detailed documentation of each method, see the examples below and refer to our method-specific guides.

### Create Operations
- `createOne`: Create a single document
- `createMany`: Create multiple documents

### Read Operations
- `getMany`: Retrieve multiple documents
- `getOneById`: Get document by ID
- `getOneWhere`: Get document by query

### Update Operations
- `findUpdateOrCreate`: Update or create if not found
- `findUpdate`: Update existing document
- `updateById`: Update document by ID

### Delete Operations
- `findIdAndDelete`: Delete document by ID

### Special Operations
- `datatable`: Support for mongoose-datatables
- `datatable_aggregate`: Aggregation pipeline with datatable format
- `aggregate`: Custom aggregation queries

## Advanced Features

### TypeScript Support
APIATO provides full TypeScript support with comprehensive type definitions. [View TypeScript Documentation](README_TYPESCRIPT.md)

### Socket.IO Integration
Real-time bidirectional communication support using Socket.IO. [View Socket.IO Documentation](README_SOCKET_IO.md)

### SQL Support
APIATO supports SQL databases through Sequelize:

```javascript
const { ApiatoSQL } = require('apiato/sql');
const apiato = new ApiatoSQL('_id');

app.post('/api/user', apiato.createOne(UserModel, validation));
```

## Examples

### Basic CRUD Example

```javascript
const express = require("express");
const mongoose = require("mongoose");
const apiato = require('apiato');

const app = express();
app.use(express.json());

const UserModel = mongoose.model("User", {
    name: String,
    email: String
});

const api = new apiato();

app.post('/api/user', api.createOne(UserModel, {
    name: 'string,mandatory',
    email: 'string,mandatory'
}));

app.get('/api/users', api.getMany(UserModel));
app.get('/api/user/:id', api.getOneById(UserModel));
app.put('/api/user/:id', api.updateById(UserModel));
app.delete('/api/user/:id', api.findIdAndDelete(UserModel));

app.listen(3000);
```

### Advanced Query Example

```javascript
// Get active users, aged 18+, sorted by name
GET /api/users?where[active]=true&where[age][$gte]=18&sort[name]=ASC

// Search users with pagination and field selection
GET /api/users?like[name]=john&paginate[page]=1&paginate[limit]=10&select[name]=1&select[email]=1

// Populate related documents
GET /api/users?populate[posts]=1&populate[comments]=1
```

## Documentation

For detailed documentation on specific features:

- [TypeScript Integration Guide](README_TYPESCRIPT.md)
- [Socket.IO Implementation Guide](README_SOCKET_IO.md)

<p align="center">
    <img src="https://leganux.net/images/circullogo.png" width="100" title="Leganux Logo">
    <br>
    APIATO is a project by <a href="https://leganux.net">leganux.net</a> © 2021 all rights reserved
    <br>
    This project is distributed under the MIT license.
    <br>
    Special thanks to Marlon Calderon for his contribution to this development.
    <br><br>
    The APIATO name and logo are inspired by AVIATO, the fictional company from HBO's Silicon Valley series. This inspiration is for entertainment purposes only. All rights for the original name and logo belong to their creators.
</p>
