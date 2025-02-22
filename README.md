# APIATO.JS

<hr>
<br>
<p align="center">
  <img src="https://github.com/leganux/apiatojs/blob/main/apiato.jpg?raw=true" width="550" title="APIATO logo">
</p>


<p align="justify">
An amazing CRUD API generator for Express and Mongoose.

Creating a rest API with Mongoose and ExpressJS has never been easier.

Thanks to APIATO you can create a REST API or a microservice for your projects in minutes and with a lot of features, in
the easiest way you can imagine.

APIATO is a helper that allows you from the ExpressJS router to create a basic CRUD based on standardized HTTP requests.

It has the main operations of a CRUD, but enhanced to the maximum, offering the possibility of strengthening your query
from the use of parameters and searches from the client.

APIATO can be easily integrated with ExpressJS. to be used in monolithic projects, microservices, or to be consumed
through a gateway.

In APIATO you can use any of the following functions independently or simultaneously.

* POST: createOne (The way to create a new item in a collection)
* POST: createMany (The way to create multiple items in a collection)
* GET: getMany (Get multiple items from a collection)
* GET: getOneById (Get an item from the collection by ID)
* GET: getOneWhere (Get an item from the collection through a search)
* PUT: findUpdateOrCreate (Find an element, and edit it; In case of not finding it, create the new element in the
  collection)
* PUT: findUpdate (Find an item and edit it in a collection)
* PUT: updateById (Find an item by ID and edit it)
* DELETE: findIdAndDelete (Find an item by ID and delete it)
* POST: datatable (support for mongoose-datatables-fork plugin)
* POST: datatable_aggregate (Call data from aggregation and returns to datatable format)

And this is not all within those functions and through parameters that can be sent mainly in the query of the URL you
can.

* Populate one or more fields
* Select the fields you want to return only
* Paginate an item
* Apply filters and searches (by objectID, value, and% LIKE%)
* Sort items and much more.

</p>
<hr>

## How to use

<br>

**Configure ExpressJS basic project**

```javascript
const express = require("express");
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.status(200).json({isAlive: true})
})

app.listen(3000, () => {
    console.log("The server started at port 3000");
});
```

**Add mongoose configuration and connect database**

```javascript
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var uri = "mongodb://localhost:27017/apiator";
mongoose.connect(uri, {useUnifiedTopology: true, useNewUrlParser: true});
const connection = mongoose.connection;
connection.once("open", function () {
    console.log("MongoDB database connection established successfully");
});
```

**Create your first model, and schema**

```javascript
let employee = new Schema(
    {
        name: {
            type: String
        },
        age: {
            type: Number
        },
        location: {
            type: String
        }
    }
);
let employeeModel = mongoose.model("employees", employee);

let employeeValidationObject = {
    name: 'string,mandatory',
    age: 'number,mandatory',
    location: 'string'
}
```

**Install APIATO**

```text
npm install apiato
```

**Install and initialize APIATO**

```javascript
//import APIATO
let apiato = require('js/no_sql/apiato')
//initialize microservice objecto for employee colection
let ms_employee = new apiato();
```

**Define routing using APIATO**

```javascript

//Populate object configuration
let populationObjectEmployee = false
//Options object configuration
let optionsEmployee = {}

// routes definition using express and APIATO

let aggregate_pipeline = []


app.post('/api/employee', ms_employee.createOne(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.post('/api/employee/many', ms_employee.createMany(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))

app.get('/api/employee/one', ms_employee.getOneWhere(employeeModel, populationObjectEmployee, optionsEmployee))
app.get('/api/employee/:id', ms_employee.getOneById(employeeModel, populationObjectEmployee, optionsEmployee))
app.get('/api/employee', ms_employee.getMany(employeeModel, populationObjectEmployee, optionsEmployee))

app.put('/api/employee/find_update_or_create', ms_employee.findUpdateOrCreate(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.put('/api/employee/find_where_and_update', ms_employee.findUpdate(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.put('/api/employee/:id', ms_employee.updateById(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))

app.delete('/api/employee/:id', ms_employee.findIdAndDelete(employeeModel, optionsEmployee))

app.post('/api/employee/datatble', ms_employee.datatable(employeeModel, populationObjectEmployee, ''))
app.post('/api/employee/dt_agr', ms_employee.datatable_aggregate(employeeModel, aggregate_pipeline, ''))

```

**Full example code**

