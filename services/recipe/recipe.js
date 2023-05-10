const express = require('express')
const bodyParser = require('body-parser')
const jsonValidator = require('jsonschema').Validator
const pgp = require('pg-promise')(/* options */)
const uuid = require('uuid')

// connection details of database
const cn = {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_USER,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 30 // use up to 30 connections
};

console.log('cn:',cn)

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

app.use(parseJSON)

app.get('/recipe', (req, res) => {

  console.log('');
  console.log('GET /recipe');
  console.log('-----------------');

  if (req.query.name && !req.query.recipe_pk){
    // return recipe with name
    db.any(
      'SELECT * FROM public."Recipe" WHERE "NAME" LIKE $1;', 
      [ String(req.query.name)+'%' ]
    ).then(data => {
        console.log('data:', data);

        var result = [];
        for (var i in data) {
          result.push({
            recipe_pk: data[i].RECIPE_PK, 
            name: data[i].NAME
          });
        }
        
        res.contentType('application/json');
        res.status(200)
        res.send(JSON.stringify(result));

    }).catch(error => {
      console.log('ERROR:', error);
    })
  }else if (!req.query.name && req.query.recipe_pk){
    // return recipe with primary key
    db.one(
      'SELECT * from public."Recipe" where "RECIPE_PK" = $1;', 
      [ req.query.recipe_pk ]
    ).then(data => {
        // log input and output
        console.log('data:',data);
        console.log('query recipe_pk:',req.query.recipe_pk);
        // return json respone
        res.status(200)
        res.json({ 
          recipe_pk: data.RECIPE_PK,
          name: data.NAME,
          description: data.DESCRIPTION
          //image: data.IMAGE
        });
    }).catch(error => {
      console.log('ERROR:', error);
    })
  }else{
    db.any(
      'SELECT * from public."Recipe"', 
      [ req.query.recipe_pk ]
    ).then(data => {

        console.log('data:', data);

        var result = [];
        for (var i in data) {
          result.push({
            recipe_pk: data[i].RECIPE_PK, 
            name: data[i].NAME
          });
        }
        
        res.contentType('application/json');
        res.status(200)
        res.send(JSON.stringify(result));

    }).catch(error => {
      console.log('ERROR:', error);
    })
  }

  console.log('');

})

app.get('/recipe/count', (req, res) => {

  console.log('');
  console.log('GET /recipe/count');
  console.log('-----------------');

  if (!req.query.name){
    // count all recipes
    db.one(
      'SELECT count(*) from public."Recipe";'
    ).then(data => {
        // log input and output
        console.log('data:',data);
        console.log('query name:',req.query.name);
        console.log('data.count:',Number(data.count));
        // return json respone
        res.status(200)
        res.json({ 
          name: req.query.name ,
          count: Number(data.count)
        });
    }).catch(error => {
      console.log('ERROR:', error);
    })
  }else{
    // count recipes with a specific name
    db.one(
      'SELECT count(*) from public."Recipe" where "NAME" = $1;', 
      [ req.query.name ]
    ).then(data => {
        // log input and output
        console.log('data:',data);
        console.log('query name:',req.query.name);
        console.log('data.count:',Number(data.count));
        // return json respone
        res.status(200)
        res.json({ 
          name: req.query.name ,
          count: Number(data.count)
        });
    }).catch(error => {
      console.log('ERROR:', error);
    })
  }

  console.log('')

})

app.post(
  '/recipe', 
  async (req, res) => {

  console.log('');
  console.log('POST /recipe');
  console.log('-----------------');

  // create uuid
  var uuidv4 = uuid.v4()

  // validate schema
  if(req.get("Content-Type")!="application/json") { 
    req.status(401).send("Invalid header format");
    return;
  }try{
    validator.validate(req.body,recipeSchema,{"throwError":true});
  }catch(error){
    req.status(401).end("Invalid body format: " + error.message);
    return;
  }

  // print input parameter
  console.log('uuid:', uuidv4); // print new user id;
  console.log('name:', res.locals.jsonObject.name); // print new user id;
  console.log('desc:', res.locals.jsonObject.description); // print new user id;
  console.log('image:',res.locals.jsonObject.image); // print new user id;

  if (res.locals.jsonObject.name){
    // search if name exists already in the DB
    db.one(
      'SELECT count(*) from public."Recipe" where "NAME" = $1;', 
      [ res.locals.jsonObject.name ]
    ).then(data => {
        // log input and output
        console.log('data:',data);
        console.log('query name:',req.query.name);
        console.log('data.count:',Number(data.count));
        if (Number(data.count)==0){
          // insert new database record
          console.log('new name');
          db.none(
            'INSERT INTO public."Recipe" ("RECIPE_PK", "NAME", "DESCRIPTION", "IMAGE") VALUES($1, $2, $3, $4);',
            [
              uuidv4,
              res.locals.jsonObject.name,
              res.locals.jsonObject.description,
              res.locals.jsonObject.image
            ]
          )
          .then(data => {
              // return new recipe
              console.log('uuid:',uuidv4);
              res.status(200)
              res.json({ 
                recipe_pk: uuidv4,
                name: res.locals.jsonObject.name,
                description: res.locals.jsonObject.description
                //image: data.IMAGE
              });
          })
          .catch(error => {
              console.log('ERROR:', error); // print error;
          })
        }else{
          console.log('existing name');
          db.one(
            'SELECT * from public."Recipe" where "NAME" = $1;', 
            [ res.locals.jsonObject.name ]
          ).then(data => {
              // log input and output
              console.log('data:',data);
              console.log('query name:',req.query.name);
              // return json respone
              res.status(409)
              res.json({ 
                recipe_pk: data.RECIPE_PK,
                name: data.NAME,
                description: data.DESCRIPTION
        //        //image: data.IMAGE
              });
          }).catch(error => {
            console.log('ERROR:', error);
          })
        }
    })
  }else{
      console.log('no name provided');
  }

  console.log('')

})


app.delete('/recipe', (req, res) => {

  console.log('');
  console.log('DELETE /recipe');
  console.log('-----------------');

  if (req.query.name){
    console.log('query name found');
    // count recipes with a specific name
    db.one(
      'SELECT count(*) from public."Recipe" where "NAME" = $1;', 
      [ req.query.name ]
    ).then(data => {
        // log input and output
        console.log('data:',data);
        console.log('query name:',req.query.name);
        console.log('data.count:',Number(data.count));

        if (Number(data.count)==1){
          // insert new database record
          console.log('existing name');
          db.none(
            'DELETE FROM public."Recipe" r where r."NAME"=$1;'
            ,
            [ req.query.name ]
          )
          .then(data => {
              res.status(204).end()
          })
          .catch(error => {
              console.log('ERROR:', error); // print error;
          })
        }else{
            res.status(404).end()
        }
    }).catch(error => {
      console.log('ERROR:', error);
    })
  }
  console.log('')

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})