const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Product = require('../models/Product')
const Payment = require('../models/Payment')
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth')
const crypto = require('crypto') //이거 하니깐 됐는데 왜 필요한지 모르겠음
const async = require('async')

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
/* DetailProductPage의 ProductInfo section부분에서 '장바구니로' 버튼 눌렀을때 
 state.userData에 cart속성이 없으면 만들어주고, 있으면 cart.quantity업데이트 */
  try {
    //먼저 User Collection에 해당 유저의 정보 가져오기
    const userInfo = await User.findOne({_id: req.user._id}) 
    //auth미들웨어에서 req.user에 user 담아놨었음
    //console.log('userInfo: ', userInfo)
    
    let duplicate = false
    userInfo.cart.forEach(item => {
      if(item.id === req.body.productId) duplicate = true 
    })
     
    if(duplicate) { //장바구니에 이미 그 상품 존재할때
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

router.delete('/cart', auth, async (req, res, next) => {
  try {
    //먼저 cart안에 지우려고 한 상품들을 넣어주기
    const userInfo = await User.findOneAndUpdate(
      {_id: req.user._id},
      {'$pull': 
        {'cart': {'id': req.query.productId}}
      },
      {new: true}
    )
    const cart = userInfo.cart

    //Product 정보 가져옴
    /* state값에서 삭제하는게 아니라, 삭제한 결과를 state에 반영하는 너낌으로~ */
    const cartItemIds = cart.map(item => item.id)
    const productInfo = await Product
      .find({_id: {$in: cartItemIds}})
      .populate('writer')

    return res.json({productInfo, cart})

  }catch(error) {
    next(error)
  }
})


router.post('/payment', auth, async (req, res, next) => {
  let history = []
  let transactionData = {}

  //User collection의 history field 안에 간단한 결제 정보 넣어주기 위해서 설정
  req.body.cartDetail.forEach(item => {
    history.push({
      dateOfPurchase: new Date().toISOString(),
      name: item.name,
      id: item._id,
      price: item.price,
      quantity: item.quantity,
      paymentId: crypto.randomUUID()
    })
  })

  //Payment collection안에 자세한 결제 정보 넣어주기 위해서 설정
  transactionData.user = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email
  }
  transactionData.product = history

  //1. User collection에 history 정보 저장
  await User.findOneAndUpdate(
    {_id: req.user._id},
    {$push: {history: {$each: history}}, $set: {cart: []}},
    //{new: true} //<- 요거 왜 안해줌?????
  )

  //2. payment collection에 transactionData 정보 저장
  const payment = new Payment(transactionData)
  const paymentDocs = await payment.save()

  //3. Product collection의 sold 필드 정보 업데이트
  let products = []
  paymentDocs.product.forEach(item => {
    products.push({id: item._id, quantity: item.quantity})
  })

  /* async.eachSeries(순환할 collection, 순환하면서 실행할 function, 콜백) */
  async.eachSeries(products, async (item) => {
    await Product.updateOne(
      {_id: item.id},
      {$inc: {'sold': item.quantity}}
    )
  }, (err) => {
    if(err) return res.status(500).send(err)
    return res.sendStatus(200)
  })
})



module.exports = router