```javascript
const express = require("express");
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const mongoose = require("mongoose");

var uri = "mongodb://localhost:27017/apiator";
mongoose.connect(uri, {useUnifiedTopology: true, useNewUrlParser: true});
const connection = mongoose.connection;
connection.once("open", function () {
    console.log("MongoDB database connection established successfully");
});
let apiato = require('js/no_sql/apiato')
let ms_employee = new apiato();
const Schema = mongoose.Schema;
let employee = new Schema(
    {
        name: {
            type: String
        },
        age: {
            type: Number
        },
        location: {
            type: String
        }
    }
);
let employeeModel = mongoose.model("employees", employee);

let employeeValidationObject = {
    name: 'string,mandatory',
    age: 'number,mandatory',
    location: 'string'
}

let populationObjectEmployee = false
let optionsEmployee = {}

app.get('/', function (req, res) {
    res.status(200).json({ok: 'ok'})
})

let aggregate_pipeline = []

app.post('/api/employee', ms_employee.createOne(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.post('/api/employee/many', ms_employee.createMany(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.get('/api/employee/one', ms_employee.getOneWhere(employeeModel, populationObjectEmployee, optionsEmployee))
app.get('/api/employee/:id', ms_employee.getOneById(employeeModel, populationObjectEmployee, optionsEmployee))
app.get('/api/employee', ms_employee.getMany(employeeModel, populationObjectEmployee, optionsEmployee))
app.put('/api/employee/find_update_or_create', ms_employee.findUpdateOrCreate(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.put('/api/employee/find_where_and_update', ms_employee.findUpdate(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.put('/api/employee/:id', ms_employee.updateById(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.delete('/api/employee/:id', ms_employee.findIdAndDelete(employeeModel, optionsEmployee))
app.post('/api/employee/datatble', ms_employee.datatable(employeeModel, populationObjectEmployee, ''))
app.post('/api/employee/dt_agr', ms_employee.datatable_aggregate(employeeModel, aggregate_pipeline, ''))
app.get('/api/employee/aggregate', ms_employee.aggregate(employeeModel, aggregate_pipeline))

app.listen(3000, () => {
    console.log("El servidor está inicializado en el puerto 3000");
});
```

**Full example code NOW FOR SQL**

```javascript
/*imports*/
const {Sequelize, DataTypes} = require("sequelize");
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    //logging: console.log,
});

const {UUIDV4} = require('sequelize');
const moment = require('moment');

/* Define model */
const User = sequelize.define('User', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true,
        field: '_id',
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'password',
        customName: 'Password',
        isPassword: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '',
        field: 'username',
        customName: 'Username',

    },
    type_user: {
        type: DataTypes.ENUM('admin', 'client'),
        allowNull: false,
        defaultValue: 'client',
        field: 'type_user',
        customName: 'Type of user',
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        field: 'name',
        customName: 'Name',
    },
    lastname: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        field: 'lastname',
        customName: 'Last name',
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '',
        field: 'email',
        customName: 'Email',
    },
    picture: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: false,
        field: 'picture',
        customName: 'Photo',
        isFile: true
    },
    cellphone: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'cellphone',
        customName: 'Cellphone',
    },
    birthdate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'birthdate',
        get() {
            const rawValue = this.getDataValue('birthdate');
            return moment(rawValue).format('YYYY-MM-DD');
        }, customName: 'Date of birth',
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'active',
        customName: 'Active',
    },
    isBanned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'isBanned',
        customName: 'Is banned',
    },
}, {
    tableName: 'users',
    timestamps: true,
});

console.log('* * * ** * * * MODELO ', User.name, User.rawAttributes)

/* Sync model */
User.sync({alter: true});


let apiato_sql = require('apiato/sql')


const express = require('express')
const app = express()
const port = 3000

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

// parse application/json
app.use(bodyParser.json());

let validationObject = {
    username: 'mandatory'
}
let populationObject = {}
let options = {}

let main = async function () {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }

    /* For betther results configure models to accept as priary key _id =UUID  */
    let apiato = new apiato_sql('_id') /* the name of id for your table or model default _id */


    app.get('/', (req, res) => {
        res.send('Hello World!')
    })

    app.post('/api/user/datatable', apiato.datatable_aggregate(User, populationObject, ''))

    app.post('/api/user', apiato.createOne(User, validationObject, populationObject, options))
    app.post('/api/user/many', apiato.createMany(User, validationObject, populationObject, options))


    app.get('/api/user/aggregate', apiato.aggregate(User, {}, options))


    app.get('/api/user/one', apiato.getOneWhere(User, populationObject, options))
    app.get('/api/user/', apiato.getMany(User, populationObject, options))
    app.get('/api/user/:id', apiato.getOneById(User, populationObject, options))


    app.put('/api/user/findUpdateOrCreate', apiato.findUpdateOrCreate(User, validationObject, populationObject, options))
    app.put('/api/user/findUpdate', apiato.findUpdate(User, validationObject, populationObject, options))
    app.put('/api/user/:id', apiato.updateById(User, validationObject, populationObject, options))
    app.delete('/api/user/:id', apiato.findIdAndDelete(User, options))


    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })

}

main()

```

<hr>

## Methods

### *POST:createOne (mongodb/SQL)

**Method Parameters**

* model(mongoose class):[mandatory] The moongose model object
* validation(Object): [optional] Object that helps you to validate body object request
* population(Objet):[optional] Object that defines wich fields you can populate and its related model
* options(Object): [optional] Object that defines some configuration for mongoose and elements requested
* fIn_(function): [optional] Async function that can be executed before process recieve and must to return Express 'res'
  object.
* fOut_(function): [optional] Async function that can be executed after process recieve and must to return mongoose
  query result.

