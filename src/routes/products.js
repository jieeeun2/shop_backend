const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const Product = require('../models/Product')
const multer = require('multer')


/* multer 라이브러리를 이용한 파일업로드 
공식문서: https://github.com/expressjs/multer/blob/master/doc/README-ko.md */

const storage = multer.diskStorage({
  destination: function(req, file, cb) { //cb는 콜백 줄임말;;;
    cb(null, 'uploads/')
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`)
  }
})
const upload = multer({storage: storage}).single('file') //*****

router.post('/image', auth, (req, res, next) => {
  upload(req, res, err => {
    if(err) {
      return req.status(500).send(err)
    }
    return res.json({fileName: res.req.file.filename})
  })
})

//상품업로드페이지에서 상품 업로드
router.post('/', auth, (req, res, next) => {
  try{
    const product = new Product(req.body)
    product.save()
    return res.sendStatus(201)
  }catch(error) {
    next(error) //에러가 났을경우에는 에러처리기 보내기
  }
})

//랜딩페이지 아이템들 보여주는거 
router.get('/', async (req, res, next) => {
  const order = req.query.order ? req.query.order : 'desc'
  const sortBy = req.query.sortBy ? req.query.sortBy : '_id'
  const limit = req.query.limit ? Number(req.query.limit) : 20
  const skip = req.query.skip ? req.query.skip : 0

  let findArgs = {}
  for(let key in req.query.filters) {
    if(req.query.filters[key].length > 0) {
      if(key === 'price') {
        findArgs[key] = {
          $gte: req.query.filters[key][0], 
          $lte: req.query.filters[key][1]
        }
      }else {
        findArgs[key] = req.query.filters[key]
      }
    }
  }
  console.log('findArgs', findArgs)

  try{
    const products = await Product.find(findArgs)
      .populate('writer')
      .sort([[sortBy, order]]) 
      .skip(skip)
      .limit(limit)

     const productsTotal = await Product.countDocuments(findArgs)
     const hasMore = skip + limit < productsTotal ? true : false

    return res.status(200).json({products, hasMore})
  }catch(error) {
    next(error)
  }
})






module.exports = router