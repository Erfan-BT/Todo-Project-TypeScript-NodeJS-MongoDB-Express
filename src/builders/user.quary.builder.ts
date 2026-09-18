import { UserSort, UserSortType } from "../types/user.enum.js"
import { UserQSDto } from "../validations/auth.validation.js"

export class UserQuaryBuilder {
    static build (qs : UserQSDto) {
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

    static buildWhere (qs : UserQSDto) {
        let where = []

        if (qs.q !== undefined) {
            where.push({
                $or: [
                    {
                        username : {
                            $regex: qs.q,
                            $options: 'i'
                        }
                    },
                    {
                        fullname : {
                            $regex: qs.q,
                            $options: 'i'
                        }
                    }
                ]
            })
        }

        if (qs.status !== undefined)
            where.push({
                active : qs.status
            })

        if (qs.role !== undefined)
            where.push({
                role : qs.role
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

    static buildOrder (qs : UserQSDto) {
        const sortType = qs.sortType === UserSortType.ASC ? 1 : -1
        switch (qs.sort) {
            case UserSort.CREATEDAT:
                return { createdAt : sortType, _id: sortType }

            case UserSort.USERNAME:
                return { username : sortType, _id: sortType }

            case UserSort.FULLNAME:
                return { fullname : sortType, _id: sortType }
        
            default:
                return { createdAt : sortType, _id: sortType }
        }

    }
}