**Request Parameters**

* body(Object): The object will be stored in collection
* query(url): Could contain the next elements
    * populate(Object): Object that defines parameters will return populated
    * select(Object):Object that defines wich parameters return. Object must be transformed to url format

**Fetch request example**

```javascript
var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
    "name": "Erlich Bachman",
    "age": 38,
    "location": "Palo Alto C.A."
});

var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
};

fetch("http://localhost:3000/api/employee/?select[name]=1&select[age]=1", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));

```

**Example fetch response**

```json
{
  "error": {},
  "success": true,
  "message": "ok",
  "code": 200,
  "data": {
    "_id": "60e14341b17c7b17a388e5a5",
    "name": "Erlich Bachman",
    "age": 38
  }
}
```

### *POST:createMany  (mongodb/SQL)

**Method Parameters**

* model(mongoose class):[mandatory] The moongose model object
* validation(Object): [optional] Object that helps you to validate body object request
* population(Objet):[optional] Object that defines wich fields you can populate and its related model
* options(Object): [optional] Object that defines some configuration for mongoose and elements requested
* fIn_(function): [optional] Async function that can be executed before process recieve and must to return Express 'res'
  object.
* fOut_(function): [optional] Async function that can be executed after process recieve and must to return mongoose
  query result.

**Request Parameters**

* body(Object): The array of objects will be stored in collection
* query(url): Could contain the next elements
    * populate(Object): Object that defines parameters will return populated
    * select(Object):Object that defines wich parameters return. Object must be transformed to url format

**Fetch request example**

```javascript
var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify([{
    "name": "Erlich Bachman",
    "age": 38,
    "location": "Palo Alto C.A."
}, {
    "name": "Dinesh",
    "age": 28,
    "location": "Palo Alto C.A."
}]);

var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
};

fetch("http://localhost:3000/api/employee/?select[name]=1&select[age]=1", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));

```

**Example fetch response**

```json
{
  "error": {},
  "success": true,
  "message": "ok",
  "code": 200,
  "data": [
    {
      "name": "Erlich Bachman",
      "age": 38,
      "location": "Palo Alto C.A."
    },
    {
      "name": "Dinesh",
      "age": 28,
      "location": "Palo Alto C.A."
    }
  ]
}

```

### *GET:getMany (mongodb/SQL)

**Method Parameters**

* model(mongoose class):[mandatory] The moongose model object
* population(Objet):[optional] Object that defines wich fields you can populate and its related model
* options(Object): [optional] Object that defines some configuration for mongoose and elements requested
* fIn_(function): [optional] Async function that can be executed before process recieve and must to return Express 'res'
  object.
* fOut_(function): [optional] Async function that can be executed after process recieve and must to return mongoose
  query result.

**Request Parameters**

* query(url): Could contain the next elements
    * populate(Object): Object that defines parameters will return populated
    * select(Object):Object that defines wich parameters return. Object must be transformed to url format
    * sort(Object):Object that defines the fields will be used for order results 'DESC' for descending or 'ASC'
      ascending
    * paginate(Object):Object with 2 properties 'page' and limit, defines the number of results to return and page
    * where(Object):Object filter to exactly match in find query for values
    * whereObject(Object):Object filter to exactly match in find query for mongoose objectIDs
    * like(Object):Object filter to regex match in find query for values %LIKE% equivalent

**Fetch request example**

```javascript
var requestOptions = {
    method: 'GET',
    redirect: 'follow'
};

fetch("http://localhost:3000/api/employee/?paginate[page]=2&paginate[limit]=3&sort[name]=ASC&select[name]=1", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));

```

**Example fetch response**

```json
{
  "error": {},
  "success": true,
  "message": "ok",
  "code": 200,
  "data": [
    {
      "_id": "60e0f5ef37eb110f8c2b5768",
      "name": "Dinesh Chugtai"
    },
    {
      "_id": "60e0f63a6d6d6e0f8f016e11",
      "name": "Dinesh Chugtai"
    },
    {
      "_id": "60e0f6c5435a9b0f904c347b",
      "name": "Dinesh Chugtai"
    }
  ]
}

```

### *GET:getOneWhere (mongodb/SQL)

**Method Parameters**

* model(mongoose class):[mandatory] The moongose model object
* population(Objet):[optional] Object that defines wich fields you can populate and its related model
* options(Object): [optional] Object that defines some configuration for mongoose and elements requested
* fIn_(function): [optional] Async function that can be executed before process recieve and must to return Express 'res'
  object.
* fOut_(function): [optional] Async function that can be executed after process recieve and must to return mongoose
  query result.

**Request Parameters**

* query(url): Could contain the next elements
    * populate(Object): Object that defines parameters will return populated
    * select(Object):Object that defines wich parameters return. Object must be transformed to url format
    * sort(Object):Object that defines the fields will be used for order results 'DESC' for descending or 'ASC'
      ascending
    * where(Object):Object filter to exactly match in find query for values
    * whereObject(Object):Object filter to exactly match in find query for mongoose objectIDs
    * like(Object):Object filter to regex match in find query for values %LIKE% equivalent

