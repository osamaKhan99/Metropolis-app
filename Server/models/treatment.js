const mongoose = require('mongoose');

const TreatmentSchema = mongoose.Schema({
    Ap_id: {
        type: String,
    },
    treatment: {
        type: String
    }
})

const Treatment = mongoose.model('Treatment', TreatmentSchema)
module.exports = { Treatment }