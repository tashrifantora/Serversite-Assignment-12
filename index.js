const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 5000;

// Middle ware
app.use(cors())
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.gsyh7hk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // ***Employee Colection***
    const emplyeesCollection= client.db('AssetCatalyst').collection('employees')

    // ***Custome Request Colection***
    const selectedEmpCollection= client.db('AssetCatalyst').collection('Selectedemployees')

    // ***Custome Request Colection***
    const requestAssetCollection= client.db('AssetCatalyst').collection('RequestedAsset')

     // ***HR Colection***
    const HRCollection= client.db('AssetCatalyst').collection('HR')

     // ***Asset Colection (HR)***
     const assetCollection= client.db('AssetCatalyst').collection('Assets')

     // ***Custom request Colection (HR)***
     const customReqCollection= client.db('AssetCatalyst').collection('CustomRequest')

     // ***All req approve Colection (HR)***
     const AllReqCollection= client.db('AssetCatalyst').collection('allRequest')
    

/* ================================
         JWT & Vefication
=================================== */
     app.post('/jwt', async(req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRETS, {expiresIn:"5h"})
      res.send({token})
     })


    //  Token verification
    const verifyToken= (req,res,next)=>{
     console.log('token in backend:', req.headers.authorization)
     if(!req.headers.authorization){
      return res.status(401).send({message: "Forbidden access"})
     }

     const token= req.headers.authorization.split(' ')[1]
     jwt.verify(token,process.env.SECRETS ,(err, decoded)=>{
       if(err){
         return res.status(401).send({message: "Forbidden access"})
       }
       console.log(decoded)
 
       req.decoded= decoded
         next();
     })
     
    }

    // 1. Try to give a admin role 
    app.patch('/HR/make-admin/:email', async(req,res)=>{
      const email = req.params.email;
      const filter = {email: email}
      const updatedDoc = {
        $set:{
          role: "admin"
        }
      }
      const result = await HRCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })


    // 2. Checking is admin or not 
    app.get('/HR/make-admin/:email', verifyToken, async(req, res)=>{
      const email = req.params.email;
      // If email ar not same
      if(email !== req.decoded.email){
       return res.status(403).send({message: "Unauthorized access"})
      }
      // If email are same
      const query = {email: email}
      const user = await HRCollection.findOne(query);
      let admin = false;
      if(user){
       admin = user?.role === 'admin'
      }
      res.send({admin})
   }) 

     
/*====/====/====/====/====/====/====/
        Employess Related API
 ====/====/====/====/====/====/====/*/
 //  Employeess Post API
    app.post('/employee', async(req,res)=>{
        const employee = req.body;
        const result = await emplyeesCollection.insertOne(employee);
        res.send(result)
    })

    // Employee Get API
    app.get('/employee', async(req,res)=>{
        const cursor = emplyeesCollection.find();
        const result = await cursor.toArray()
        res.send(result);
    })


   
   

    // Added Employee (Selected By HR) API
    app.post('/selected-employee', async(req,res)=>{
      const selectedEmp = req.body;
      const result = await selectedEmpCollection.insertOne(selectedEmp);
      res.send(result)
  })

  // Selected Employee Post API
  app.get('/selected-employee', async(req,res)=>{
    const cursor = selectedEmpCollection.find();
    const result = await cursor.toArray()
    res.send(result);
})

    //  Selected Employee 
    app.delete('/selected-employee/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await selectedEmpCollection.deleteOne(query);
      res.send(result);
    })

    // Requested Asset API
    app.post('/asset-request', async(req,res)=>{
      const selectedEmp = req.body;
      const result = await requestAssetCollection.insertOne(selectedEmp);
      res.send(result)
  })
  
  // Asset request get API
  app.get('/asset-request', async(req,res)=>{
    const cursor = requestAssetCollection.find();
    const result = await cursor.toArray()
    res.send(result);
})

  //  Asset Request Delete API
    app.delete('/asset-request/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await requestAssetCollection.deleteOne(query);
      res.send(result);
    })



