const express = require('express')
const bodyParser = require('body-parser')
const jsonValidator = require('jsonschema').Validator
const pgp = require('pg-promise')(/* options */)
const uuid = require('uuid')

// connection details of database
const cn = {
  host: '192.168.0.10',
  port: 5432,
  database: 'lhintzsc',
  user: 'lhintzsc',
  password: '',
  max: 30 // use up to 30 connections
};

// load our stuff
const db = pgp(cn);
const app = express()
const port = 3000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// definition for schema validation
var recipeSchema = { 
  "id":"/recipe", 
  "type":"object", 
  "properties":{  
    "name": {"type":"string"},  
    "description": {"type": "string"},
    "image": {"type": "string"} 
  }, 
  "required" :["name","description"]
};

var validator = new jsonValidator();
validator.addSchema(recipeSchema, '/recipe');

// middleware to parse json
const parseJSON = function(req,res,next){
  console.log('parseJSON')
  res.locals.jsonObject = JSON.parse(JSON.stringify(req.body))
  next()
}


// count existing recipes
const countExistingRecipes = function (req,res,next) {

  console.log('countExistingRecipes');
  console.log('--------------------');

  res.locals.count = 0;

  console.log('res.local.jsonObject.name before count:',res.locals.jsonObject.name);
  console.log('res.locals.count count:',res.locals.count);
  console.log('was neues');

  //db.one(
  //  'SELECT count(*) from public."Recipe" where "NAME" = $1;', 
  //  [ 'Test Name' ] //res.locals.jsonObject.name]
  //).then(data => {
  //    console.log('data.count:',Number(data.count));
  //    res.locals.count = Number(data.count);
  //}).catch(error => {
  //  console.log('ERROR:', error);
  //})

  db.any(
    'SELECT count(*) from public."Recipe";'
  ).then(data => {
    console.log('test output');
    console.log('data',data);
    console.log('data.count:',Number(data.count));
  }).catch(error => {
      console.log('ERROR:', error); // print error;
  })

  console.log('res.local.jsonObject.name after count:',res.locals.jsonObject.name);
  console.log('res.locals.count after:',res.locals.count);


  console.log('');
  next()

}

const insertRecipe = function (req, res, next){

  console.log('insertRecipe')
  console.log('------------')
  
  var uuidv4 = uuid.v4()
  console.log('res.locals.count:', res.locals.count); // print new user id;
  console.log('uuid:', uuidv4); // print new user id;
  console.log('name:', res.locals.jsonObject.name); // print new user id;
  console.log('desc:', res.locals.jsonObject.description); // print new user id;
  console.log('image:', res.locals.jsonObject.image); // print new user id;

  if (res.locals.count == 0){


    db.one(
      'INSERT INTO public."Recipe" ("RECIPE_PK", "NAME", "DESCRIPTION", "IMAGE") VALUES($1, $2, $3, $4);',
      [
        uuidv4,
        res.locals.jsonObject.name,
        res.locals.jsonObject.description,
        res.locals.jsonObject.image
      ]
    )
    .then(data => {
        console.log(uuidv4); // print new user id;
    })
    .catch(error => {
        console.log('ERROR:', error); // print error;
    })

  }else{
    return
  }

  console.log('');
  next()

}

app.use(parseJSON)

app.get('/recipe', (req, res) => {
  res.send('list all recipes')
})

app.post(
  '/recipe', 
  async (req, res) => {

  let checkRecipeSchema = await checkRecipeSchema(req)
  //let countExistingRecipes = await countExistingRecipes()
  //let insertRecipe = await insertRecipe()

  console.log(res.locals.jsonObject.name)
  console.log(res.locals.count)
  res.send('Data Received: ' + JSON.stringify(req.body));

})

app.delete('/recipe', (req, res) => {
  res.send('delete existing recipe')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// middleware to validate schema
async function checkRecipeSchema(request){

  console.log('checkRecipeSchema')
  console.log('-----------------')

  if(request.get("Content-Type")!="application/json") { 
    request.status(401).send("Invalid header format");
    return;
  }try{
    validator.validate(req.body,recipeSchema,{"throwError":true});
  }catch(error){
    request.status(401).end("Invalid body format: " + error.message);
    return;
  }

  console.log('');

}