import { Prisma, PrismaClient } from './generated/prisma/index.js';
import dotenv from 'dotenv';

dotenv.config();

enum PrismaOperation {
    findUnique = 'findUnique',
    findUniqueOrThrow = 'findUniqueOrThrow',
    findMany = 'findMany',
    findFirst = 'findFirst',
    findFirstOrThrow = 'findFirstOrThrow',
    create = 'create',
    createMany = 'createMany',
    createManyAndReturn = 'createManyAndReturn',
    update = 'update',
    updateMany = 'updateMany',
    updateManyAndReturn = 'updateManyAndReturn',
    upsert = 'upsert',
    delete = 'delete',
    deleteMany = 'deleteMany',
    executeRaw = 'executeRaw',
    queryRaw = 'queryRaw',
    aggregate = 'aggregate',
    count = 'count',
    runCommandRaw = 'runCommandRaw',
    findRaw = 'findRaw',
    groupBy = 'groupBy'
}

const getGlobalFiltersExtension = () => {
    return Prisma.defineExtension({
        name: 'globalFilters',
        query: {
            $allModels: {
                async $allOperations({ operation, args, query }) {
                    const globalData = { isDeleted: false };

                    switch (operation) {
                        case PrismaOperation.findUnique:
                        case PrismaOperation.findUniqueOrThrow:
                            // For findUnique, we can only use unique fields.
                            // If isDeleted is not part of a unique index, adding it here will break the query.
                            // We assume unique fields are enough for findUnique.
                            break;
                        case PrismaOperation.findMany:
                        case PrismaOperation.findFirst:
                        case PrismaOperation.findFirstOrThrow:
                        case PrismaOperation.count:
                        case PrismaOperation.groupBy:
                        case PrismaOperation.aggregate:
                        case PrismaOperation.update:
                        case PrismaOperation.updateMany:
                        case PrismaOperation.updateManyAndReturn:
                        case PrismaOperation.delete:
                        case PrismaOperation.deleteMany:
                            if (args.where && (args.where as any).isDeleted !== undefined) {
                                // isDeleted is already specified, don't overwrite it
                                break;
                            }
                            args.where = {
                                ...globalData,
                                ...(args.where as { [key in string]?: any })
                            } as typeof args.where;
                            break;
                        case PrismaOperation.create:
                            if (args.data && typeof args.data === 'object' && (args.data as any).isDeleted === undefined)
                                args.data = {
                                    ...(globalData as any),
                                    ...(args.data as { [key in string]?: any })
                                } as typeof args.data;
                            break;
                        case PrismaOperation.createMany:
                        case PrismaOperation.createManyAndReturn:
                            if (args.data && Array.isArray(args.data))
                                for (let i = 0; i < args.data.length; i++) {
                                    const item = args.data[i];
                                    if (typeof item === 'object' && (item as any).isDeleted === undefined)
                                        args.data[i] = {
                                            ...(globalData as any),
                                            ...(item as { [key in string]?: any })
                                        } as (typeof args.data)[number];
                                }
                            break;

                        case PrismaOperation.upsert:
                            if (args.where && (args.where as any).isDeleted === undefined) {
                                args.where = {
                                    ...(globalData as any),
                                    ...(args.where as { [key in string]?: any })
                                } as typeof args.where;
                            }
                            if (args.create && typeof args.create === 'object' && (args.create as any).isDeleted === undefined)
                                args.create = {
                                    ...(globalData as any),
                                    ...(args.create as { [key in string]?: any })
                                } as typeof args.create;
                            break;
                        default:
                            break;
                    }

                    return await query(args);
                }
            }
        }
    });
};

const prismaClientSingleton = () => {
    let url = process.env.DATABASE_URL;
    if (url && !url.includes('connection_limit')) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}connection_limit=5`;
    }
    return new PrismaClient({
        datasources: {
            db: {
                url: url
            }
        }
    }).$extends(getGlobalFiltersExtension());
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
