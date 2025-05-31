const mongoose = require ('mongoose')

// connecting to database
// const connect = mongoose.connect("mongodb://localhost:27017/myGoals")

// connect.then(() => {
//     console.log('database sucessfully connected');
// })
// .catch((err) => {
//     console.log("database not connected", err);
// })

// creating a schema 

const SignInSchema = new mongoose.Schema({
    name:{
        type: String,
        required:[true, "input your name!"]
    },

    password: {
        type:String,
        required: [true, "Password is required!"],
        trim: true,
        select: false
    },
   

    email: {
        type: String,
        required: [true, "Email is required!"],
        unique: [true, "Email must be unique!"],
        lowercase: true,
        minLength: [5, " minimum of 5 characters"]
    },
    verified: {
        type: Boolean, //to check wheater it will be verified or not.
        default: false
    },

    // store the code for users during verification
    verificationCode: {
        type: String,
        select: false
    },

    verificationCodeValidation:{
        type:Number,
        select:false
    },
    // if a user forgets his password code, this is the code sent
    forgotPasswordCode:{
        type:String,
        select:false
    },

    forgotPasswordCodeValidation:{
        type:Number,
        select:false
    }
}, {
    timestamps:true
})

const newCollection = new mongoose.model("users", SignInSchema)

module.exports = newCollection