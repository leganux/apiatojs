import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database';
import User from './models/User';
import { ApiatoSocket } from 'apiato-typescript';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
const PORT = process.env.PORT || 3002;

// Initialize Socket.IO handlers
const userSocket = new ApiatoSocket(io, User);

// Serve static client file
app.get('/', (_req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Apiato Socket.IO Test</title>
            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();
                
                // Connection status
                socket.on('connect', () => {
                    console.log('Connected to server');
                });

                socket.on('disconnect', () => {
                    console.log('Disconnected from server');
                });

                // Example: Create a user
                function createUser() {
                    const data = {
                        body: {
                            name: "John Doe",
                            email: "john@example.com",
                            age: 30
                        }
                    };
                    socket.emit('create', JSON.stringify(data));
                }

                // Example: Get all users
                function getUsers() {
                    const data = {};
                    socket.emit('getMany', JSON.stringify(data));
                }

                // Listen for responses
                socket.on('create:response', (response) => {
                    console.log('Create response:', response);
                });

                socket.on('getMany:response', (response) => {
                    console.log('Get many response:', response);
                });
            </script>
        </head>
        <body>
            <h1>Apiato Socket.IO Test</h1>
            <button onclick="createUser()">Create User</button>
            <button onclick="getUsers()">Get Users</button>
            <p>Open the browser console to see the results</p>
        </body>
        </html>
    `);
});

// Initialize database and start server
async function startServer() {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start server
        httpServer.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
            console.log('\nTest the Socket.IO API:');
            console.log('1. Open http://localhost:3002 in your browser');
            console.log('2. Open the browser console');
            console.log('3. Click the buttons to test the Socket.IO API');
            console.log('\nOr use a Socket.IO client to connect to:');
            console.log(`ws://localhost:${PORT}`);
            console.log('\nAvailable events:');
            console.log('- create');
            console.log('- getMany');
            console.log('- getOneById');
            console.log('- updateById');
            console.log('- deleteById');
            console.log('\nExample payload:');
            console.log(`{
    "body": {
        "name": "John Doe",
        "email": "john@example.com",
        "age": 30
    },
    "responseType": "private" // or "broadcast" or "room"
}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