**Fetch request example**

```javascript
var requestOptions = {
    method: 'GET',
    redirect: 'follow'
};

fetch("http://localhost:3000/api/employee/one?like[name]=Jared", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));

```

**Example fetch response**

```json
{
  "error": {},
  "success": true,
  "message": "ok",
  "code": 200,
  "data": {
    "_id": "60e0f6c5435a9b0f904c347c",
    "name": "Donald 'Jared' Dunn",
    "age": 24,
    "location": "Palo Alto C.A.",
    "__v": 0
  }
}

```

### *GET:getOneById (mongodb/SQL)

**Method Parameters**

* model(mongoose class):[mandatory] The moongose model object
* population(Objet):[optional] Object that defines wich fields you can populate and its related model
* options(Object): [optional] Object that defines some configuration for mongoose and elements requested
* fIn_(function): [optional] Async function that can be executed before process recieve and must to return Express 'res'
  object.
* fOut_(function): [optional] Async function that can be executed after process recieve and must to return mongoose
  query result.

**Request Parameters**

* query(url): Could contain the next elements
    * populate(Object): Object that defines parameters will return populated
    * select(Object):Object that defines wich parameters return. Object must be transformed to url format

**Fetch request example**

```javascript
var requestOptions = {
    method: 'GET',
    redirect: 'follow'
};

fetch("http://localhost:3000/api/employee/60e0f5ef37eb110f8c2b5768", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));

```

**Example fetch response**

```json
{
  "error": {},
  "success": true,
  "message": "ok",
  "code": 200,
  "data": {
    "_id": "60e0f5ef37eb110f8c2b5768",
    "name": "Dinesh Chugtai",
    "age": 24,
    "location": "Palo Alto C.A.",
    "__v": 0
  }
}

```

### *PUT:findUpdateOrCreate (mongodb/SQL)

(Updates only first appearance by match, not updates many elements )

**Method Parameters**

* model(mongoose class):[mandatory] The moongose model object
* validation(Object): [optional] Object that helps you to validate body object request
* population(Objet):[optional] Object that defines wich fields you can populate and its related model
* options(Object): [optional] Object that defines some configuration for mongoose and elements requested
* fIn_(function): [optional] Async function that can be executed before process recieve and must to return Express 'res'
  object.
* fOut_(function): [optional] Async function that can be executed after process recieve and must to return mongoose
  query result.

**Request Parameters**

* query(url): Could contain the next elements
    * populate(Object): Object that defines parameters will return populated
    * select(Object):Object that defines wich parameters return. Object must be transformed to url format
    * where(Object):Object filter to exactly match in find query for values
    * whereObject(Object):Object filter to exactly match in find query for mongoose objectIDs

**Fetch request example**

```javascript
var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
    "name": "Erlich Bachmanity",
    "age": 40,
    "location": "Palo Alto C.A."
});

var requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
};

fetch("http://localhost:3000/api/employee/find_update_or_create?where[name]=Erlich Bachmanity", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));

```

**Example fetch response**

```json
{
  "error": {},
  "success": true,
  "message": "ok",
  "code": 200,
  "data": {
    "_id": "60e243c82b4d320571d00639",
    "name": "Erlich Bachmanity",
    "age": 40,
    "location": "Palo Alto C.A.",
    "__v": 0
  }
}

```

### *PUT:findUpdate (mongodb/SQL)

(Updates only first appearance by match, not updates many elements )

**Method Parameters**

* model(mongoose class):[mandatory] The moongose model object
* validation(Object): [optional] Object that helps you to validate body object request
* population(Objet):[optional] Object that defines wich fields you can populate and its related model
* options(Object): [optional] Object that defines some configuration for mongoose and elements requested
* fIn_(function): [optional] Async function that can be executed before process recieve and must to return Express 'res'
  object.
* fOut_(function): [optional] Async function that can be executed after process recieve and must to return mongoose
  query result.

**Request Parameters**

* query(url): Could contain the next elements
    * populate(Object): Object that defines parameters will return populated
    * select(Object):Object that defines wich parameters return. Object must be transformed to url format
    * where(Object):Object filter to exactly match in find query for values
    * whereObject(Object):Object filter to exactly match in find query for mongoose objectIDs
    * like(Object):Object filter to regex match in find query for values %LIKE% equivalent

**Fetch request example**

```javascript
var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
    "name": "Erlich BachmanityX",
    "age": 40,
    "location": "Palo Alto C.A."
});

var requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
};

fetch("http://localhost:3000/api/employee/find_where_and_update?where[name]=Erlich Bachmanity", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
```

**Example fetch response**

```json
{
  "error": {},
  "success": true,
  "message": "ok",
  "code": 200,
  "data": {
    "_id": "60e243c82b4d320571d00639",
    "name": "Erlich BachmanityX",
    "age": 40,
    "location": "Palo Alto C.A.",
    "__v": 0
  }
}
```

### *PUT:updateById (mongodb/SQL)

**Method Parameters**

