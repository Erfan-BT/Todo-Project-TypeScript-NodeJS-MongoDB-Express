import { AuditSort } from "../types/audit.enum.js"
import { SortType } from "../types/sort.type.js"
import { escapeRegex } from "../utils/escape.regex.js"
import { AuditQSDto } from "../validations/audit.validation.js"

export class AuditQueryBuilder {
    static build (qs : AuditQSDto) {
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

    static buildWhere (qs : AuditQSDto) {
        let where = []

        if (qs.q !== undefined) {
            const q = escapeRegex(qs.q)
            where.push({
                $or: [
                    {
                        adminId : {
                            $regex: q,
                            $options: 'i'
                        }
                    },
                    {
                        entityId : {
                            $regex: q,
                            $options: 'i'
                        }
                    },
                    {
                        reason : {
                            $regex: q,
                            $options: 'i'
                        }
                    },
                    {
                        ipAddress : {
                            $regex: q,
                            $options: 'i'
                        }
                    }
                ]
            })
        }

        if (qs.action !== undefined)
            where.push({
                action : qs.action
            })

        if (qs.entityType !== undefined)
            where.push({
                entityType : qs.entityType
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

        if(!where.length)
            return {}

        return {
            $and : where
        }
    }

    static buildOrder (qs : AuditQSDto) {
        const sortType = qs.sortType === SortType.ASC ? 1 : -1
        switch (qs.sort) {
            case AuditSort.CREATEDAT:
                return { createdAt : sortType, _id: sortType }

            case AuditSort.ACTION:
                return { action : sortType, _id: sortType }

            case AuditSort.ENTITYTYPE:
                return { entityType : sortType, _id: sortType }
        
            default:
                return { createdAt : sortType, _id: sortType }
        }

    }
}