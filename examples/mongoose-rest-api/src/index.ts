import express from 'express';
import connectDB from './config/database';
import userRoutes from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: err.message,
        success: false,
        message: 'Internal Server Error',
        code: 500,
        data: {}
    });
});

// Initialize database and start server
async function startServer() {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
            console.log('\nTest the API with:');
            console.log('\nCreate user:');
            console.log('curl -X POST -H "Content-Type: application/json" -d \'{"name":"John","email":"john@example.com","age":30}\' http://localhost:3001/api/users');
            console.log('\nGet all users:');
            console.log('curl http://localhost:3001/api/users');
            console.log('\nGet user by ID:');
            console.log('curl http://localhost:3001/api/users/[user-id]');
            console.log('\nUpdate user:');
            console.log('curl -X PUT -H "Content-Type: application/json" -d \'{"name":"John Updated","email":"john.updated@example.com","age":31}\' http://localhost:3001/api/users/[user-id]');
            console.log('\nDelete user:');
            console.log('curl -X DELETE http://localhost:3001/api/users/[user-id]');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
