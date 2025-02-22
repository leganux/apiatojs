import { Server, Socket } from 'socket.io';
import { Model, Document } from 'mongoose';

type ResponseType = 'private' | 'broadcast' | 'room';

interface QueryParams {
    where?: Record<string, any>;
    whereObject?: Record<string, any>;
    like?: Record<string, any>;
    paginate?: { page: number; limit: number };
    sort?: Record<string, 'ASC' | 'DESC'>;
    select?: Record<string, 0 | 1>;
    populate?: Record<string, 0 | 1>;
}

interface SocketRequest {
    responseType?: ResponseType;
    room?: string;
    body?: any;
    _id?: string;
    query?: QueryParams;
    options?: any;
    pipeline?: any[];
    tag?: string;
}

interface MiddlewareParams {
    operation: string;
    model: string;
    data: any;
    socket: Socket;
}

type MiddlewareFunction = (params: MiddlewareParams) => Promise<boolean>;

export class ApiatoSocket {
    private io: Server;
    private model: Model<any>;
    private middleware?: MiddlewareFunction;

    constructor(io: Server, model: Model<any>, middleware?: MiddlewareFunction) {
        this.io = io;
        this.model = model;
        this.middleware = middleware;
        this.initializeSocketHandlers();
    }

    private async checkPermission(socket: Socket, operation: string, data: any): Promise<boolean> {
        if (!this.middleware) return true;
        return await this.middleware({
            operation,
            model: this.model.modelName,
            data,
            socket
        });
    }

    private emitResponse(socket: Socket, eventName: string, data: any, request: SocketRequest) {
        const response = {
            data,
            message: data ? 'Operation successful' : 'Operation failed',
            success: !!data,
            error: null,
            tag: request.tag
        };

        switch (request.responseType) {
            case 'broadcast':
                this.io.emit(eventName, response);
                break;
            case 'room':
                if (request.room) {
                    this.io.to(request.room).emit(eventName, response);
                } else {
                    socket.emit(eventName, {
                        ...response,
                        error: 'Room not specified for room response type'
                    });
                }
                break;
            case 'private':
            default:
                socket.emit(eventName, response);
        }
    }

    private initializeSocketHandlers(): void {
        this.io.on('connection', (socket: Socket) => {
            console.log('Client connected:', socket.id);

            // Room management
            socket.on('join:room', (roomName: string) => {
                socket.join(roomName);
                socket.emit('join:room:response', {
                    data: { room: roomName },
                    message: `Joined room: ${roomName}`,
                    success: true,
                    error: null
                });
            });

            socket.on('leave:room', (roomName: string) => {
                socket.leave(roomName);
                socket.emit('leave:room:response', {
                    data: { room: roomName },
                    message: `Left room: ${roomName}`,
                    success: true,
                    error: null
                });
            });

            // Create
            socket.on('create', async (data: string) => {
                try {
                    const request: SocketRequest = JSON.parse(data);
                    
                    if (!await this.checkPermission(socket, 'create', request)) {
                        socket.emit('create:response', {
                            data: null,
                            message: 'Unauthorized',
                            success: false,
                            error: 'Unauthorized access',
                            tag: request.tag
                        });
                        return;
                    }

                    const result = await this.model.create(request.body);
                    this.emitResponse(socket, 'create:response', result, request);
                } catch (error: any) {
                    socket.emit('create:response', {
                        data: null,
                        message: 'Error creating document',
                        success: false,
                        error: error.message,
                        tag: JSON.parse(data).tag
                    });
                }
            });

            // Get Many
            socket.on('getMany', async (data: string) => {
                try {
                    const request: SocketRequest = JSON.parse(data);
                    
                    if (!await this.checkPermission(socket, 'getMany', request)) {
                        socket.emit('getMany:response', {
                            data: null,
                            message: 'Unauthorized',
                            success: false,
                            error: 'Unauthorized access',
                            tag: request.tag
                        });
                        return;
                    }

                    const query = this.model.find(request.query?.where || {});
                    
                    if (request.query?.select) {
                        query.select(request.query.select);
                    }
                    if (request.query?.populate) {
                        query.populate(request.query.populate);
                    }
                    if (request.query?.sort) {
                        query.sort(request.query.sort);
                    }
                    if (request.query?.paginate) {
                        const { page = 1, limit = 10 } = request.query.paginate;
                        query.skip((page - 1) * limit).limit(limit);
                    }

                    const result = await query.exec();
                    this.emitResponse(socket, 'getMany:response', result, request);
                } catch (error: any) {
                    socket.emit('getMany:response', {
                        data: null,
                        message: 'Error retrieving documents',
                        success: false,
                        error: error.message
                    });
                }
            });

            // Get One By Id
            socket.on('getOneById', async (data: string) => {
                try {
                    const request: SocketRequest = JSON.parse(data);
                    
                    if (!await this.checkPermission(socket, 'getOneById', request)) {
                        socket.emit('getOneById:response', {
                            data: null,
                            message: 'Unauthorized',
                            success: false,
                            error: 'Unauthorized access',
                            tag: request.tag
                        });
                        return;
                    }

                    const query = this.model.findById(request._id);
                    
                    if (request.query?.select) {
                        query.select(request.query.select);
                    }
                    if (request.query?.populate) {
                        query.populate(request.query.populate);
                    }

                    const result = await query.exec();
                    this.emitResponse(socket, 'getOneById:response', result, request);
                } catch (error: any) {
                    socket.emit('getOneById:response', {
                        data: null,
                        message: 'Error retrieving document',
                        success: false,
                        error: error.message
                    });
                }
            });

            // Update By Id
            socket.on('updateById', async (data: string) => {
                try {
                    const request: SocketRequest = JSON.parse(data);
                    
                    if (!await this.checkPermission(socket, 'updateById', request)) {
                        socket.emit('updateById:response', {
                            data: null,
                            message: 'Unauthorized',
                            success: false,
                            error: 'Unauthorized access',
                            tag: request.tag
                        });
                        return;
                    }

                    const result = await this.model.findByIdAndUpdate(
                        request._id,
                        request.body,
                        { new: true }
                    );
                    this.emitResponse(socket, 'updateById:response', result, request);
                } catch (error: any) {
                    socket.emit('updateById:response', {
                        data: null,
                        message: 'Error updating document',
                        success: false,
                        error: error.message
                    });
                }
            });

            // Delete By Id
            socket.on('deleteById', async (data: string) => {
                try {
                    const request: SocketRequest = JSON.parse(data);
                    
                    if (!await this.checkPermission(socket, 'deleteById', request)) {
                        socket.emit('deleteById:response', {
                            data: null,
                            message: 'Unauthorized',
                            success: false,
                            error: 'Unauthorized access',
                            tag: request.tag
                        });
                        return;
                    }

                    const result = await this.model.findByIdAndDelete(request._id);
                    this.emitResponse(socket, 'deleteById:response', result, request);
                } catch (error: any) {
                    socket.emit('deleteById:response', {
                        data: null,
                        message: 'Error deleting document',
                        success: false,
                        error: error.message
                    });
                }
            });

            // Disconnect handler
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }
}
