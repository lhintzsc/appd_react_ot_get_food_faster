// load modules
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

// definition for schema validation
var commentSchema = { 
  "id":"/comment", 
  "type":"object", 
  "properties":{  
    "comment": {"type":"string"}
  }, 
  "required" :["comment"]
};

var validator = new jsonValidator();
validator.addSchema(commentSchema, '/comment');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// middleware to parse json
const parseJSON = function(req,res,next){
  console.log('parseJSON')
  res.locals.jsonObject = JSON.parse(JSON.stringify(req.body))
  next()
}

app.use(parseJSON)

app.get('/comment', (req, res) => {

  console.log('');
  console.log('GET /comment');
  console.log('-----------------');

  if ( req.query.recipe_pk && 
       req.query.comment_pk
      ){
    // return comment for recipe
    console.log('get specific comment for recipe');
    db.any(
      'SELECT * FROM public."Comment" r WHERE r."RECIPE_FK" = $1 AND r."COMMENT_PK" = $2;'
      , 
      [ req.query.recipe_pk, req.query.comment_pk ]
    ).then(data => {
      // log input and output
      console.log('data:',data);
      console.log('query recipe_pk:',req.query.recipe_pk);
      console.log('query comment_pk:',req.query.comment_pk);
      // return json respone
      res.status(200)

      res.json({ 
        comment_pk: data[0].COMMENT_PK,
        recipe_fk: data[0].RECIPE_FK,
        comment: data[0].COMMENT
      });

    }).catch(error => {
      res.status(404).end()
    })
  }else if (req.query.recipe_pk){
    console.log('get all comments for recipe');
    db.any(
      'SELECT * FROM public."Comment" r WHERE r."RECIPE_FK" = $1;',
      [ req.query.recipe_pk ]
    ).then(data => {
      // log input and output
      console.log('data:', data);
      console.log('query recipe_pk:',req.query.recipe_pk);

      var result = [];
      for (var i in data) {
        result.push({
          comment_pk: data[i].COMMENT_PK, 
          recipe_fk: data[i].RECIPE_FK, 
          comment: data[i].COMMENT 
        });
      }
      
      res.contentType('application/json');
      res.status(200)
      res.send(JSON.stringify(result));

    }).catch(error => {
      res.status(404).end()
    })
  }else{
      res.status(400).end()
  }

  console.log('');
})

app.get('/comment/count', (req, res) => {

  console.log('');
  console.log('GET /comment/count');
  console.log('-----------------');

    if (req.query.recipe_pk){
      // search if name exists already in the DB
      db.one(
        'SELECT count(*) from public."Recipe" where "RECIPE_PK" = $1;', 
        [ req.query.recipe_pk ]
      ).then(data => {
          // log input and output
          console.log('data:',data);
          console.log('data.count:',Number(data.count));
          if (Number(data.count)==1){
            console.log('count number of comments for recipe');
            db.one(
              'SELECT count(*) FROM public."Comment" WHERE "RECIPE_FK" = $1;',
              [
               req.query.recipe_pk
              ]
            )
            .then(data => {
                // return new recipe
                res.status(200)
                res.json({ 
                  recipe_fk: req.query.recipe_fk,
                  count: data.count,
                }).end();
            })
            .catch(error => {
                console.log('ERROR:', error); // print error;
            })
          }else{
            console.log('recipe does not exist');
            res.status(400).end()
          }
      })
    }else {
      db.one(
        'SELECT count(*) from public."Comment";'
      ).then(data => {
          // log input and output
          console.log('data:',data);
          // return json respone
          res.status(200)
          res.json({ 
            count: data.count
          });
      }).catch(error => {
        console.log('ERROR:', error);
      })
    }

  console.log('');

})