/*====/====/====/====/====/====/====/
        HR Related API
 ====/====/====/====/====/====/====/*/
    // HR Post API
    app.post('/HR', async(req,res)=>{
        const HR = req.body;
        const result = await HRCollection.insertOne(HR);
        res.send(result)
    })

    // HR get API
    app.get('/HR', async(req,res)=>{
      const cursor = HRCollection.find();
      const result = await cursor.toArray()
      res.send(result);
  })

  // Trying to get sengle data 
    app.get('/HR/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await HRCollection.findOne(query);
      res.send(result);
     })

/*||====||====||====||====||====||====||
        Asset Related Api
 ||====||====||====||====||====||====||*/
    // Asset post API
    app.post('/assets', async(req,res)=>{
      const asset = req.body;
      const result = await assetCollection.insertOne(asset);
      res.send(result)
  }) 


  // Asset get API
     app.get('/assets', async(req,res)=>{
       const cursor = assetCollection.find();
       const result = await cursor.toArray()
       res.send(result);
   })


  //  Asset Delete API
      app.delete('/assets/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await assetCollection.deleteOne(query);
        res.send(result);
      })


      // Asset Update 
      app.get('/assets/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId (id)}
        const result = await assetCollection.findOne(query);
        res.send(result);
       })


       //  Update [Patch operation]
       app.patch('/assets/:id', async(req,res)=>{
         const asset = req.body;
         const id = req.params.id;
         const filter = {_id: new ObjectId(id)};
         const updateDoc= {
           $set:{
             name: asset.name,
             image: asset.productImg,
             type: asset.type,
             quantity: asset.quantity,
             time: asset.time
           }
         }
         const result = await assetCollection.updateOne(filter, updateDoc);
         res.send(result);
       })



/*+++++||+++++||+++++||++++||++++||
      Custome Request API
+++++||+++++||+++++||++++||++++||
*/
    // Custome Request Post API
    app.post('/custom-req', async(req,res)=>{
      const employee = req.body;
      const result = await customReqCollection.insertOne(employee);
      res.send(result)
  })

  // Custome Request Get API
  app.get('/custom-req', async(req,res)=>{
      const cursor = customReqCollection.find();
      const result = await cursor.toArray()
      res.send(result);
  })

  // Custome Request Update 
  app.get('/custom-req/:id', async(req, res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId (id)}
    const result = await customReqCollection.findOne(query);
    res.send(result);
   })

  //  Custome req delete
    app.delete('/custom-req/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await customReqCollection.deleteOne(query);
      res.send(result);
    })

    // ALL req Approved & Reject Post API
    app.post('/all-req', async(req, res)=>{
      const employee = req.body;
      const result = await AllReqCollection.insertOne(employee);
      res.send(result)
    })

    // All req Approve & Reject  Get API
    app.get('/all-req', async(req,res)=>{
      const cursor = AllReqCollection.find();
      const result = await cursor.toArray()
      res.send(result);
  })



    //  Update [Patch operation]
    app.patch('/custom-req/:id', async(req,res)=>{
      const customReq = req.body;
      const id = req.params.id;
      console.log(id)
      const filter = {_id: new ObjectId(id)};
      const updateDoc= {
        $set:{
          name: customReq.name,
          image: customReq.assetImg,
          price: customReq.assetPrice,
          type: customReq.assetType,
          whyNeed: customReq.whyNeed,
          aditional: customReq.aditional,
        }
      }
      const result = await customReqCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    
    app.get('/package', async(req,res)=>{
      const cursor = customReqCollection.find();
      const result = await cursor.toArray()
      res.send(result);
  })


    // Payment Related Everything
    app.post('/create-payment-intent', async(req,res)=>{
      const {price}= req.body;
      console.log(price)

      const amount= parseInt(price * 100);
      console.log('thgis ishowsds amount', amount)

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ['card']
      })

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get ('/',(req,res)=>{
    res.send('Asset Catalyst is running')
})

app.listen(port ,()=>{
    console.log(`Asset Catalyst is running on port :- ${port}`)
})