const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    maxLength: 50
  },
  email: {
    type: String,
    trim: true,
    unique: true
  },
  password: {
    type: String,
    minLength: 5
  },
  role: {
    type: Number,
    default: 0
  },
  image: String
})

const User = mongoose.model("User", userSchema)

module.exports = User //다른모듈에서 User모델을 사용해서 DB에 데이터를 in/up/de 하게 해줌