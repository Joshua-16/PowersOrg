 const mongoose = require('mongoose')
//  const connect = mongoose.connect("mongodb://localhost:27017/myGoals")
//  check connection built

// connect.then(() => {
//     console.log("database sucessfully connected");
// })
// .catch((error) => {
//     console.log("database not connected", error);
// }) 
// create a schema

const loginSchema = new mongoose.Schema({
    name: {
        type: String,
        required:true
    },
    password: {
        type:String,
        required:true
    }
})
const collection = new mongoose.model("MyGoal", loginSchema)

 module.exports = collection