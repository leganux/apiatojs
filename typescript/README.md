# @apiato/typescript

Una poderosa y flexible librería de API para Node.js que soporta bases de datos SQL (Sequelize) y NoSQL (Mongoose), con implementaciones REST y Socket.IO.

## Características

### Características Generales
- Soporte para SQL (Sequelize) y NoSQL (Mongoose)
- Implementaciones REST y Socket.IO
- Soporte completo de TypeScript
- Validación de datos
- Manejo de errores estandarizado
- Respuestas consistentes
- Middleware personalizable
- Hooks pre/post operación

### Características REST API
- CRUD completo
- Paginación
- Ordenamiento
- Filtrado
- Búsqueda parcial (LIKE)
- Selección de campos
- Población/Inclusión de relaciones
- Validación de datos
- Formato de respuesta estandarizado

### Características Socket.IO
- CRUD en tiempo real
- Comunicación basada en salas
- Broadcasting
- Respuestas privadas
- Validación de datos
- Manejo de errores
- Sistema de tags para tracking
- Middleware personalizable

## Instalación

```bash
bun install apiato
```

## Uso

### REST API con Sequelize

```typescript
import { ApiatoSQL } from 'apiato/typescript';
import { Router } from 'express';
import User from './models/User';

const router = Router();
const apiato = new ApiatoSQL();

// Validación
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

// CRUD Routes
router.post('/', apiato.createOne(User, userValidation));
router.get('/', apiato.getMany(User));
router.get('/:id', apiato.getOneById(User));
router.put('/:id', apiato.updateById(User, userValidation));
router.delete('/:id', apiato.findIdAndDelete(User));

// Datatable format
router.post('/datatable', apiato.datatable_aggregate(
    User,
    ['name', 'email'], // campos de búsqueda
    { search_by_field: true }
));
```

### REST API con Mongoose

```typescript
import { ApiatoNoSQL } from 'apiato/typescript';
import { Router } from 'express';
import User from './models/User';

const router = Router();
const apiato = new ApiatoNoSQL();

// Validación
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

// CRUD Routes
router.post('/', apiato.createOne(User, userValidation));
router.get('/', apiato.getMany(User));
router.get('/:id', apiato.getOneById(User));
router.put('/:id', apiato.updateById(User, userValidation));
router.delete('/:id', apiato.findIdAndDelete(User));

// Datatable format
router.post('/datatable', apiato.datatable_aggregate(
    User,
    ['name', 'email'], // campos de búsqueda
    { search_by_field: true }
));
```

### Socket.IO (SQL/NoSQL)

```typescript
import { ApiatoSocketSQL, ApiatoSocketNoSQL } from apiato/typescript';
import { Server } from 'socket.io';
import User from './models/User';

const io = new Server(httpServer);

// Para SQL (Sequelize)
const userSocket = new ApiatoSocketSQL(io, User);
// O para NoSQL (Mongoose)
const userSocket = new ApiatoSocketNoSQL(io, User);

// El cliente puede usar los siguientes eventos:

// Crear
socket.emit('create', JSON.stringify({
    body: {
        name: "John Doe",
        email: "john@example.com",
        age: 30
    },
    responseType: "private" // o "broadcast" o "room"
}));

// Obtener muchos
socket.emit('getMany', JSON.stringify({
    query: {
        where: { age: { $gt: 18 } },
        paginate: { page: 1, limit: 10 },
        sort: { name: 'ASC' }
    }
}));

// Obtener uno por ID
socket.emit('getOneById', JSON.stringify({
    id: "123",
    query: {
        select: ['name', 'email']
    }
}));

// Actualizar por ID
socket.emit('updateById', JSON.stringify({
    id: "123",
    body: {
        name: "John Updated"
    },
    responseType: "broadcast"
}));

// Eliminar por ID
socket.emit('deleteById', JSON.stringify({
    id: "123",
    responseType: "room",
    room: "admins"
}));

// Escuchar respuestas
socket.on('create:response', (response) => {
    console.log(response);
});
socket.on('getMany:response', (response) => {
    console.log(response);
});
socket.on('getOneById:response', (response) => {
    console.log(response);
});
socket.on('updateById:response', (response) => {
    console.log(response);
});
socket.on('deleteById:response', (response) => {
    console.log(response);
});
```

## Parámetros de Consulta (REST API)

### Filtrado

```typescript
// Filtrado exacto
GET /api/users?where[age]=30

// Filtrado con operadores (Mongoose)
GET /api/users?where[age][$gt]=18

// Filtrado parcial
GET /api/users?like[name]=john

// Filtrado por objeto
GET /api/users?whereObject[status]=active
```

### Paginación

```typescript
GET /api/users?paginate[page]=1&paginate[limit]=10
```

### Ordenamiento

```typescript
GET /api/users?sort[name]=ASC&sort[age]=DESC
```

### Selección de Campos

```typescript
GET /api/users?select=name,email,age
```

### Población/Inclusión

```typescript
// Mongoose
GET /api/users?populate=posts,comments

// Sequelize
GET /api/users?include=posts,comments
```

## Formato de Solicitud Socket.IO

```typescript
{
    // Para create/update
    body?: {
        [key: string]: any;
    };
    
    // Para getOneById/updateById/deleteById
    id?: string | number;
    
    // Parámetros de consulta
    query?: {
        where?: Record<string, any>;
        whereObject?: Record<string, any>;
        like?: Record<string, any>;
        select?: string[] | Record<string, 1 | 0>;
        include?: string[] | Record<string, any>;
        sort?: Record<string, 'ASC' | 'DESC'>;
        paginate?: {
            page: number;
            limit: number;
        };
    };
    
    // Tipo de respuesta
    responseType?: 'private' | 'broadcast' | 'room';
    
    // Nombre de la sala (si responseType es 'room')
    room?: string;
    
    // Tag para tracking
    tag?: string;
}
```

## Formato de Respuesta

### REST API

```typescript
{
    error: any;           // Error si existe
    success: boolean;     // true/false
    message: string;      // Mensaje descriptivo
    code: number;         // Código HTTP
    data: any;           // Datos de respuesta
}
```

### Socket.IO

```typescript
{
    data: any;           // Datos de respuesta
    message: string;     // Mensaje descriptivo
    success: boolean;    // true/false
    error: any;         // Error si existe
    tag?: string;       // Tag de tracking si se proporcionó
}
```

## Middleware y Hooks

### REST API

```typescript
// Pre-request hook
const preHook = async (req: Request) => {
    // Modificar request
    return req;
};

// Post-response hook
const postHook = async (data: any) => {
    // Modificar respuesta
    return data;
};

router.get('/', apiato.getMany(User, {}, preHook, postHook));
```

### Socket.IO

```typescript
// Middleware
const middleware = async (params: {
    operation: string;
    model: string;
    data: any;
    socket: Socket;
}) => {
    // Validar/modificar operación
    return true; // o false para denegar
};

const userSocket = new ApiatoSocket(io, User, middleware);
```

## Validación

```typescript
const validationSchema = {
    fieldName: {
        type: 'string' | 'number' | 'boolean',
        required?: boolean,
        regex?: RegExp,
        min?: number,
        max?: number
    }
};
```

## Manejo de Errores

La librería maneja automáticamente los siguientes tipos de errores:
- Errores de validación (435)
- Errores de no encontrado (404)
- Errores de servidor (500)

Puedes personalizar los códigos de error:

```typescript
const options = {
    customErrorCode: 500,
    customValidationCode: 435,
    customNotFoundCode: 404
};

apiato.createOne(User, validationSchema, {}, options);
```

## Licencia

MIT
