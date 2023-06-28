const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
  image: String,
  cart: { //cart: {id(프로덕트아이디임), quantity, date} 이렇게 들어갈 예정
    type: Array,
    default: []
  },
  history: {
    type: Array,
    default: []
  }
})

userSchema.pre('save', async function(next) {
  let user = this

  if(user.isModified('password')) {
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(user.password, salt)
    user.password = hash
  }

  next()
})

userSchema.methods.comparePassword = async function(plainPassword) {
  let user = this

  const match = await bcrypt.compare(plainPassword, user.password)

  return match
}


const User = mongoose.model("User", userSchema)

module.exports = User //다른모듈에서 User모델을 사용해서 DB에 데이터를 in/up/de 하게 해줌