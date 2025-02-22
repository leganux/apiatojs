# Apiato.js

A powerful and flexible API library for Node.js that supports both SQL (Sequelize) and NoSQL (Mongoose) databases, with REST and Socket.IO implementations.

## Features

- Support for both SQL (Sequelize) and NoSQL (Mongoose) databases
- REST API implementation
- Socket.IO implementation
- TypeScript support
- Validation
- Pagination
- Sorting
- Filtering
- Population/Include relations
- Room-based communication (Socket.IO)
- Broadcasting (Socket.IO)

## Installation

```bash
bun install apiato-typescript
```

## Examples

This repository includes four example implementations:

1. REST API with Sequelize (SQLite)
2. REST API with Mongoose (MongoDB)
3. Socket.IO with Sequelize (SQLite)
4. Socket.IO with Mongoose (MongoDB)

### Running the Examples

Each example is in its own directory under `examples/`. To run an example:

1. Navigate to the example directory:
```bash
cd examples/[example-name]
```

2. Install dependencies:
```bash
bun install
```

3. Start the development server:
```bash
bun run dev
```

### Example Ports

- Sequelize REST API: http://localhost:3000
- Mongoose REST API: http://localhost:3001
- Mongoose Socket.IO: http://localhost:3002
- Sequelize Socket.IO: http://localhost:3003

## Usage

### REST API with Sequelize

```typescript
import { ApiatoSQL } from 'apiato-typescript';
import User from './models/User';

const apiato = new ApiatoSQL();

// Create routes
router.post('/', apiato.createOne(User));
router.get('/', apiato.getMany(User));
router.get('/:id', apiato.getOneById(User));
router.put('/:id', apiato.updateById(User));
router.delete('/:id', apiato.findIdAndDelete(User));
```

### REST API with Mongoose

```typescript
import { ApiatoNoSQL } from 'apiato-typescript';
import User from './models/User';

const apiato = new ApiatoNoSQL();

// Create routes
router.post('/', apiato.createOne(User));
router.get('/', apiato.getMany(User));
router.get('/:id', apiato.getOneById(User));
router.put('/:id', apiato.updateById(User));
router.delete('/:id', apiato.findIdAndDelete(User));
```

### Socket.IO with Sequelize/Mongoose

```typescript
import { ApiatoSocket } from 'apiato-typescript';
import { Server } from 'socket.io';
import User from './models/User';

const io = new Server(httpServer);
const userSocket = new ApiatoSocket(io, User);

// Available events:
// - create
// - getMany
// - getOneById
// - updateById
// - deleteById

// Example client usage:
socket.emit('create', JSON.stringify({
    body: {
        name: "John Doe",
        email: "john@example.com",
        age: 30
    },
    responseType: "private" // or "broadcast" or "room"
}));
```

## API Documentation

### REST API Endpoints

- `POST /`: Create a new record
- `GET /`: Get all records (with pagination, sorting, filtering)
- `GET /:id`: Get a record by ID
- `PUT /:id`: Update a record by ID
- `DELETE /:id`: Delete a record by ID

### Socket.IO Events

- `create`: Create a new record
- `getMany`: Get all records
- `getOneById`: Get a record by ID
- `updateById`: Update a record by ID
- `deleteById`: Delete a record by ID

### Query Parameters (REST API)

- `where`: Filter records by field values
- `like`: Filter records using partial matches
- `select`: Select specific fields
- `paginate`: Paginate results (page, limit)
- `sort`: Sort results by fields
- `populate/include`: Include related records

### Socket.IO Request Format

```typescript
{
    body?: any;              // Data for create/update operations
    id?: number | string;    // Record ID for single-record operations
    query?: {                // Query parameters
        where?: any;         // Filter conditions
        attributes?: string[]; // Fields to select (Sequelize)
        select?: any;        // Fields to select (Mongoose)
        include?: any[];     // Relations to include
        sort?: any;          // Sort conditions
        paginate?: {         // Pagination
            page: number;
            limit: number;
        }
    };
    responseType?: 'private' | 'broadcast' | 'room'; // Response type
    room?: string;           // Room name for room-based responses
    tag?: string;            // Custom tag for response tracking
}
```

## License

MIT
