# APIATO Socket.IO Documentation

<p align="center">
  <img src="https://github.com/leganux/apiatojs/blob/main/apiato.jpg?raw=true" width="550" title="APIATO logo">
</p>

## Table of Contents
- [APIATO Socket.IO Documentation](#apiato-socketio-documentation)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
    - [NoSQL (MongoDB) Setup](#nosql-mongodb-setup)
    - [SQL Setup](#sql-setup)
  - [Authorization](#authorization)
  - [Event Types](#event-types)
    - [Create Operations](#create-operations)
    - [Read Operations](#read-operations)
    - [Update Operations](#update-operations)
    - [Delete Operations](#delete-operations)
  - [Room Management](#room-management)
  - [Response Types](#response-types)
  - [Examples](#examples)
    - [Complete CRUD Example](#complete-crud-example)
    - [Error Handling Example](#error-handling-example)

## Installation

```bash
npm install socket.io @types/socket.io
```

## Basic Usage

APIATO provides Socket.IO support for real-time bidirectional communication. This implementation allows you to perform CRUD operations through WebSocket connections instead of HTTP requests.

### NoSQL (MongoDB) Setup

```typescript
import { Server } from 'socket.io';
import { ApiatoSocket } from './no-sql/apiato-socket';

// Initialize Socket.IO with your HTTP server
const io = new Server(httpServer);

// Initialize ApiatoSocket with your Mongoose model
const socketApiato = new ApiatoSocket(io, YourMongooseModel);
```

### SQL Setup

```typescript
import { Server } from 'socket.io';
import { ApiatoSocketSQL } from './sql/apiato-socket';

// Initialize Socket.IO with your HTTP server
const io = new Server(httpServer);

// Initialize ApiatoSocketSQL with your Sequelize model
// The third parameter is the primary key field name (defaults to '_id')
const socketApiato = new ApiatoSocketSQL(io, YourSequelizeModel, '_id');
```

## Authorization

APIATO Socket.IO supports middleware for authorization:

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
```

## Event Types

### Create Operations

```javascript
// Create a single document
socket.emit('create', JSON.stringify({
  tag: 'create_user_123',  // Optional tracking tag
  body: {
    name: 'John Doe',
    age: 30
  }
}));

socket.on('create:response', (response) => {
  console.log(response);
  // {
  //   data: { created document },
  //   message: 'Created successfully',
  //   success: true,
  //   error: null,
  //   tag: 'create_user_123'  // If provided in request
  // }
});
```

### Read Operations

```javascript
// Get documents with filters
socket.emit('read', JSON.stringify({
  query: {
    where: { age: { $gt: 18 } },
    like: { name: 'Jo' },
    paginate: { page: 1, limit: 10 },
    sort: { name: 'ASC' },
    select: { name: 1, age: 1 },
    populate: { user: 1 }
  }
}));

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

### Update Operations

```javascript
// Update a document
socket.emit('update', JSON.stringify({
  _id: 'document_id',
  body: {
    name: 'Jane Doe'
  }
}));

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

### Delete Operations

```javascript
// Delete a document
socket.emit('delete', JSON.stringify({
  _id: 'document_id'
}));

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

## Room Management

Socket.IO rooms allow you to broadcast events to a subset of clients:

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

// Send operation to specific room
socket.emit('create', JSON.stringify({
  responseType: 'room',
  room: 'room1',
  body: { /* your data */ }
}));
```

## Response Types

You can control how responses are delivered:

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

## Examples

### Complete CRUD Example

```javascript
// Client-side Socket.IO implementation
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-auth-token'
  }
});

// Create
socket.emit('create', JSON.stringify({
  tag: 'create_user',
  body: {
    name: 'John Doe',
    email: 'john@example.com'
  }
}));

socket.on('create:response', (response) => {
  if (response.tag === 'create_user') {
    if (response.success) {
      console.log('User created:', response.data);
    } else {
      console.error('Error creating user:', response.error);
    }
  }
});

// Read with filters
socket.emit('read', JSON.stringify({
  query: {
    where: { active: true },
    sort: { createdAt: 'DESC' },
    paginate: { page: 1, limit: 10 }
  }
}));

socket.on('read:response', (response) => {
  if (response.success) {
    console.log('Active users:', response.data);
  }
});

// Update with room notification
socket.emit('update', JSON.stringify({
  responseType: 'room',
  room: 'admins',
  _id: 'user_123',
  body: {
    status: 'premium'
  }
}));

socket.on('update:response', (response) => {
  console.log('Update result:', response);
});

// Delete with broadcast
socket.emit('delete', JSON.stringify({
  responseType: 'broadcast',
  _id: 'user_123'
}));

socket.on('delete:response', (response) => {
  console.log('Delete result:', response);
});
```

### Error Handling Example

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('create:response', (response) => {
  if (!response.success) {
    switch(response.error) {
      case 'Unauthorized access':
        // Handle authentication error
        break;
      case 'Validation failed':
        // Handle validation error
        break;
      default:
        // Handle other errors
        break;
    }
  }
});
```

<p align="center">
    <img src="https://leganux.net/images/circullogo.png" width="100" title="Leganux Logo">
    <br>
    APIATO is a project by <a href="https://leganux.net">leganux.net</a> © 2021 all rights reserved
</p>
