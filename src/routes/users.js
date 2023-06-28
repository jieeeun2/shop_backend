const express = require('express')
const router = express.Router()
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth')

router.get('/auth', auth, (req, res) => {
  return res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    password: req.user.password,
    role: req.user.role,
    image: req.user.image,
    cart: req.user.cart,
    history: req.user.history
  })
})

router.post('/register', async (req, res, next) => {
  //유저데이터를 저장
  try {
    const user = new User(req.body)
    await user.save()
    return res.sendStatus(200)
  }catch (error) {
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try{
    //존재하는 유저인지 체크
    const user = await User.findOne({email: req.body.email})
    if(!user) {
      return res.status(400).send('Auth failed, email not found')
    }

    //비밀번호가 일치하는지 체크
    const isMatch = await user.comparePassword(req.body.password)
    if(!isMatch) {
      return res.status(400).send('Wrong password')
    }

    //token 생성
    const payload = {
      userId: user._id.toHexString()
    }
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: '1h'})

    return res.json({user, accessToken})
    
  }catch(error) {
    next(error)
  }
})

router.post('/logout', auth, async (req, res, next) => {
  try{
    return res.sendStatus(200)
  }catch(error) {
    next(error)
  }
})

router.post('/cart', auth, async (req, res, next) => {
  try {
    //먼저 User Collection에 해당 유저의 정보 가져오기
    const userInfo = await User.findOne({_id: req.user._id}) 
    //auth미들웨어에서 req.user에 user 담아놨었음
    
    let duplicate = false
    userInfo.cart.forEach(item => {
      if(item.id === req.body.productId) {
        duplicate = true
      }
    })
     
    //장바구니에 이미 그 상품 존재할때
    if(duplicate) {
      const user = await User.findOneAndUpdate(
        {_id: req.user._id, 'cart.id': req.body.productId}, //'cart.id' 이게 무슨 문법?
        {$inc: {'cart.$.quantity': 1}},
        /* $inc 는 이미 존재하는 키의 값 수정하거나 새로운 키 생성. update 하는거임*/
        {new: true}
      )
      return res.status(201).send(user.cart)
      
    }else { //장바구니에 그 상품 있지 않을때
      const user = await User.findOneAndUpdate(
        {_id: req.user._id},
        {
          $push: {
            cart: {
              id: req.body.productId, 
              quantity: 1,
              date: Date.now()
            }
          }
        },
        {new: true}
      )
      return res.status(201).send(user.cart)
    }

  }catch(error) {
    next(error)
  }
})



module.exports = router