* model(mongoose class):[mandatory] The moongose model object
* validation(Object): [optional] Object that helps you to validate body object request
* population(Objet):[optional] Object that defines wich fields you can populate and its related model
* options(Object): [optional] Object that defines some configuration for mongoose and elements requested
* fIn_(function): [optional] Async function that can be executed before process recieve and must to return Express 'res'
  object.
* fOut_(function): [optional] Async function that can be executed after process recieve and must to return mongoose
  query result.

**Request Parameters**

* query(url): Could contain the next elements
    * populate(Object): Object that defines parameters will return populated
    * select(Object):Object that defines wich parameters return. Object must be transformed to url format

**Fetch request example**

```javascript
var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
    "name": "Erlich Bachman!!",
    "age": 50,
    "location": "Huston TX"
});

var requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
};

fetch("http://localhost:3000/api/employee/60e243c82b4d320571d00639", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
```

**Example fetch response**

```json
{
  "error": {},
  "success": true,
  "message": "ok",
  "code": 200,
  "data": {
    "_id": "60e243c82b4d320571d00639",
    "name": "Erlich Bachman!!",
    "age": 50,
    "location": "Huston TX",
    "__v": 0
  }
}
```

### *DELETE:findIdAndDelete (mongodb/SQL)

**Method Parameters**

* model(mongoose class):[mandatory] The moongose model object
* options(Object): [optional] Object that defines some configuration for mongoose and elements requested
* fIn_(function): [optional] Async function that can be executed before process recieve and must to return Express 'res'
  object.
* fOut_(function): [optional] Async function that can be executed after process recieve and must to return mongoose
  query result.

**Request Parameters**

**Fetch request example**

```javascript
var requestOptions = {
    method: 'DELETE',
    redirect: 'follow'
};

fetch("http://localhost:3000/api/employee/60e243c82b4d320571d00639", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
```

**Example fetch response**

```json
{
  "error": {},
  "success": true,
  "message": "ok",
  "code": 200,
  "data": {
    "_id": "60e243c82b4d320571d00639",
    "name": "Erlich Bachman!!",
    "age": 50,
    "location": "Huston TX",
    "__v": 0
  }
}
```

### *POST:datatable_aggregate (mongodb/SQL)

**Method Parameters**

* model(mongoose class):[mandatory] The moongose model object
* pipeline(agreggation pipeline):[optional] The mongodb pipeline aggregation
* search_fields (columns where datatble find):[optional] Array of search fields
* options(Object): [optional] Object that defines some configuration for mongoose and elements requested (
  allowDiskUsage:default=true search_by_field:default=false )
* fIn_(function): [optional] Async function that can be executed before process recieve and must to return Express 'res'
  object.
* fOut_(function): [optional] Async function that can be executed after process recieve and must to return mongoose
  query result.

**Request Parameters**

**Fetch request example**

```javascript
var requestOptions = {
    method: 'POST',
};

fetch("http://localhost:3000/api/datatable", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
```

**Example fetch response**

```json
{
  "error": {},
  "success": true,
  "message": "ok",
  "code": 200,
  "data": {
    "_id": "60e243c82b4d320571d00639",
    "name": "Erlich Bachman!!",
    "age": 50,
    "location": "Huston TX",
    "__v": 0
  }
}
```

### *GET:aggregate (mongodb/SQL = for SQL adds a custom sequelize object )

**Method Parameters**

* model(mongoose class):[mandatory] The moongose model object
* pipeline(agreggation pipeline):[optional] The mongodb pipeline aggregation
* options(Object): [optional] Object that defines some configuration for mongoose and elements requested (
  allowDiskUsage:default=true )
* fIn_(function): [optional] Async function that can be executed before process recieve and must to return Express 'res'
  object.
* fMid_(function): [optional] Async function that can be executed after create all pipeline of agreggation and before
  execute 'aggregation exec'
  object.
* fOut_(function): [optional] Async function that can be executed after process recieve and must to return mongoose
  query result.

**Request Parameters**

* query(url): Could contain the next elements
    * where(object):find where in a match
    * where(object):find where in a match if is a objectID
    * like(object):find where in a regular expression
    * paginate(object):page: number of page, limit: how many items per page
    * sort(object): the order asc or desc of an element
    * select(Object):Object that defines wich parameters return. Object must be transformed to url format

**Fetch request example**

```javascript
var requestOptions = {
    method: 'POST',
};

fetch("http://localhost:3000/api/aggregate", requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
```

**Example fetch response**

```json
{
  "error": {},
  "success": true,
  "message": "ok",
  "code": 200,
  "data": {
    "_id": "60e243c82b4d320571d00639",
    "name": "Erlich Bachman!!",
    "age": 50,
    "location": "Huston TX",
    "__v": 0
  }
}
```

## Responses example

**Success**

```json
{
  "error": {},
  "success": true,
  "message": "ok",
  "code": 200,
  "data": {
    "_id": "60e243c82b4d320571d00639",
    "name": "Erlich Bachman!!",
    "age": 50,
    "location": "Huston TX",
    "__v": 0
  }
}
```

