import dotenv from 'dotenv';
dotenv.config();

import app from './app.ts';
import prisma from './client.ts';
import { serve } from '@hono/node-server';

let server: any;

console.log('Starting');
async function main() {
    try {
        await prisma.$connect();
    } catch (error) {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    }

    server = serve({
        fetch: app.fetch,
        port: (process.env.PORT || 3000) as number
    });

    const gracefulShutdown = async (signal: string) => {
        console.log(`Received ${signal}. Shutting down gracefully...`);
        if (server) {
            server.close(async () => {
                await prisma.$disconnect();
                process.exit(0);
            });
        } else {
            await prisma.$disconnect();
            process.exit(0);
        }
    };

    const exitHandler = async () => {
        if (server) {
            server.close(async () => {
                await prisma.$disconnect();
                process.exit(1);
            });
        } else {
            await prisma.$disconnect();
            process.exit(1);
        }
    };

    const unexpectedErrorHandler = (error: any) => {
        console.error('Unexpected error:', error);
        exitHandler();
    };

    process.on('uncaughtException', unexpectedErrorHandler);
    process.on('unhandledRejection', unexpectedErrorHandler);

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
