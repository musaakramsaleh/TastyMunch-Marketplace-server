const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000

const app = express()
// msMP3oKRdeJohUkH
const corsOption = {
    origin:['http://localhost:5173','https://restaurant-8605a.firebaseapp.com','https://restaurant-8605a.web.app'],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOption))
app.use(express.json())
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.zuwbcyf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const logger = (req,res,next)=>{
  console.log(req.method,req.url);
  next();
}
const verifytoken = (req,res,next) =>{
  const token = req?.cookies?.token
  if(!token){
    return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.user = decoded
    next()
  })
  
}

async function run() {
  const database = client.db("FoodDB");
    const userCollection = database.collection("food");
    const productCollection = database.collection("product");
    const galleryCollection = database.collection("gallery");
    const UserCollection = database.collection("user");

    app.post('/jwt', async(req,res)=>{
      const user = req.body
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:"1d"
      })
      res.cookie('token',token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
      })
      .send({success: true})
    }) 
    
    app.get('/logout',(req,res)=>{
      res.clearCookie('token',{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge:0,
      })
      .send({success: true})
    })

    app.get('/food',async(req,res)=>{
      const cursor = userCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })
    app.get('/all-food',async(req,res)=>{
      const size = parseInt(req.query.size)
      const page = parseInt(req.query.page) -1 
      const search = req.query.search
       let query = { FoodName: { $regex: search, $options: 'i' } }
      
      const result = await userCollection.find(query).skip(page*size).limit(size).toArray()
      res.send(result)
      
    })
    app.get('/food-count',async(req,res)=>{
      const search = req.query.search;
    let query = { FoodName: { $regex: search, $options: 'i' } };
    
    const count = await userCollection.countDocuments(query);
    res.send({ count });
    })
    app.get('/foods/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.findOne(query)
      res.send(result)
    })
    app.get('/foo/:id',verifytoken,async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.findOne(query)
      res.send(result)
    })
   app.post('/addfood',verifytoken,async(req,res)=>{
        const product = req.body;
        console.log(" Add food info",req.user)
        const result = await userCollection.insertOne(product);
        res.send(result)

    })
    app.get('/food/:email',verifytoken,async(req,res)=>{
      const email = req.params.email
      console.log("token owner info",req.user)
      if(req.user.email !== req.params.email){
            return res.status(403).send({message:'forbidden access'})
      }
      const query = {'AddBy.email': email}
      const result = await userCollection.find(query).toArray()
      res.send(result)
  })
  app.get('/product/:email',verifytoken,async(req,res)=>{
    const email = req.params.email
    console.log("product owner info",req.user)
      if(req.user.email !== req.params.email){
            return res.status(403).send({message:'forbidden access'})
      }
    const query = {BuyerEmail: email}
    const result = await productCollection.find(query).toArray()
    res.send(result)
})
  app.get('/update/:id',verifytoken,async(req,res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await userCollection.findOne(query)
    res.send(result)
  })
  app.put('/update/:id',async(req,res)=>{
    const id = req.params.id
    const filter = {_id: new ObjectId(id)}
    const options = {upsert: true}
    const updatedfood = req.body
    const food = {
      $set: {
        FoodName : updatedfood.FoodName,
        FoodImage : updatedfood.FoodImage,
        FoodOrigin : updatedfood.FoodOrigin,
        Description : updatedfood.Description,
        Price : updatedfood.Price,
        quantity : updatedfood.quantity,
        FoodCategory : updatedfood.FoodCategory,
      }
    }
    const result = await userCollection.updateOne(filter,food,options)
    res.send(result)
  })
  app.post('/addproduct',async(req,res)=>{
    const product = req.body;
    const result = await productCollection.insertOne(product);
    res.send(result)

})
app.put('/updatefood/:id', async (req, res) => {
  
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedsize = req.body;

      const updatedSell = parseInt(updatedsize.quantity);
      const update = {
          $inc: {
              purchaseCount: updatedSell, 
              quantity: -updatedSell, 
          }
      };

      const result = await userCollection.updateOne(filter, update);
      res.json(result);
 
});
  app.get('/rankproduct',async(req,res)=>{
    const result = await userCollection.find().sort({ purchaseCount: -1 }).limit(6).toArray();
     res.send(result)
  })
  app.get('/found', async (req, res) => {
    const { search } = req.query;
    const foods = await userCollection.find({ FoodName: { $regex: search, $options: 'i' } }).toArray();
    res.send(foods);
});
app.post('/gallery',async(req,res)=>{
  const product = req.body;
  const result = await galleryCollection.insertOne(product);
  res.send(result)
})
app.post('/user',async(req,res)=>{
  const product = req.body;
  const result = await UserCollection.insertOne(product);
  res.send(result)
})
app.get('/gallery', async (req, res) => {
  const cursor = galleryCollection.find()
      const result = await cursor.toArray()
      res.send(result)
});
app.delete('/product/:id',async(req,res)=>{
  const id = req.params.id
  const query = {_id: new ObjectId(id)}
  const result = await productCollection.deleteOne(query)
  res.send(result)
})
app.delete('/food/:id',async(req,res)=>{
  const id = req.params.id
  const query = {_id: new ObjectId(id)}
  const result = await userCollection.deleteOne(query)
  res.send(result)
})
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/',(req,res)=>{
    res.send("Vaaiya tomar server khawar jonno ready")
})

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})