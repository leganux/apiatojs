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
let apiato = require('apiato')
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
let apiato = require('apiato')
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

<hr>

## Methods

### *POST:createOne

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

### *POST:createMany

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

### *GET:getMany

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

### *GET:getOneWhere

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

### *GET:getOneById

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

### *PUT:findUpdateOrCreate

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

### *PUT:findUpdate

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

### *PUT:updateById

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

### *DELETE:findIdAndDelete

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


### *POST:datatable_aggregate_

**Method Parameters**

* model(mongoose class):[mandatory] The moongose model object
* pipeline(agreggation pipeline):[optional] The mongodb pipeline aggregation
* search_fields (columns where datatble find):[optional] Array of search fields
* options(Object): [optional] Object that defines some configuration for mongoose and elements requested (allowDiskUsage:default=true search_by_field:default=false )
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

fetch("http://localhost:3000/api/dt_agr", requestOptions)
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

### *GET:aggregate

**Method Parameters**

* model(mongoose class):[mandatory] The moongose model object
* pipeline(agreggation pipeline):[optional] The mongodb pipeline aggregation
* options(Object): [optional] Object that defines some configuration for mongoose and elements requested (allowDiskUsage:default=true )
* fIn_(function): [optional] Async function that can be executed before process recieve and must to return Express 'res'
  object.
* fMid_(function): [optional] Async function that can be executed after create all pipeline of agreggation and before execute 'aggregation exec'
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

**Population Object**

```javascript
let populationObject = {
    user: userModel // defines the path and mongoose model -> Path:user, Model: userModel
}
```

**Validation Object**

```javascript
let validationObject = {
    name: 'string,mandatory',
    age: 'number,mandatory',
    regDate: 'date',
}
```

## Object request query URL example

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


<p align="center">
    <img src="https://leganux.net/web/wp-content/uploads/2020/01/circullogo.png" width="100" title="hover text">
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


