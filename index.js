const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
//midleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rrnpcbx.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
       return res.status(401).send({message:'Unauthorized Access'});
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
        if(err){
            return res.status(401).send({message:'Unauthorized Access'})
        }
        req.decoded = decoded;
        next()
    })

}



async function run(){
    try{
        const serviceCollection = client.db('geniusCar').collection('services');
        const orderCollection = client.db('geniusCar').collection('orders');

        app.post('/jwt', (req, res) =>{
            const user = req.body;
            const token = jwt.sign(user,process.env.JWT_SECRET,{expiresIn:'1h'})
            res.send({token})
            // console.log(user);

        })

        app.get('/services', async(req,res) =>{
            const query ={}
            const cursor =serviceCollection.find(query)
            const services = await cursor.toArray();
            res.send(services)
        });

        app.get('/services/:id', async(req, res) =>{
            const id = req.params.id;
            const query ={ _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        //orders api
        app.get('/orders',verifyJWT,async(req, res) =>{
           // console.log(req.query.email)
           //console.log(req.headers.authorization)
           const decoded = req.decoded;
           if(decoded.email !== req.query.email){
             res.status(403).send({ message:'unauthorized access'})
           }
           console.log(decoded)
            let query ={};
            if(req.query.email){
                query= {
                email: req.query.email
                }
            }
            
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        });


        app.post('/orders', verifyJWT, async(req, res) =>{
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        app.patch ('/orders/:id',verifyJWT,async(req,res) =>{
            const id = req.params.id;
            const status = req.body.status;
            const query={ _id: ObjectId(id)}
            const updateDoc ={
                $set:{
                    status: status
                }
            }
            const result = await orderCollection.updateOne(query,updateDoc);
            res.send(result)

        })

        app.delete('/orders/:id',verifyJWT, async(req, res) =>{
            const id = req.params.id;
            const query ={ _id:ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result)

        })



    }
    finally{

    }

}
run().catch(error =>console.log(error))

app.get('/',(req,res)=>{
    res.send('genius car server is running')

});

app.listen(port,() =>{
    console.log(`genius car runnig on ${port}`);
});


