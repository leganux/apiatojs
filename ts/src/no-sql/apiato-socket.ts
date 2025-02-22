import { Server, Socket } from 'socket.io';
import { Model, Types } from 'mongoose';

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
    this.initializeSocketHandlers();
  }

  private buildQuery(params: QueryParams = {}) {
    const filter: any = {};
    const select: any = {};
    const populate: any[] = [];
    let sort: any = {};
    let skip = 0;
    let limit = 0;

    // Process where conditions
    if (params.where) {
      Object.assign(filter, params.where);
    }

    // Process whereObject conditions (convert strings to ObjectIds)
    if (params.whereObject) {
      Object.entries(params.whereObject).forEach(([key, value]) => {
        filter[key] = new Types.ObjectId(value as string);
      });
    }

    // Process like conditions
    if (params.like) {
      Object.entries(params.like).forEach(([key, value]) => {
        filter[key] = { $regex: value, $options: 'i' };
      });
    }

    // Process pagination
    if (params.paginate) {
      const { page = 1, limit: pageLimit = 10 } = params.paginate;
      skip = (page - 1) * pageLimit;
      limit = pageLimit;
    }

    // Process sort
    if (params.sort) {
      sort = Object.entries(params.sort).reduce((acc, [key, value]) => {
        acc[key] = value === 'DESC' ? -1 : 1;
        return acc;
      }, {} as Record<string, number>);
    }

    // Process select
    if (params.select) {
      Object.assign(select, params.select);
    }

    // Process populate
    if (params.populate) {
      Object.entries(params.populate).forEach(([path, value]) => {
        if (value === 1) {
          populate.push({ path });
        }
      });
    }

    return { filter, select, populate, sort, skip, limit };
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

      // Create Many
      socket.on('createMany', async (data: string) => {
        try {
          const request: SocketRequest = JSON.parse(data);
          
          if (!await this.checkPermission(socket, 'createMany', request)) {
            socket.emit('createMany:response', {
              data: null,
              message: 'Unauthorized',
              success: false,
              error: 'Unauthorized access',
              tag: request.tag
            });
            return;
          }

          const result = await this.model.insertMany(request.body);
          this.emitResponse(socket, 'createMany:response', result, request);
        } catch (error: any) {
          socket.emit('createMany:response', {
            data: null,
            message: 'Error creating documents',
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

          const query = this.buildQuery(request.query);
          const result = await this.model.find(query.filter)
            .select(query.select)
            .populate(query.populate)
            .sort(query.sort)
            .skip(query.skip)
            .limit(query.limit);
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

      // Get One Where
      socket.on('getOneWhere', async (data: string) => {
        try {
          const request: SocketRequest = JSON.parse(data);
          
          if (!await this.checkPermission(socket, 'getOneWhere', request)) {
            socket.emit('getOneWhere:response', {
              data: null,
              message: 'Unauthorized',
              success: false,
              error: 'Unauthorized access',
              tag: request.tag
            });
            return;
          }

          const query = this.buildQuery(request.query);
          const result = await this.model.findOne(query.filter)
            .select(query.select)
            .populate(query.populate);
          this.emitResponse(socket, 'getOneWhere:response', result, request);
        } catch (error: any) {
          socket.emit('getOneWhere:response', {
            data: null,
            message: 'Error retrieving document',
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

          const query = this.buildQuery(request.query);
          const result = await this.model.findById(request._id)
            .select(query.select)
            .populate(query.populate);
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

      // Find Update Or Create
      socket.on('findUpdateOrCreate', async (data: string) => {
        try {
          const request: SocketRequest = JSON.parse(data);
          
          if (!await this.checkPermission(socket, 'findUpdateOrCreate', request)) {
            socket.emit('findUpdateOrCreate:response', {
              data: null,
              message: 'Unauthorized',
              success: false,
              error: 'Unauthorized access',
              tag: request.tag
            });
            return;
          }

          const query = this.buildQuery(request.query);
          const result = await this.model.findOneAndUpdate(
            query.filter,
            request.body,
            { new: true, upsert: true }
          );
          this.emitResponse(socket, 'findUpdateOrCreate:response', result, request);
        } catch (error: any) {
          socket.emit('findUpdateOrCreate:response', {
            data: null,
            message: 'Error updating/creating document',
            success: false,
            error: error.message
          });
        }
      });

      // Find Update
      socket.on('findUpdate', async (data: string) => {
        try {
          const request: SocketRequest = JSON.parse(data);
          
          if (!await this.checkPermission(socket, 'findUpdate', request)) {
            socket.emit('findUpdate:response', {
              data: null,
              message: 'Unauthorized',
              success: false,
              error: 'Unauthorized access',
              tag: request.tag
            });
            return;
          }

          const query = this.buildQuery(request.query);
          const result = await this.model.findOneAndUpdate(
            query.filter,
            request.body,
            { new: true }
          );
          this.emitResponse(socket, 'findUpdate:response', result, request);
        } catch (error: any) {
          socket.emit('findUpdate:response', {
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

      // Datatable
      socket.on('datatable', async (data: string) => {
        try {
          const request: SocketRequest = JSON.parse(data);
          
          if (!await this.checkPermission(socket, 'datatable', request)) {
            socket.emit('datatable:response', {
              data: null,
              message: 'Unauthorized',
              success: false,
              error: 'Unauthorized access',
              tag: request.tag
            });
            return;
          }

          const query = this.buildQuery(request.query);
          const result = await this.model.find(query.filter)
            .select(query.select)
            .populate(query.populate)
            .sort(query.sort)
            .skip(query.skip)
            .limit(query.limit);
          const total = await this.model.countDocuments(query.filter);
          this.emitResponse(socket, 'datatable:response', {
            data: result,
            total,
            filtered: result.length
          }, request);
        } catch (error: any) {
          socket.emit('datatable:response', {
            data: null,
            message: 'Error retrieving datatable',
            success: false,
            error: error.message
          });
        }
      });

      // Aggregate
      socket.on('aggregate', async (data: string) => {
        try {
          const request: SocketRequest = JSON.parse(data);
          
          if (!await this.checkPermission(socket, 'aggregate', request)) {
            socket.emit('aggregate:response', {
              data: null,
              message: 'Unauthorized',
              success: false,
              error: 'Unauthorized access',
              tag: request.tag
            });
            return;
          }

          const result = await this.model.aggregate(request.pipeline || []);
          this.emitResponse(socket, 'aggregate:response', result, request);
        } catch (error: any) {
          socket.emit('aggregate:response', {
            data: null,
            message: 'Error executing aggregate',
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
