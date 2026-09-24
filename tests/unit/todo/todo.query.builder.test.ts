import { describe, it, expect } from 'vitest'
import { TodoQueryBuilder } from '../../../src/builders/todo.query.builder.js'
import {
    TodoSort,
    TodoStatus
} from '../../../src/types/todo.enum.js'
import { TodoQSDto } from '../../../src/validations/todo.validation.js'
import { SortType } from '../../../src/types/sort.type.js'


describe('TodoQueryBuilder', () => {

    describe('buildWhere', () => {

        it('should build query with default showDeleted = No', () => {

            const qs = {
                page: 1,
                limit: 15,
                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC,
                showDeleted: 'No'
            } as TodoQSDto

            const result = TodoQueryBuilder.buildWhere(qs)

            expect(result).toEqual({
                $and: [
                    {
                        deletedAt: {
                            $eq: null
                        }
                    }
                ]
            })
        })


        it('should filter by search query', () => {

            const qs = {
                page: 1,
                limit: 15,
                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC,
                showDeleted: 'All',
                q: 'typescript'
            } as TodoQSDto

            const result = TodoQueryBuilder.buildWhere(qs)

            expect(result).toEqual({
                $and: [
                    {
                        $or: [
                            {
                                title: {
                                    $regex: 'typescript',
                                    $options: 'i'
                                }
                            },
                            {
                                description: {
                                    $regex: 'typescript',
                                    $options: 'i'
                                }
                            }
                        ]
                    }
                ]
            })
        })


        it('should filter by priority', () => {

            const qs = {
                page: 1,
                limit: 15,
                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC,
                showDeleted: 'All',
                priority: 5
            } as TodoQSDto

            const result = TodoQueryBuilder.buildWhere(qs)

            expect(result).toEqual({
                $and: [
                    {
                        priority: 5
                    }
                ]
            })
        })


        it('should filter by status', () => {

            const qs = {
                page: 1,
                limit: 15,
                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC,
                showDeleted: 'All',
                status: TodoStatus.COMPLETED
            } as TodoQSDto

            const result = TodoQueryBuilder.buildWhere(qs)

            expect(result).toEqual({
                $and: [
                    {
                        status: TodoStatus.COMPLETED
                    }
                ]
            })
        })


        it('should include only deleted todos when showDeleted is Yes', () => {

            const qs = {
                page: 1,
                limit: 15,
                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC,
                showDeleted: 'Yes'
            } as TodoQSDto

            const result = TodoQueryBuilder.buildWhere(qs)

            expect(result).toEqual({
                $and: [
                    {
                        deletedAt: {
                            $ne: null
                        }
                    }
                ]
            })
        })


        it('should include both deleted and active todos when showDeleted is All', () => {

            const qs = {
                page: 1,
                limit: 15,
                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC,
                showDeleted: 'All'
            } as TodoQSDto

            const result = TodoQueryBuilder.buildWhere(qs)

            expect(result).toEqual({
                $and: []
            })
        })


        it('should filter by createdAt from date', () => {

            const from = new Date('2026-09-01')

            const qs = {
                page: 1,
                limit: 15,
                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC,
                showDeleted: 'All',
                from
            } as TodoQSDto

            const result = TodoQueryBuilder.buildWhere(qs)

            expect(result).toEqual({
                $and: [
                    {
                        createdAt: {
                            $gte: from
                        }
                    }
                ]
            })
        })


        it('should filter by createdAt to date', () => {

            const to = new Date('2026-09-10')

            const qs = {
                page: 1,
                limit: 15,
                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC,
                showDeleted: 'All',
                to
            } as TodoQSDto

            const result = TodoQueryBuilder.buildWhere(qs)

            expect(result).toEqual({
                $and: [
                    {
                        createdAt: {
                            $lte: to
                        }
                    }
                ]
            })
        })


        it('should filter by createdAt date range', () => {

            const from = new Date('2026-09-01')
            const to = new Date('2026-09-10')

            const qs = {
                page: 1,
                limit: 15,
                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC,
                showDeleted: 'All',
                from,
                to
            } as TodoQSDto

            const result = TodoQueryBuilder.buildWhere(qs)

            expect(result).toEqual({
                $and: [
                    {
                        createdAt: {
                            $gte: from,
                            $lte: to
                        }
                    }
                ]
            })
        })


        it('should filter by dueDate from date', () => {

            const dueFrom = new Date('2026-09-01')

            const qs = {
                page: 1,
                limit: 15,
                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC,
                showDeleted: 'All',
                dueFrom
            } as TodoQSDto

            const result = TodoQueryBuilder.buildWhere(qs)

            expect(result).toEqual({
                $and: [
                    {
                        dueDate: {
                            $gte: dueFrom
                        }
                    }
                ]
            })
        })


        it('should filter by dueDate to date', () => {

            const dueTo = new Date('2026-09-20')

            const qs = {
                page: 1,
                limit: 15,
                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC,
                showDeleted: 'All',
                dueTo
            } as TodoQSDto

            const result = TodoQueryBuilder.buildWhere(qs)

            expect(result).toEqual({
                $and: [
                    {
                        dueDate: {
                            $lte: dueTo
                        }
                    }
                ]
            })
        })


        it('should filter by dueDate date range', () => {

            const dueFrom = new Date('2026-09-01')
            const dueTo = new Date('2026-09-20')

            const qs = {
                page: 1,
                limit: 15,
                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC,
                showDeleted: 'All',
                dueFrom,
                dueTo
            } as TodoQSDto

            const result = TodoQueryBuilder.buildWhere(qs)

            expect(result).toEqual({
                $and: [
                    {
                        dueDate: {
                            $gte: dueFrom,
                            $lte: dueTo
                        }
                    }
                ]
            })
        })


        it('should build all filters together', () => {

            const from = new Date('2026-09-01')
            const to = new Date('2026-09-10')

            const dueFrom = new Date('2026-09-11')
            const dueTo = new Date('2026-09-20')

            const qs = {
                page: 2,
                limit: 10,
                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC,

                q: 'mongoose',
                priority: 8,
                status: TodoStatus.PENDING,

                showDeleted: 'Yes',

                from,
                to,

                dueFrom,
                dueTo
            } as TodoQSDto

            const result = TodoQueryBuilder.buildWhere(qs)

            expect(result).toEqual({
                $and: [
                    {
                        $or: [
                            {
                                title: {
                                    $regex: 'mongoose',
                                    $options: 'i'
                                }
                            },
                            {
                                description: {
                                    $regex: 'mongoose',
                                    $options: 'i'
                                }
                            }
                        ]
                    },
                    {
                        priority: 8
                    },
                    {
                        status: TodoStatus.PENDING
                    },
                    {
                        deletedAt: {
                            $ne: null
                        }
                    },
                    {
                        createdAt: {
                            $gte: from,
                            $lte: to
                        }
                    },
                    {
                        dueDate: {
                            $gte: dueFrom,
                            $lte: dueTo
                        }
                    }
                ]
            })
        })
    })

    describe('buildOrder', () => {

        it('should sort by createdAt ascending', () => {

            const qs = {
                sort: TodoSort.CREATEDAT,
                sortType: SortType.ASC
            } as TodoQSDto

            const result = TodoQueryBuilder.buildOrder(qs)

            expect(result).toEqual({
                createdAt: 1,
                _id: 1
            })
        })


        it('should sort by createdAt descending', () => {

            const qs = {
                sort: TodoSort.CREATEDAT,
                sortType: SortType.DESC
            } as TodoQSDto

            const result = TodoQueryBuilder.buildOrder(qs)

            expect(result).toEqual({
                createdAt: -1,
                _id: -1
            })
        })


        it('should sort by priority ascending', () => {

            const qs = {
                sort: TodoSort.PRIORITY,
                sortType: SortType.ASC
            } as TodoQSDto

            const result = TodoQueryBuilder.buildOrder(qs)

            expect(result).toEqual({
                priority: 1,
                _id: 1
            })
        })


        it('should sort by priority descending', () => {

            const qs = {
                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC
            } as TodoQSDto

            const result = TodoQueryBuilder.buildOrder(qs)

            expect(result).toEqual({
                priority: -1,
                _id: -1
            })
        })


        it('should sort by dueDate ascending', () => {

            const qs = {
                sort: TodoSort.DUEDATE,
                sortType: SortType.ASC
            } as TodoQSDto

            const result = TodoQueryBuilder.buildOrder(qs)

            expect(result).toEqual({
                dueDate: 1,
                _id: 1
            })
        })


        it('should sort by dueDate descending', () => {

            const qs = {
                sort: TodoSort.DUEDATE,
                sortType: SortType.DESC
            } as TodoQSDto

            const result = TodoQueryBuilder.buildOrder(qs)

            expect(result).toEqual({
                dueDate: -1,
                _id: -1
            })
        })
    })

    describe('build', () => {

        it('should build complete query options', () => {

            const qs = {
                page: 3,
                limit: 10,

                sort: TodoSort.PRIORITY,
                sortType: SortType.DESC,

                showDeleted: 'No',

                q: 'typescript',
                priority: 7,
                status: TodoStatus.PENDING
            } as TodoQSDto

            const result = TodoQueryBuilder.build(qs)

            expect(result).toEqual({
                limit: 10,
                skip: 20,

                where: {
                    $and: [
                        {
                            $or: [
                                {
                                    title: {
                                        $regex: 'typescript',
                                        $options: 'i'
                                    }
                                },
                                {
                                    description: {
                                        $regex: 'typescript',
                                        $options: 'i'
                                    }
                                }
                            ]
                        },
                        {
                            priority: 7
                        },
                        {
                            status: TodoStatus.PENDING
                        },
                        {
                            deletedAt: {
                                $eq: null
                            }
                        }
                    ]
                },

                sort: {
                    priority: -1,
                    _id: -1
                }
            })
        })


        it('should calculate skip correctly for first page', () => {

            const qs = {
                page: 1,
                limit: 15,

                sort: TodoSort.CREATEDAT,
                sortType: SortType.ASC,

                showDeleted: 'All'
            } as TodoQSDto

            const result = TodoQueryBuilder.build(qs)

            expect(result.skip)
                .toBe(0)

            expect(result.limit)
                .toBe(15)
        })


        it('should calculate skip correctly for later pages', () => {

            const qs = {
                page: 5,
                limit: 20,

                sort: TodoSort.CREATEDAT,
                sortType: SortType.ASC,

                showDeleted: 'All'
            } as TodoQSDto

            const result = TodoQueryBuilder.build(qs)

            expect(result.skip)
                .toBe(80)

            expect(result.limit)
                .toBe(20)
        })


        it('should use createdAt descending order correctly', () => {

            const qs = {
                page: 1,
                limit: 15,

                sort: TodoSort.CREATEDAT,
                sortType: SortType.DESC,

                showDeleted: 'All'
            } as TodoQSDto

            const result = TodoQueryBuilder.build(qs)

            expect(result.sort)
                .toEqual({
                    createdAt: -1,
                    _id: -1
                })
        })


        it('should use priority ascending order correctly', () => {

            const qs = {
                page: 1,
                limit: 15,

                sort: TodoSort.PRIORITY,
                sortType: SortType.ASC,

                showDeleted: 'All'
            } as TodoQSDto

            const result = TodoQueryBuilder.build(qs)

            expect(result.sort)
                .toEqual({
                    priority: 1,
                    _id: 1
                })
        })


        it('should use dueDate descending order correctly', () => {

            const qs = {
                page: 2,
                limit: 10,

                sort: TodoSort.DUEDATE,
                sortType: SortType.DESC,

                showDeleted: 'All'
            } as TodoQSDto

            const result = TodoQueryBuilder.build(qs)

            expect(result.sort)
                .toEqual({
                    dueDate: -1,
                    _id: -1
                })

            expect(result.skip)
                .toBe(10)
        })
    })
})