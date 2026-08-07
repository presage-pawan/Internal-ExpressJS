import { body } from "express-validator";
import { getConnection } from "../../_db/index.js";
import { AssignedCompaniesModel } from "../../schemas/assigned-companies.model.js";

export class AssignedCompaniesService {

    constructor(dbType = 'production') {
        this.dbType = dbType;
    }

    get model() {
        const connection = getConnection(this.dbType, 'website')
        return AssignedCompaniesModel(connection);
    }

    getCompByUserId = async (filter) => {
        return this.model.find(filter);
    }

    upsertByUserId = async (body, userId) => {
        const { user_id, db_type, ...data } = body;

        return await this.model.findOneAndUpdate(
            {
                user_id,
                db_type
            },
            {
                $set: {
                    ...data,
                    updatedBy: userId
                },
                $setOnInsert: {
                    user_id,
                    createdBy: userId
                }
            },
            {
                new: true,
                upsert: true
            }
        );
    }

}