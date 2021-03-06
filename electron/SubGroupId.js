const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SubGroupIdSchema = new Schema({
    subGroupId: {
        type: String,
        unique: true,
        required: true
    },
    unavailableHours: {
        type: Object,
        default: null
    },
    dateCreated: {
        type: Date,
        default: Date.now
    }
});

// eslint-disable-next-line no-undef
module.exports = SubGroupId = mongoose.model('subGroupId', SubGroupIdSchema)