const mongoose = require('mongoose')
const config = require('../config/config').get(process.env.NODE_ENV)
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const SALT_I = 10


const UserSchema = mongoose.Schema({

    email:{
        type: String,
        required: true,
        trim:true,
        unique: true
    },
    password:{
        type: String,
        required: true,
        minlength: 6
    },
    name:{
        type: String,
        maxlength: 30
    },
    userType: {
        type: String,
        required: true
    },
    token:{
        type: String
    },
    status: {
        type: Boolean,
        default: false
    }
})


// HASHING PASSWORD USING SALT
UserSchema.pre('save', function(next){
    var user = this

    if(user.isModified('password')){
        bcrypt.genSalt(SALT_I,function(err,salt){
            if(err) return next(err)
            bcrypt.hash(user.password,salt,function(err,hash){
                if(err) return next(err)
                user.password = hash
                next()
            })
        })
    }
    else next()
})

UserSchema.methods.ComparePass = function(currentPassword,cb){

    bcrypt.compare(currentPassword,this.password,(err,isMatch)=>{
        if(err) return cb(err)
        cb(null,isMatch)
    })
}
// Generate Tokens
UserSchema.methods.generateToken = function(cb){
    var user = this;

    var token = jwt.sign({id:user._id.toHexString(), username: user.email, user: user.userType},config.HASH)
    user.token = token
    user.save(function(err,user){
        if (err) return cb(err)
        cb(null,user)
    })
}

UserSchema.methods.getID =  function (name, cb) {
    var user = this
        user.findOne({ name: name }).select('_id').exec(cb);
    }

UserSchema.statics.findByToken = function(token,cb){
    var user = this;

    jwt.verify(token,config.HASH, function(err,decode){
        user.findOne({"_id":decode,"token":token}, function(err,user){
            if(err) return cb(err)
            cb(null,user)
        })
    })
}


UserSchema.methods.deleteToken = function(token,cb){
    var user = this;
    user.updateOne({$unset:{token:1}},(err,user)=>{
        if(err) return cb(err)
        cb(null,user)
    })
}

const User = mongoose.model('User', UserSchema)
module.exports = { User }