**Error**

```json
{
  "error": "404 not found",
  "success": false,
  "message": "404 not found",
  "code": 404,
  "data": {}
}
```

## Object methods example

**Options**

```javascript
let options = {
    "customValidationCode": 450, //default 435
    "customErrorCode": 600, //default 500
    "customNotFoundCode": 420, //default 404
    "mongooseOptions": {}, //bypass mongoose options

}
```

**Population Object**  (mongodb/SQL)

```javascript
let populationObject = {
    user: userModel // defines the path and mongoose model -> Path:user, Model: userModel
}
```

**Validation Object**  (mongodb/SQL)

```javascript
let validationObject = {
    name: 'string,mandatory',
    age: 'number,mandatory',
    regDate: 'date',
}
```

## Object request query URL example  (mongodb/SQL)

**where**

```text
?where[name]=erick&where[age]=30
```

equal to

```javascript
let where = {
    name: 'erick',
    age: 30
}
```

**whereObject**

```text
?where[user_id]=60e243c82b4d320571d00639
```

equal to

```javascript
let whereObject = {
    user_id: ObjectId('60e243c82b4d320571d00639'),
}
```

**like**

```text
?like[name]=eri
```

equal to

```javascript
let like = {
    name: {$regex: 'eri', $options: 'i'},
}
```

**paginate**

```text
?paginate[page]=1&paginate[limit]=10
```

equal to

```javascript
let paginate = {
    page: 1,
    limit: 10
}
```

**sort**

```text
?sort[name]=DESC&sort[age]=ASC
```

equal to

```javascript
let sort = {
    name: "DESC",
    age: "ASC"
}
```

**select**

```text
?select[name]=1&select[age]=1&select[location]=0
```

equal to

```javascript
let select = {
    name: 1,
    age: 1,
    location: 0,
}
```

**populate**

```text
?populate[class]=1&populate[king]=1&populate[users]=0
```

equal to

```javascript
let populate = {
    class: 1,
    kind: 1,
    users: 0,
}
```

<hr>

## Socket.IO Support

APIATO now provides Socket.IO support for real-time bidirectional communication. This implementation allows you to perform CRUD operations through WebSocket connections instead of HTTP requests.

### Socket.IO Installation

```bash
npm install socket.io @types/socket.io
```

### Socket.IO Usage

The Socket.IO implementation provides the same CRUD operations as the REST API but through WebSocket events. Each operation has its corresponding event and response event. Both NoSQL (MongoDB) and SQL databases are supported.

**Authorization Middleware**
You can provide a middleware function to handle authorization for socket operations. The middleware receives information about the operation, model, and data:
```typescript
interface MiddlewareParams {
  operation: string;  // The operation being performed (e.g., 'create', 'update', etc.)
  model: string;      // The model name (e.g., 'User', 'Employee', etc.)
  data: any;         // The request data including body, query, etc.
  socket: Socket;    // The socket instance for accessing auth data
}

// Example middleware function
const authMiddleware = async (params: MiddlewareParams) => {
  const { operation, model, data, socket } = params;
  
  // Get auth token from socket
  const token = socket.handshake.auth.token;
  
  // Example: Check if user has permission for this operation on this model
  const user = await verifyToken(token);
  if (!user) return false;
  
  // Check specific permissions
  switch (operation) {
    case 'create':
      return user.canCreate(model);
    case 'update':
      return user.canUpdate(model, data._id);
    case 'delete':
      return user.canDelete(model, data._id);
    default:
      return user.canRead(model);
  }
};

// Initialize with middleware
const socketApiato = new ApiatoSocket(io, YourMongooseModel, authMiddleware);
// Or for SQL
const socketApiato = new ApiatoSocketSQL(io, YourSequelizeModel, '_id', authMiddleware);

// If no middleware is provided, all operations will be allowed
```

**Request Tags**
You can include a tag in your requests to match responses with their corresponding requests:
```javascript
// Send request with tag
socket.emit('create', JSON.stringify({
  tag: 'create_user_123',  // Any alphanumeric string
  body: {
    name: 'John Doe',
    age: 30
  }
}));

// Response will include the same tag
socket.on('create:response', (response) => {
  console.log(response.tag); // 'create_user_123'
  // Use the tag to match the response with your request
});

// Example with middleware and tag
socket.emit('update', JSON.stringify({
  tag: 'update_user_456',
  responseType: 'room',
  room: 'users',
  _id: 'user_id',
  body: { status: 'active' }
}));

socket.on('update:response', (response) => {
  if (response.tag === 'update_user_456') {
    if (response.error === 'Unauthorized access') {
      // Handle unauthorized access
    } else {
      // Handle successful update
    }
  }
});
```

**NoSQL (MongoDB) Usage**
```typescript
import { Server } from 'socket.io';
import { ApiatoSocket } from './no-sql/apiato-socket';

// Initialize Socket.IO with your HTTP server
const io = new Server(httpServer);

// Initialize ApiatoSocket with your Mongoose model
const socketApiato = new ApiatoSocket(io, YourMongooseModel);
```

