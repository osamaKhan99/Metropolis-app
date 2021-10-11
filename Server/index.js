const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const config = require('./config/auth.config')
const bodyparser = require('body-parser')
const cookieParser = require("cookie-parser")
const configg = require("./config/config").get(process.env.NODE_ENV)
const nodemailer = require('./config/nodemailer')

const app = express()


mongoose.Promise = global.Promise
mongoose.connect(configg.DATABASE,{
    useNewUrlParser: true,
    useUnifiedTopology: true
},function(err){
    if(err) console.log(err);
    console.log("database is connected");
})

const { User } = require('./models/user')
const { Appointment } = require('./models/appointment')
const { Treatment } = require('./models/treatment')
const { auth } = require('./middleware/auth')

//app.use(bodyparser.urlencoded({extended : false}));
app.use(bodyparser.json())
app.use(express.json())
app.use(cookieParser())

app.get('/api/auth',auth,(req,res)=>{
    res.json({
        isAuth: true,
        id: req.user._id,
        email: req.user.email,
        name: req.user.name
    })
})

app.get('/api/logout', auth, (req,res)=>{
    req.user.deleteToken(req.token,(err,user)=>{
        if(err) return res.status(400).send(err)
        res.sendStatus(200)
    })
})

app.get('/api/dashboard', async (req,res)=>{
    let user = []
    user = jwt.decode(req.cookies.auth, config.secret)
    //const user = jwt_decode(req.cookies.auth, config.secret)
    
    if(user.user === 'Doctor'){
        const appointments = await Appointment.find({ doc_id: user.id })
        let appointmentIds = []
        appointments.forEach(e => appointmentIds.push(e._id))
        const treatments = await Treatment.find({ Ap_id: {$in: appointmentIds}}).lean()
        return res.status(200).json({
            status: 'success',
            appointments,
            treatments
        })
    }
    if (user.user === 'Patient') {
        const appointments = await Appointment.find({ patient_id: user.id })
        const doctors =  await User.find({ userType: 'Doctor', status: { $ne: false } }).lean()
        return res.status(200).json({
            status: 'success',
            appointments,
            doctors
        })
    }
    
})

app.post('/api/register', (req,res)=>{
    const token = jwt.sign({email: req.body.email}, config.secret, { expiresIn: "1800s"})

    const user = new User({
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        userType: req.body.userType,
        token: token,
        
    })


    user.save((err,doc)=>{
        if(err) return res.status(400).json({'err':err})
        res.status(200).json({
            message:
              "User was registered successfully! Please check your email",
              user: doc
         });

       nodemailer.sendConfirmationEmail(
          user.name,
          user.email,
          user.token
   );
})

app.patch('/api/verify', (req,res)=>{
    User.findOneAndUpdate({token: req.body.token}, {status: true},{new:true},(err,doc)=>{
        if(err) return res.status(400).send(err)
        res.json({
            updated: true,
            doc
        })
    })
})

app.post("/api/appointment", (req,res)=>{

    const patient_id = jwt.decode(req.cookies.auth, config.secret,(err,doc)=>{
        return doc
    })

  User.findOne({name: req.body.name},(err,doc)=>{

    const appointment = new Appointment({
        doc_id: doc._id,
        patient_id: patient_id.id,
        time: req.body.time
    })
     appointment.save((err,doc)=>{
         if(err) return res.status(400).send(err)
         res.json({
             message: "Appointment Booked!",
             doc
         })
     })
  })
  
})

app.post('/api/treatment',(req,res)=>{
    
    Appointment.findOne({time: req.body.time}, (err,doc)=>{
        const treatment = new Treatment({
            Ap_id: doc._id,
            treatment: req.body.treatment
        })

        Appointment.findByIdAndUpdate(treatment.Ap_id,{status: 'Done'},{new: true},(err,doc)=>{
            if(err) return err
            // res.json({
            //     doc
            // })
        })
        treatment.save((err,doc)=>{
            if(err) return res.status(400).send(err)
            res.json({
                message: "Treatment Done!",
                doc
            })
        })
    })
    

})

app.post('/api/login', (req,res)=>{
    User.findOne({'email':req.body.email},(err,user)=>{
        if(!user) return res.status(400).json({isAuth:false,message:"User not found!"})
        if (!user.status){
            return res.status(400).json({
                message: "Please Verfiy your Account!"
            })
        }

            user.ComparePass(req.body.password,(err,isMatch)=>{
                if(!isMatch) return res.json({
                    isAuth: false,
                    message: 'Incorrect Password'
                })
                user.generateToken((err,user)=>{
                    if(err) return res.status(400).send(err)
                    res.cookie('auth',user.token).json({
                        isAuth: true,
                        message: "login Successfully",
                        id: user._id,
                        email: user.email
                    })
                })
            })
        })
    })
})
const port = process.env.PORT || 3001
app.listen( port, ()=>{
    console.log('App is running on PORT: ', port)
})
