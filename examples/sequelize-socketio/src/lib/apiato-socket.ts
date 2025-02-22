import { Server, Socket } from 'socket.io';
import { Model, ModelStatic } from 'sequelize';

type ResponseType = 'private' | 'broadcast' | 'room';

interface QueryParams {
    where?: Record<string, any>;
    whereObject?: Record<string, any>;
    like?: Record<string, any>;
    paginate?: { page: number; limit: number };
    sort?: Record<string, 'ASC' | 'DESC'>;
    attributes?: string[];
    include?: any[];
}

interface SocketRequest {
    responseType?: ResponseType;
    room?: string;
    body?: any;
    id?: number;
    query?: QueryParams;
    options?: any;
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
    private model: ModelStatic<Model>;
    private middleware?: MiddlewareFunction;

    constructor(io: Server, model: ModelStatic<Model>, middleware?: MiddlewareFunction) {
        this.io = io;
        this.model = model;
        this.middleware = middleware;
        this.initializeSocketHandlers();
    }

    private async checkPermission(socket: Socket, operation: string, data: any): Promise<boolean> {
        if (!this.middleware) return true;
        return await this.middleware({
            operation,
            model: this.model.name,
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
                        message: 'Error creating record',
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

                    const query: any = {
                        where: request.query?.where || {},
                    };

                    if (request.query?.attributes) {
                        query.attributes = request.query.attributes;
                    }
                    if (request.query?.include) {
                        query.include = request.query.include;
                    }
                    if (request.query?.sort) {
                        query.order = Object.entries(request.query.sort).map(([key, value]) => [key, value]);
                    }
                    if (request.query?.paginate) {
                        const { page = 1, limit = 10 } = request.query.paginate;
                        query.offset = (page - 1) * limit;
                        query.limit = limit;
                    }

                    const result = await this.model.findAll(query);
                    this.emitResponse(socket, 'getMany:response', result, request);
                } catch (error: any) {
                    socket.emit('getMany:response', {
                        data: null,
                        message: 'Error retrieving records',
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

                    const query: any = {
                        where: { id: request.id }
                    };

                    if (request.query?.attributes) {
                        query.attributes = request.query.attributes;
                    }
                    if (request.query?.include) {
                        query.include = request.query.include;
                    }

                    const result = await this.model.findOne(query);
                    this.emitResponse(socket, 'getOneById:response', result, request);
                } catch (error: any) {
                    socket.emit('getOneById:response', {
                        data: null,
                        message: 'Error retrieving record',
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

                    const [affectedCount] = await this.model.update(request.body, {
                        where: { id: request.id }
                    });

                    if (affectedCount === 0) {
                        socket.emit('updateById:response', {
                            data: null,
                            message: 'Record not found',
                            success: false,
                            error: 'Record not found',
                            tag: request.tag
                        });
                        return;
                    }

                    const result = await this.model.findByPk(request.id);
                    this.emitResponse(socket, 'updateById:response', result, request);
                } catch (error: any) {
                    socket.emit('updateById:response', {
                        data: null,
                        message: 'Error updating record',
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

                    const record = await this.model.findByPk(request.id);
                    if (!record) {
                        socket.emit('deleteById:response', {
                            data: null,
                            message: 'Record not found',
                            success: false,
                            error: 'Record not found',
                            tag: request.tag
                        });
                        return;
                    }

                    await record.destroy();
                    this.emitResponse(socket, 'deleteById:response', record, request);
                } catch (error: any) {
                    socket.emit('deleteById:response', {
                        data: null,
                        message: 'Error deleting record',
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
