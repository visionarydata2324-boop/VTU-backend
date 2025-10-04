"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedData = void 0;
const dataPlans_1 = require("../models/dataPlans");
const dataList_1 = require("../config/dataList");
const seedData = async () => {
    for (const [provider, bundles] of Object.entries(dataList_1.dataList)) {
        for (const plan of bundles) {
            const data = new dataPlans_1.Data({ networkProvider: provider, plan });
            await data.save();
        }
    }
    console.log('Data seeded successfully');
};
exports.seedData = seedData;
(0, exports.seedData)().catch((err) => console.error('Error seeding data:', err));
