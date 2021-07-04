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


app.post('/api/employee', ms_employee.createOne(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.post('/api/employee/many', ms_employee.createMany(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))

app.get('/api/employee/one', ms_employee.getOneWhere(employeeModel, populationObjectEmployee, optionsEmployee))
app.get('/api/employee/:id', ms_employee.getOneById(employeeModel, populationObjectEmployee, optionsEmployee))
app.get('/api/employee', ms_employee.getMany(employeeModel, populationObjectEmployee, optionsEmployee))

app.put('/api/employee/find_update_or_create', ms_employee.findUpdateOrCreate(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.put('/api/employee/find_where_and_update', ms_employee.findUpdate(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.put('/api/employee/:id', ms_employee.updateById(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))

app.delete('/api/employee/:id', ms_employee.findIdAndDelete(employeeModel, optionsEmployee))

app.post('/api/employee', ms_employee.datatable(employeeModel, populationObjectEmployee, ''))

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

app.post('/api/employee', ms_employee.createOne(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.post('/api/employee/many', ms_employee.createMany(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.get('/api/employee/one', ms_employee.getOneWhere(employeeModel, populationObjectEmployee, optionsEmployee))
app.get('/api/employee/:id', ms_employee.getOneById(employeeModel, populationObjectEmployee, optionsEmployee))
app.get('/api/employee', ms_employee.getMany(employeeModel, populationObjectEmployee, optionsEmployee))
app.put('/api/employee/find_update_or_create', ms_employee.findUpdateOrCreate(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.put('/api/employee/find_where_and_update', ms_employee.findUpdate(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.put('/api/employee/:id', ms_employee.updateById(employeeModel, employeeValidationObject, populationObjectEmployee, optionsEmployee))
app.delete('/api/employee/:id', ms_employee.findIdAndDelete(employeeModel, optionsEmployee))
app.post('/api/employee', ms_employee.datatable(employeeModel, populationObjectEmployee, ''))

app.listen(3000, () => {
    console.log("El servidor está inicializado en el puerto 3000");
});
```

<hr>

## How to execute



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


