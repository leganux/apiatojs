import { Server, Socket } from 'socket.io';
import { Model, ModelStatic, Op, FindOptions, WhereOptions, Includeable } from 'sequelize';

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

export class ApiatoSocketSQL {
  private io: Server;
  private model: ModelStatic<Model>;
  private idField: string;
  private middleware?: MiddlewareFunction;

  constructor(io: Server, model: ModelStatic<Model>, idField: string = '_id', middleware?: MiddlewareFunction) {
    this.io = io;
    this.model = model;
    this.idField = idField;
    this.initializeSocketHandlers();
  }

  private buildQuery(params: QueryParams = {}) {
    const where: WhereOptions = {};
    const attributes: string[] = [];
    const include: Includeable[] = [];
    let order: [string, string][] = [];
    let offset = 0;
    let limit = 0;

    // Process where conditions
    if (params.where) {
      Object.assign(where, params.where);
    }

    // Process whereObject conditions
    if (params.whereObject) {
      Object.assign(where, params.whereObject);
    }

    // Process like conditions
    if (params.like) {
      Object.entries(params.like).forEach(([key, value]) => {
        where[key] = { [Op.like]: `%${value}%` };
      });
    }

    // Process pagination
    if (params.paginate) {
      const { page = 1, limit: pageLimit = 10 } = params.paginate;
      offset = (page - 1) * pageLimit;
      limit = pageLimit;
    }

    // Process sort
    if (params.sort) {
      order = Object.entries(params.sort).map(([key, value]) => [key, value]);
    }

    // Process select
    if (params.select) {
      Object.entries(params.select).forEach(([key, value]) => {
        if (value === 1) {
          attributes.push(key);
        }
      });
    }

    // Process populate (associations)
    if (params.populate) {
      Object.entries(params.populate).forEach(([key, value]) => {
        if (value === 1) {
          include.push({ model: this.model.associations[key].target });
        }
      });
    }

    return {
      where,
      attributes: attributes.length > 0 ? attributes : undefined,
      include: include.length > 0 ? include : undefined,
      order: order.length > 0 ? order : undefined,
      offset,
      limit: limit || undefined
    };
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

          const result = await this.model.bulkCreate(request.body);
          this.emitResponse(socket, 'createMany:response', result, request);
        } catch (error: any) {
          socket.emit('createMany:response', {
            data: null,
            message: 'Error creating records',
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
          const result = await this.model.findOne(query);
          this.emitResponse(socket, 'getOneWhere:response', result, request);
        } catch (error: any) {
          socket.emit('getOneWhere:response', {
            data: null,
            message: 'Error retrieving record',
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
          const result = await this.model.findByPk(request._id, query);
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

          await this.model.update(request.body, {
            where: { [this.idField]: request._id }
          });
          const result = await this.model.findByPk(request._id);
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
          const [result] = await this.model.findOrCreate({
            where: query.where,
            defaults: request.body
          });
          if (!result.isNewRecord) {
            await result.update(request.body);
          }
          this.emitResponse(socket, 'findUpdateOrCreate:response', result, request);
        } catch (error: any) {
          socket.emit('findUpdateOrCreate:response', {
            data: null,
            message: 'Error updating/creating record',
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
          await this.model.update(request.body, { where: query.where });
          const result = await this.model.findOne({ where: query.where });
          this.emitResponse(socket, 'findUpdate:response', result, request);
        } catch (error: any) {
          socket.emit('findUpdate:response', {
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

          const record = await this.model.findByPk(request._id);
          if (record) {
            await record.destroy();
            this.emitResponse(socket, 'deleteById:response', record, request);
          } else {
            socket.emit('deleteById:response', {
              data: null,
              message: 'Record not found',
              success: false,
              error: 'Record not found'
            });
          }
        } catch (error: any) {
          socket.emit('deleteById:response', {
            data: null,
            message: 'Error deleting record',
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
          const result = await this.model.findAndCountAll(query);
          this.emitResponse(socket, 'datatable:response', {
            data: result.rows,
            total: result.count,
            filtered: result.rows.length
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

      // Disconnect handler
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
}
