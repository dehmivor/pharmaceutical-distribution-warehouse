const mongoose = require('mongoose');  
const CycleCountFormModel = require('../models/CycleCountForm.model')

const getDetailForManager = async (req, res) => {
    try {
        const db = mongoose.connection.db;

        // 1. Get all collection info
        const collectionsInfo = await db.listCollections().toArray();
        const collectionNames = collectionsInfo.map(c => c.name);

        // 2. For each collection, fetch all docs
        const data = await Promise.all(
            collectionNames.map(async name => {
                const docs = await db.collection(name).find({}).toArray();
                return { name, docs };
            })
        );

        // 3. Return as an object: { collectionName: [ ...docs ] }
        const result = data.reduce((acc, { name, docs }) => {
            acc[name] = docs;
            return acc;
        }, {});

        return res.status(200).json({
            success: true,
            collections: result
        });

    } catch (error) {
        return res.status(500).json({ message: error });
    }
}

module.exports = {
    getDetailForManager
}