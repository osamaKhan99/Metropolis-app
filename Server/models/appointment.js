const mongoose = require('mongoose');

const AppointmentSchema = mongoose.Schema({
    doc_id: {
        type: String,
        required: true,
    },
    patient_id: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'Pending'
    }
})

const Appointment = mongoose.model('Appointment', AppointmentSchema)

module.exports = { Appointment }