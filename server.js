const express = require( 'express' ),
      mongodb = require( 'mongodb' ),
      cookie  = require( 'cookie-session' ),
      bodyParser = require('body-parser'),
      app = express()
app.use( express.urlencoded({ extended:true }) )

// TODO cookie middleware! The keys are used for encryption and should be changed
app.use( cookie({
  name: 'session',
  keys: ['key1', 'key2']
}))

// TODO make sure to substitute your username / password for tester:tester123 below!!! 
const uri = "mongodb+srv://Test:Testing123@cluster0.yfsjf.mongodb.net/"
const client = new mongodb.MongoClient( uri, { useNewUrlParser: true, useUnifiedTopology:true })
let collection = null
client.connect()
  .then( () => {
    //Only create collection if it doesn't exist
    return client.db( 'DataA3' ).collection( 'DA3' )
  })
  .then( __collection => {
    //Store reference to collection
    collection = __collection
    //Blank query returns all documents
    return collection.find({ }).toArray()
  })
  .then( console.log )

//Route to get all docs
app.get( '/', (req,res) => {
  if( collection !== null ) {
    debugger
    collection.find({ }).toArray().then( result => res.json( result ) )
  }
})

app.post( '/login', (req,res)=> {
  //Express.urlencoded kv pairs -> object key= name of each form field & value = the user entered
  //console.log( req.body )
  
  // TODO for A3, you should check username / password combos in your database
  if( req.body.password === 'test' ) {
    //Define a variable that we can check in other middleware
    //The session object is added to our requests by the cookie-session middleware
    req.session.login = true
    
    //Login successful (use redirect to avoid authentication problems)
    res.redirect( 'index.html' )
  }else{
    //Password incorrect so redirect back to login page
    res.sendFile( __dirname + '/public/login.html' )
  }
})

app.post( '/submit', bodyParser.json(), (req,res) => {
  // assumes only one object to insert
  entry = req.body
  
  if (entry.rowName !== ''){
    collection.deleteOne({ _id:mongodb.ObjectId(entry.rowName)})
  }

  collection.insertOne( req.body )
    .then( insertResponse => {
       return collection.findOne(insertResponse.insertedId ) 
    })
    .then( findResponse => {
      return res.json(findResponse)
    })

  /*
  if (entry.rowName === ''){
    collection.insertOne( req.body )
    .then( insertResponse => {
       return collection.findOne(insertResponse.insertedId ) 
    })
    .then( findResponse => {
      return res.json(findResponse)
    })
  }
  else { //Modify 

  }*/
 
})

app.post( '/deleteEntry', bodyParser.json(), (req,res) => {
  entry = req.body
  collection.deleteOne({ _id:mongodb.ObjectId(entry.nameToRemove)})
})

//Add some middleware that always sends unauthenicaetd users to the login page
app.use( function( req,res,next) {
  if( req.session.login === true )
    next()
  else
    res.sendFile( __dirname + '/public/login.html' )
})
  
//Serve up static files in the directory public
app.use( express.static('public') )
app.listen( 3000 )