app.post('/comment', (req, res) => {

  console.log('');
  console.log('POST /comment');
  console.log('-----------------');

  var uuidv4 = uuid.v4()

  // validate schema
  if(req.get("Content-Type")!="application/json") { 
    req.status(401).send("Invalid header format");
    return;
  }try{
    validator.validate(req.body,commentSchema,{"throwError":true});
  }catch(error){
    req.status(401).send("Invalid body format: " + error.message);
    return;
  }

  // print input parameter
  console.log('uuid:', uuidv4); // print new user id;
  console.log('name:', res.locals.jsonObject.comment); // print new user id;

  if (
      res.locals.jsonObject.comment &&
      req.query.recipe_pk
     ){
    // search if name exists already in the DB
    db.one(
      'SELECT count(*) from public."Comment" where "COMMENT" = $1;', 
      [ res.locals.jsonObject.comment ]
    ).then(data => {
        // log input and output
        console.log('data:',data);
        console.log('query name:',req.query.comment);
        console.log('data.count:',Number(data.count));
        if (Number(data.count)==0){
          // insert new database record
          console.log('new comment');
          db.none(
            'INSERT INTO public."Comment" ("COMMENT_PK", "COMMENT", "RECIPE_FK") VALUES($1, $2, $3);',
            [
              uuidv4,
              res.locals.jsonObject.comment,
              res.req.query.recipe_pk,
            ]
          )
          .then(data => {
              // return new recipe
              console.log('uuid:',uuidv4);
              res.status(200)
              res.json({ 
                comment_pk: uuidv4,
                comment: res.locals.jsonObject.comment,
                recipe_fk: res.req.query.recipe_pk
                //image: data.IMAGE
              });
          })
          .catch(error => {
              console.log('ERROR:', error); // print error;
          })
        }else{
          console.log('existing comment');
          db.one(
            'SELECT * from public."Comment" where "COMMENT" = $1;', 
            [ res.locals.jsonObject.comment ]
          ).then(data => {
              // log input and output
              console.log('data:',data);
              console.log('body comment:',res.locals.jsonObject.comment);
              // return json respone
              res.status(409)
              res.json({ 
                comment_pk: data.COMMENT_PK,
                comment: data.COMMENT,
                recipe_fk: data.RECIPE_FK
              });
          }).catch(error => {
            console.log('ERROR:', error);
          })
        }
    })
  }else{
    console.log('no comment provided');
    res.status(400).end()
  }

  console.log('');

})

app.delete('/comment', (req, res) => {

  console.log('');
  console.log('DELETE /comment');
  console.log('-----------------');

  if (
    req.query.comment_pk && !req.query.recipe_pk
  ){
    // check if comment exist
    db.one(
      'SELECT count(*) FROM public."Comment" WHERE "COMMENT_PK" = $1;', 
      [ req.query.comment_pk ]
    ).then(data => {
        // log input and output
        console.log('data:',data);
        console.log('query comment_pk:',req.query.comment_pk);
        console.log('data.count:',Number(data.count));

        if (Number(data.count)>=1){
          // delete database record
          console.log('existing comment');
          db.none(
            'DELETE FROM public."Comment" WHERE "COMMENT_PK"=$1;'
            ,
            [ req.query.comment_pk ]
          )
          .then(data => {
            console.log('comment deleted');
            res.status(204).end()
          })
          .catch(error => {
              console.log('ERROR:', error); // print error;
          })
        }else{
          console.log('comment does not exist');
          res.status(404).end()
        }
    }).catch(error => {
      console.log('ERROR:', error);
    })

  }else if (
    !req.query.comment_pk && req.query.recipe_pk
  ){
    // check if comment exist
    db.one(
      'SELECT count(*) FROM public."Comment" WHERE "RECIPE_FK" = $1;', 
      [ req.query.recipe_pk ]
    ).then(data => {
        // log input and output
        console.log('data:',data);
        console.log('query recipe_pk:',req.query.recipe_pk);
        console.log('data.count:',Number(data.count));

        if (Number(data.count)>=1){
          console.log('delete all comments for a recipe');
          db.any(
            'DELETE FROM public."Comment" WHERE "RECIPE_FK"=$1;', [ req.query.recipe_pk ]
          )
          .then(data => {
            console.log('comments deleted');
            res.status(204).end();
          })
          .catch(error => {
              console.log('ERROR:', error); // print error;
          })
        }else{
          console.log('comment does not exist');
          res.status(404).end()
        }
    }).catch(error => {
      console.log('ERROR:', error);
    })

  }else{

    console.log('query parameter comment_pk or recipe_pk not found');
    res.status(400).end()

  }

  console.log('');

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})