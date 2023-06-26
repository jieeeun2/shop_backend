import mongoose from "mongoose";

const paymentSchema = mongoose.Schema({
  user: {
    type: Object
  },
  data: {
    type: Array, //카카오페이면 카카오페이에서 제공하는 정보 넣는곳
    default: []
  },
  product: {
    type: Array, 
    default: []
  }
}, {timestamps: true}) 

const Payment = mongoose.model("Payment", paymentSchema)

module.exports = Payment