**SQL Usage**
```typescript
import { Server } from 'socket.io';
import { ApiatoSocketSQL } from './sql/apiato-socket';

// Initialize Socket.IO with your HTTP server
const io = new Server(httpServer);

// Initialize ApiatoSocketSQL with your Sequelize model
// The third parameter is the primary key field name (defaults to '_id')
const socketApiato = new ApiatoSocketSQL(io, YourSequelizeModel, '_id');

// Example with a different primary key field
const socketApiato = new ApiatoSocketSQL(io, UserModel, 'id');
```

**Query Parameters**
Both SQL and NoSQL implementations support the same query parameters for filtering, sorting, and pagination:

```javascript
// Where conditions
socket.emit('getMany', JSON.stringify({
  query: {
    where: {
      name: 'John',
      age: 30
    }
  }
}));

// Where with ObjectId (MongoDB only)
socket.emit('getMany', JSON.stringify({
  query: {
    whereObject: {
      user_id: '60e243c82b4d320571d00639'
    }
  }
}));

// Like conditions (partial match)
socket.emit('getMany', JSON.stringify({
  query: {
    like: {
      name: 'Jo'  // Will match 'John', 'Joe', etc.
    }
  }
}));

// Pagination
socket.emit('getMany', JSON.stringify({
  query: {
    paginate: {
      page: 1,
      limit: 10
    }
  }
}));

// Sorting
socket.emit('getMany', JSON.stringify({
  query: {
    sort: {
      name: 'ASC',
      age: 'DESC'
    }
  }
}));

// Select specific fields
socket.emit('getMany', JSON.stringify({
  query: {
    select: {
      name: 1,
      age: 1,
      location: 0
    }
  }
}));

// Populate related fields
socket.emit('getMany', JSON.stringify({
  query: {
    populate: {
      user: 1,
      comments: 1
    }
  }
}));

// Combine multiple parameters
socket.emit('getMany', JSON.stringify({
  query: {
    where: { age: { $gt: 18 } },
    like: { name: 'Jo' },
    paginate: { page: 1, limit: 10 },
    sort: { name: 'ASC' },
    select: { name: 1, age: 1 },
    populate: { user: 1 }
  }
}));
```

**Response Types**
For both SQL and NoSQL implementations, you can control how responses are delivered:
```javascript
// Private response (default)
socket.emit('create', JSON.stringify({
  responseType: 'private',
  body: { /* your data */ }
}));

// Broadcast to all clients
socket.emit('update', JSON.stringify({
  responseType: 'broadcast',
  _id: 'record_id',
  body: { /* your data */ }
}));

// Send to specific room
socket.emit('delete', JSON.stringify({
  responseType: 'room',
  room: 'room1',
  _id: 'record_id'
}));
```

**Room Management**
Both implementations support room management:
```javascript
// Join a room
socket.emit('join:room', 'room1');

// Leave a room
socket.emit('leave:room', 'room1');

// Send operation to specific room
socket.emit('create', JSON.stringify({
  responseType: 'room',
  room: 'room1',
  body: { /* your data */ }
}));
```

### Available Socket Events

Each event emits a response event with the suffix `:response`. You can control how responses are delivered using the `responseType` parameter:
- `private` (default): Response sent only to the requesting client
- `broadcast`: Response sent to all connected clients
- `room`: Response sent to all clients in a specific room

**Room Management**
```javascript
// Join a room
socket.emit('join:room', 'room1');
socket.on('join:room:response', (response) => {
  console.log(response); // { data: { room: 'room1' }, message: 'Joined room: room1', ... }
});

// Leave a room
socket.emit('leave:room', 'room1');
socket.on('leave:room:response', (response) => {
  console.log(response); // { data: { room: 'room1' }, message: 'Left room: room1', ... }
});
```

**Create**
```javascript
// Private response (default)
socket.emit('create', JSON.stringify({
  responseType: 'private', // or omit for default private response
  body: {
    name: 'John Doe',
    age: 30
  }
}));

// Broadcast to all clients
socket.emit('create', JSON.stringify({
  responseType: 'broadcast',
  body: {
    name: 'John Doe',
    age: 30
  }
}));

// Send to specific room
socket.emit('create', JSON.stringify({
  responseType: 'room',
  room: 'room1',
  body: {
    name: 'John Doe',
    age: 30
  }
}));

// Client listen
socket.on('create:response', (response) => {
  console.log(response);
  // {
  //   data: { created document },
  //   message: 'Created successfully',
  //   success: true,
  //   error: null
  // }
});
```

**Read**
```javascript
// Private response
socket.emit('read', JSON.stringify({
  responseType: 'private',
  query: { age: 30 },
  options: { sort: { name: 1 } }
}));

// Broadcast result to all clients
socket.emit('read', JSON.stringify({
  responseType: 'broadcast',
  query: { age: 30 },
  options: { sort: { name: 1 } }
}));

// Send result to specific room
socket.emit('read', JSON.stringify({
  responseType: 'room',
  room: 'room1',
  query: { age: 30 },
  options: { sort: { name: 1 } }
}));

// Client listen
socket.on('read:response', (response) => {
  console.log(response);
  // {
  //   data: [ documents ],
  //   message: 'Retrieved successfully',
  //   success: true,
  //   error: null
  // }
});
```

