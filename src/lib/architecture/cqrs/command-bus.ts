/**
 * CQRS Command Bus Implementation
 * Handles command routing and execution with middleware support
 */

import { DomainError } from '../../domain/entities/base';

/**
 * Base Command Interface
 */
export interface Command {
  readonly commandId: string;
  readonly timestamp: Date;
  readonly userId?: string;
  readonly tenantId: string;
  readonly correlationId: string;
}

/**
 * Command Result Interface
 */
export interface CommandResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string[]>;
}

/**
 * Command Handler Interface
 */
export interface CommandHandler<TCommand extends Command, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

/**
 * Command Middleware Interface
 */
export interface CommandMiddleware {
  execute<TCommand extends Command>(
    command: TCommand,
    next: (command: TCommand) => Promise<any>
  ): Promise<any>;
}

/**
 * Command Bus Implementation
 */
export class CommandBus {
  private handlers = new Map<string, CommandHandler<any, any>>();
  private middleware: CommandMiddleware[] = [];

  /**
   * Register a command handler
   */
  register<TCommand extends Command, TResult>(
    commandType: string,
    handler: CommandHandler<TCommand, TResult>
  ): void {
    if (this.handlers.has(commandType)) {
      throw new Error(`Handler for command ${commandType} already registered`);
    }
    this.handlers.set(commandType, handler);
  }

