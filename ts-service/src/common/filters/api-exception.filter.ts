import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * ApiExceptionFilter captures all exceptions thrown within the application 
 * and transforms them into a standardized, professional JSON response.
 * 
 * This ensures that error reporting follows a consistent schema and that
 * sensitive implementation details are not inadvertently leaked.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(ApiExceptionFilter.name);

    /**
     * Catches and formats the exception.
     * 
     * @param exception - The caught exception.
     * @param host - The execution context.
     */
    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse =
            exception instanceof HttpException
                ? exception.getResponse()
                : { message: 'An unexpected internal error occurred' };

        const message =
            typeof exceptionResponse === 'object' && 'message' in (exceptionResponse as any)
                ? (exceptionResponse as any).message
                : exceptionResponse;

        // Strategic logging of non-HTPP exceptions for diagnostic purposes
        if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `Critical System Exception: ${request.method} ${request.url}`,
                exception instanceof Error ? exception.stack : JSON.stringify(exception),
            );
        } else {
            this.logger.warn(
                `Client Request Exception [${status}]: ${request.method} ${request.url} - ${JSON.stringify(message)}`,
            );
        }

        // Standardized professional error schema
        response.status(status).json({
            success: false,
            error: {
                code: status,
                type: exception instanceof HttpException ? exception.name : 'InternalServerError',
                message: Array.isArray(message) ? message[0] : message,
                details: Array.isArray(message) ? message : undefined,
            },
            meta: {
                timestamp: new Date().toISOString(),
                path: request.url,
            },
        });
    }
}
