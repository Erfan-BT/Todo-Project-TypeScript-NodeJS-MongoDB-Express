import { SortType } from "../types/sort.type.js";
import { TodoSort } from "../types/todo.enum.js";
import { escapeRegex } from "../utils/escape.regex.js";
import { TodoQSDto } from "../validations/todo.validation.js";

export class TodoQuaryBuilder {
    static build (qs : TodoQSDto) {
        const page = qs.page
        const limit = qs.limit
        const skip = (page - 1) * limit

        const where = this.buildWhere(qs)
        const sort = this.buildOrder(qs)

        return {
            limit,
            skip,
            where,
            sort
        }
    }

    static buildWhere (qs : TodoQSDto) {
        let where = []

        if (qs.q !== undefined) {
            const q = escapeRegex(qs.q)
            where.push({
                $or: [
                    {
                        title: {
                            $regex: q,
                            $options: 'i'
                        }
                    },
                    {
                        description: {
                            $regex: q,
                            $options: 'i'
                        }
                    }
                ]
            })
        }

        if (qs.priority !== undefined)
            where.push({
                priority : qs.priority
            })

        if (qs.status !== undefined)
            where.push({
                status : qs.status
            })

        if (qs.showDeleted !== 'All')
            where.push({
                deletedAt : qs.showDeleted === 'Yes' ? { $ne : null } : { $eq : null }
            })

        const dateCondition: {
            $gte ?: Date;
            $lte ?: Date;
        } = {};

        if (qs.from !== undefined)
            dateCondition.$gte = qs.from

        if (qs.to !== undefined)
            dateCondition.$lte = qs.to

        if (Object.keys(dateCondition).length) {
            where.push({
                createdAt : dateCondition
            })
        }

        const dueDateCondition: {
            $gte ?: Date;
            $lte ?: Date;
        } = {};

        if (qs.dueFrom !== undefined)
            dueDateCondition.$gte = qs.dueFrom

        if (qs.dueTo !== undefined)
            dueDateCondition.$lte = qs.dueTo

        if (Object.keys(dueDateCondition).length) {
            where.push({
                dueDate : dueDateCondition
            })
        }

        return {
            $and : where
        }
    }

    static buildOrder (qs : TodoQSDto) {
        const sortType = qs.sortType === SortType.ASC ? 1 : -1
        switch (qs.sort) {
            case TodoSort.CREATEDAT:
                return { createdAt : sortType, _id: sortType }

            case TodoSort.PRIORITY:
                return { priority : sortType, _id: sortType }

            case TodoSort.DUEDATE:
                return { dueDate : sortType, _id: sortType }
        
            default:
                return { createdAt : sortType, _id: sortType }
        }

    }
}