  /**
   * Add middleware to the command processing pipeline
   */
  use(middleware: CommandMiddleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Execute a command through the middleware pipeline
   */
  async execute<TCommand extends Command, TResult>(
    command: TCommand
  ): Promise<CommandResult<TResult>> {
    try {
      const commandType = command.constructor.name;
      const handler = this.handlers.get(commandType);

      if (!handler) {
        throw new DomainError(`No handler registered for command ${commandType}`, 'NO_HANDLER');
      }

      // Build middleware chain
      let index = 0;
      const executeNext = async (cmd: TCommand): Promise<TResult> => {
        if (index < this.middleware.length) {
          const middleware = this.middleware[index++];
          return middleware.execute(cmd, executeNext);
        }
        return handler.handle(cmd);
      };

      const result = await executeNext(command);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          validationErrors: error.errors,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Base Command Class
 */
export abstract class BaseCommand implements Command {
  readonly commandId: string;
  readonly timestamp: Date;
  readonly correlationId: string;

  constructor(
    public readonly userId: string | undefined,
    public readonly tenantId: string,
    correlationId?: string
  ) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
    this.correlationId = correlationId || crypto.randomUUID();
  }
}

/**
 * Validation Error for command validation failures
 */
export class ValidationError extends Error {
  constructor(public readonly errors: Record<string, string[]>) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

/**
 * Command Validation Middleware
 */
export class ValidationMiddleware implements CommandMiddleware {
  private validators = new Map<string, CommandValidator<any>>();

  register<TCommand extends Command>(
    commandType: string,
    validator: CommandValidator<TCommand>
  ): void {
    this.validators.set(commandType, validator);
  }

  async execute<TCommand extends Command>(
    command: TCommand,
    next: (command: TCommand) => Promise<any>
  ): Promise<any> {
    const commandType = command.constructor.name;
    const validator = this.validators.get(commandType);

    if (validator) {
      const validationResult = await validator.validate(command);
      if (!validationResult.isValid) {
        throw new ValidationError(validationResult.errors);
      }
    }

    return next(command);
  }
}

/**
 * Logging Middleware
 */
export class LoggingMiddleware implements CommandMiddleware {
  async execute<TCommand extends Command>(
    command: TCommand,
    next: (command: TCommand) => Promise<any>
  ): Promise<any> {
    const start = Date.now();
    const commandType = command.constructor.name;

    try {
      console.log(`[CommandBus] Executing command: ${commandType}`, {
        commandId: command.commandId,
        userId: command.userId,
        tenantId: command.tenantId,
        correlationId: command.correlationId,
      });

      const result = await next(command);

      const duration = Date.now() - start;
      console.log(`[CommandBus] Command completed: ${commandType}`, {
        commandId: command.commandId,
        duration: `${duration}ms`,
        success: true,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[CommandBus] Command failed: ${commandType}`, {
        commandId: command.commandId,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }
}

/**
 * Authorization Middleware
 */
export class AuthorizationMiddleware implements CommandMiddleware {
  private authorizers = new Map<string, CommandAuthorizer<any>>();

  register<TCommand extends Command>(
    commandType: string,
    authorizer: CommandAuthorizer<TCommand>
  ): void {
    this.authorizers.set(commandType, authorizer);
  }

  async execute<TCommand extends Command>(
    command: TCommand,
    next: (command: TCommand) => Promise<any>
  ): Promise<any> {
    const commandType = command.constructor.name;
    const authorizer = this.authorizers.get(commandType);

    if (authorizer) {
      const isAuthorized = await authorizer.authorize(command);
      if (!isAuthorized) {
        throw new DomainError('Unauthorized to execute command', 'UNAUTHORIZED');
      }
    }

    return next(command);
  }
}

/**
 * Transaction Middleware
 */
export class TransactionMiddleware implements CommandMiddleware {
  constructor(private transactionManager: TransactionManager) {}

  async execute<TCommand extends Command>(
    command: TCommand,
    next: (command: TCommand) => Promise<any>
  ): Promise<any> {
    return this.transactionManager.execute(async () => {
      return next(command);
    });
  }
}

/**
 * Supporting Interfaces
 */
export interface CommandValidator<TCommand extends Command> {
  validate(command: TCommand): Promise<ValidationResult>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export interface CommandAuthorizer<TCommand extends Command> {
  authorize(command: TCommand): Promise<boolean>;
}

export interface TransactionManager {
  execute<T>(operation: () => Promise<T>): Promise<T>;
}

/**
 * Example Command Implementation
 */
export class CreateBookingCommand extends BaseCommand {
  constructor(
    public readonly branchId: string,
    public readonly customerId: string,
    public readonly scheduledAt: Date,
    public readonly services: {
      serviceId: string;
      staffId?: string;
    }[],
    public readonly notes?: string,
    userId?: string,
    tenantId: string = '',
    correlationId?: string
  ) {
    super(userId, tenantId, correlationId);
  }
}

/**
 * Example Command Validator
 */
export class CreateBookingCommandValidator implements CommandValidator<CreateBookingCommand> {
  async validate(command: CreateBookingCommand): Promise<ValidationResult> {
    const errors: Record<string, string[]> = {};

    if (!command.branchId) {
      errors.branchId = ['Branch ID is required'];
    }

    if (!command.customerId) {
      errors.customerId = ['Customer ID is required'];
    }

    if (!command.scheduledAt) {
      errors.scheduledAt = ['Scheduled date/time is required'];
    } else if (command.scheduledAt <= new Date()) {
      errors.scheduledAt = ['Scheduled date/time must be in the future'];
    }

    if (!command.services || command.services.length === 0) {
      errors.services = ['At least one service is required'];
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

/**
 * Command Bus Factory
 */
export class CommandBusFactory {
  static create(): CommandBus {
    const commandBus = new CommandBus();

    // Add default middleware
    commandBus.use(new LoggingMiddleware());
    commandBus.use(new ValidationMiddleware());
    commandBus.use(new AuthorizationMiddleware());

    return commandBus;
  }

  static createWithTransaction(transactionManager: TransactionManager): CommandBus {
    const commandBus = new CommandBus();

    // Add middleware in order
    commandBus.use(new LoggingMiddleware());
    commandBus.use(new ValidationMiddleware());
    commandBus.use(new AuthorizationMiddleware());
    commandBus.use(new TransactionMiddleware(transactionManager));

    return commandBus;
  }
}