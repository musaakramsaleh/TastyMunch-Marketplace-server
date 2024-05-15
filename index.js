const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000

const app = express()
// msMP3oKRdeJohUkH
const corsOption = {
    origin:['http://localhost:5173'],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOption))
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.zuwbcyf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  const database = client.db("FoodDB");
    const userCollection = database.collection("food");
    const productCollection = database.collection("product");
    const galleryCollection = database.collection("gallery");
    app.get('/food',async(req,res)=>{
      const cursor = userCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })
    app.get('/foods/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.findOne(query)
      res.send(result)
    })
    app.get('/foo/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.findOne(query)
      res.send(result)
    })
   app.post('/addfood',async(req,res)=>{
        const product = req.body;
        const result = await userCollection.insertOne(product);
        res.send(result)

    })
    app.get('/food/:email',async(req,res)=>{
      const email = req.params.email
      const query = {'AddBy.email': email}
      const result = await userCollection.find(query).toArray()
      res.send(result)
  })
  app.get('/product/:email',async(req,res)=>{
    const email = req.params.email
    const query = {BuyerEmail: email}
    const result = await productCollection.find(query).toArray()
    res.send(result)
})
  app.get('/update/:id',async(req,res)=>{
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
              purchaseCount: updatedSell, // Increase by updatedSell
              quantity: -updatedSell, // Decrease by updatedSell
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