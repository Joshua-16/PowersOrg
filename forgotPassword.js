const mongoose = require('mongoose')

//  const connect = mongoose.connect("mongodb://localhost:27017/myGoals")
//  check connection built

// connect.then(() => {
//     console.log("database sucessfully connected");
// })
// .catch((error) => {
//     console.log("database not connected", error);
// }) 

const Schema = mongoose.Schema;

const forgotPasswordSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Token expires in 1 hour (3600 seconds)
  },
});

const forgotPassword = new mongoose.model('ForgotPassword', forgotPasswordSchema);
module.exports = forgotPassword