**Update**
```javascript
// Private response
socket.emit('update', JSON.stringify({
  responseType: 'private',
  _id: 'document_id',
  body: {
    name: 'Jane Doe'
  }
}));

// Broadcast update to all clients
socket.emit('update', JSON.stringify({
  responseType: 'broadcast',
  _id: 'document_id',
  body: {
    name: 'Jane Doe'
  }
}));

// Send update to specific room
socket.emit('update', JSON.stringify({
  responseType: 'room',
  room: 'room1',
  _id: 'document_id',
  body: {
    name: 'Jane Doe'
  }
}));

// Client listen
socket.on('update:response', (response) => {
  console.log(response);
  // {
  //   data: { updated document },
  //   message: 'Updated successfully',
  //   success: true,
  //   error: null
  // }
});
```

**Delete**
```javascript
// Private response
socket.emit('delete', JSON.stringify({
  responseType: 'private',
  _id: 'document_id'
}));

// Broadcast deletion to all clients
socket.emit('delete', JSON.stringify({
  responseType: 'broadcast',
  _id: 'document_id'
}));

// Send deletion notification to specific room
socket.emit('delete', JSON.stringify({
  responseType: 'room',
  room: 'room1',
  _id: 'document_id'
}));

// Client listen
socket.on('delete:response', (response) => {
  console.log(response);
  // {
  //   data: { deleted document },
  //   message: 'Deleted successfully',
  //   success: true,
  //   error: null
  // }
});
```

## TypeScript Support

APIATO also provides full TypeScript support with type definitions for both SQL and NoSQL databases. The TypeScript version provides better type safety and enhanced IDE support.

### Installation

```bash
npm install @apiatojs/typescript
```

### Basic TypeScript Usage

**Configure Express with TypeScript**

```typescript
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { Apiato } from '@apiatojs/typescript/no-sql';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MongoDB connection
const uri = "mongodb://localhost:27017/apiator";
mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true });
const connection = mongoose.connection;
connection.once("open", () => {
    console.log("MongoDB database connection established successfully");
});
```

**Create Model and Schema with TypeScript**

```typescript
import { Schema, model } from 'mongoose';

interface IEmployee {
    name: string;
    age: number;
    location?: string;
}

const employeeSchema = new Schema<IEmployee>({
    name: { type: String },
    age: { type: Number },
    location: { type: String }
});

const EmployeeModel = model<IEmployee>('employees', employeeSchema);

const employeeValidationObject = {
    name: 'string,mandatory',
    age: 'number,mandatory',
    location: 'string'
};
```

**Initialize APIATO with TypeScript**

```typescript
import { Apiato } from '@apiatojs/typescript/no-sql';

const msEmployee = new Apiato();

// Define types for population and options
type PopulationObject = Record<string, any>;
type Options = Record<string, any>;

const populationObject: PopulationObject = {};
const options: Options = {};

// Route definitions with TypeScript
app.post('/api/employee', msEmployee.createOne(EmployeeModel, employeeValidationObject, populationObject, options));
app.get('/api/employee', msEmployee.getMany(EmployeeModel, populationObject, options));
app.get('/api/employee/:id', msEmployee.getOneById(EmployeeModel, populationObject, options));
// ... other routes
```

### SQL Support with TypeScript

```typescript
import { Sequelize, DataTypes } from 'sequelize';
import { ApiatoSQL } from '@apiatojs/typescript/sql';

// Initialize Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});

// Define model with TypeScript
interface UserAttributes {
    _id: string;
    username: string;
    email: string;
    active: boolean;
}

const User = sequelize.define('User', {
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
});

// Initialize APIATO SQL with TypeScript
const apiato = new ApiatoSQL('_id');

// Define routes with proper types
app.post('/api/user', apiato.createOne(User, validationObject, populationObject, options));
app.get('/api/user', apiato.getMany(User, populationObject, options));
// ... other routes
```

### Type Definitions

The TypeScript version includes comprehensive type definitions for:
- Request and response objects
- Validation schemas
- Population objects
- Configuration options
- Database models and schemas
- Query parameters and filters

These type definitions help catch errors at compile time and provide better IDE support for autocomplete and documentation.

<hr>


<p align="center">
    <img src="https://leganux.net/images/circullogo.png" width="100" title="hover text">
    <br>
  APIATO is another project of  <a href="https://leganux.net">leganux.net</a> &copy; 2021 all rights reserved
    <br>
   This project is distributed under the MIT license. 
    <br>
    Special thanks to Marlon Calderon for his contribution to this development 
<br>
<br>
The logo and the name of APIATO is inspired by the name of AVIATO, the fictional company of Erlich Bachman, a character from the HBO series, Silicon Valley. This inspiration was taken for fun purposes only. The original name and logo reserve their rights to their original creators. 
</p>
