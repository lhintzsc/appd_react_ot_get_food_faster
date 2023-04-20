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

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/rating', (req, res) => {

  console.log('');
  console.log('GET /rating');
  console.log('-----------------');

  if (req.query.recipe_fk){
    // return recipe with name
    db.one(
      'SELECT * FROM public."Rating" r WHERE r."RECIPE_FK" = $1;'
      , 
      [ req.query.recipe_fk ]
    ).then(data => {
      // log input and output
      console.log('data:',data);
      console.log('query recipe_fk:',req.query.recipe_fk);
      // return json respone
      res.status(200)

      numstars =
        data.N1STARS
       +data.N2STARS
       +data.N3STARS
       +data.N4STARS
       +data.N5STARS

      avgstars =
       (1.0*data.N1STARS
       +2.0*data.N2STARS
       +3.0*data.N3STARS
       +4.0*data.N4STARS
       +5.0*data.N5STARS)/numstars

      res.json({ 
        rating_pk: data.RATING_PK,
        recipe_fk: data.RECIPE_FK,
        n1stars: data.N1STARS,
        n2stars: data.N2STARS,
        n3stars: data.N3STARS,
        n4stars: data.N4STARS,
        n5stars: data.N5STARS,
        stars_avg: avgstars,
        stars_num: numstars
      });
    }).catch(error => {
      res.status(404).end()
    })
  }else{
      res.status(400).end()
  }

  console.log('');
})

app.get('/rating/count', (req, res) => {

  console.log('');
  console.log('GET /rating/count');
  console.log('-----------------');

    // return recipe with name
    db.one(
      'SELECT count(*) from public."Rating";'
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

  console.log('');

})

app.post('/rating', (req, res) => {

  console.log('');
  console.log('POST /rating');
  console.log('-----------------');

  var uuidv4 = uuid.v4()

  sql=
  'SELECT r."RECIPE_PK", r2."RECIPE_FK", r2."RATING_PK", r2."N1STARS", r2."N2STARS", r2."N3STARS", r2."N4STARS", r2."N5STARS" '+
  'FROM public."Recipe" r '+
  'LEFT JOIN public."Rating" r2 ON (r2."RECIPE_FK" = r."RECIPE_PK") '+
  'WHERE r."RECIPE_PK" = $1'
  console.log('sql:',sql);

  if (req.query.recipe_pk && req.query.rating){
    // return recipe with name
    db.one(
      sql,[ req.query.recipe_pk ]
    ).then(data => {
      // log input and output
      console.log('data:',data);
      console.log('query recipe_pk:',req.query.recipe_pk);
      console.log('data rating_pk:', data.RATING_PK);
      if (
        data.RECIPE_PK != null && 
        data.RECIPE_FK == null && 
        (req.query.rating >= 1 && req.query.rating <=5)
      ){
        console.log('creating rating')

        sql='INSERT INTO public."Rating" '+
            '("RATING_PK", "N1STARS", "N2STARS", "N3STARS", "N4STARS", "N5STARS", "RECIPE_FK") '+
            'VALUES($1, $2, $3, $4, $5, $6, $7);'

        s1= 0;
        s2= 0;
        s3= 0;
        s4= 0;
        s5= 0;

        switch(Number(req.query.rating)){
          case 1:
            console.log('case1');
            s1=s1+1;
            break;
          case 2:
            console.log('case2');
            s2=s2+1;
            break;
          case 3:
            console.log('case3');
            s3=s3+1;
            break;
          case 4:
            console.log('case4');
            s4=s4+1;
            break;
          case 5:
            console.log('case5');
            s5=s5+1;
            break;
        }

        console.log('after switch, before INSERT')

        db.none(
          sql,[ String(uuidv4), String(s1), String(s2), String(s3), String(s4), String(s5), String(data.RECIPE_PK) ]
        ).then(data2 => {
          console.log('INSERT SQL');
          numstars = s1+s2+s3+s4+s5;
          avgstars = (1.0*s1+2.0*s2+3.0*s3+4.0*s4+5.0*s5)/numstars;
          res.status(200)
          res.json({ 
            rating_pk: String(uuidv4),
            recipe_fk: String(data.RECIPE_PK),
            n1stars: s1,
            n2stars: s2,
            n3stars: s3,
            n4stars: s4,
            n5stars: s5,
            stars_avg: avgstars,
            stars_num: numstars
          }).end();

        }).catch(error => {
          res.status(404).end()
        })

      }else if(
        data.RECIPE_PK != null && 
        data.RECIPE_FK == null && 
        (req.query.rating > 5 || req.query.rating < 1 )
      ){
        console.log('creating empty rating')

        sql='INSERT INTO public."Rating" '+
            '("RATING_PK", "N1STARS", "N2STARS", "N3STARS", "N4STARS", "N5STARS", "RECIPE_FK") '+
            'VALUES($1, $2, $3, $4, $5, $6, $7);'

        db.one(
          sql,[ uuidv4, String(0), String(0), String(0), String(0), String(0), data.RATING_PK ]
        ).then(data2 => {
          res.status(200)
          res.json({ 
            rating_pk: data.RATING_PK,
            recipe_fk: data.RECIPE_FK,
            n1stars: 0,
            n2stars: 0,
            n3stars: 0,
            n4stars: 0,
            n5stars: 0,
            stars_avg: 0,
            stars_num: 0
          });
        }).catch(error => {
          res.status(404).end()
        })


      }else if(
        data.RECIPE_PK != null && 
        data.RECIPE_FK != null && 
        (req.query.rating >= 1 && req.query.rating <=5)
      ){
        console.log("update rating");

        s1= Number(data.N1STARS);
        s2= Number(data.N2STARS);
        s3= Number(data.N3STARS);
        s4= Number(data.N4STARS);
        s5= Number(data.N5STARS);

        switch(Number(req.query.rating)){
          case 1:
            console.log('case1');
            s1=s1+1;
            break;
          case 2:
            console.log('case2');
            s2=s2+1;
            break;
          case 3:
            console.log('case3');
            s3=s3+1;
            break;
          case 4:
            console.log('case4');
            s4=s4+1;
            break;
          case 5:
            console.log('case5');
            s5=s5+1;
            break;
        }

        sql=  'UPDATE public."Rating" ' +
              'SET "N1STARS"=$1, "N2STARS"=$2, "N3STARS"=$3, "N4STARS"=$4, "N5STARS"=$5 '+
              'WHERE "RATING_PK" = $6;';

        db.none(
          sql,[ String(s1), String(s2), String(s3), String(s4), String(s5), data.RATING_PK ]
        ).then(data2 => {
          numstars = s1+s2+s3+s4+s5;
          avgstars = (1.0*s1+2.0*s2+3.0*s3+4.0*s4+5.0*s5)/numstars;
          res.status(200)
          res.json({ 
            rating_pk: data.RATING_PK,
            recipe_fk: data.RECIPE_FK,
            n1stars: s1,
            n2stars: s2,
            n3stars: s3,
            n4stars: s4,
            n5stars: s5,
            stars_avg: avgstars,
            stars_num: numstars
          });
        }).catch(error => {
          res.status(404).end()
        })

      }else if(
        data.RECIPE_PK != null && 
        data.RECIPE_FK != null && 
        (req.query.rating > 5 || req.query.rating < 1 )
      ){

        console.log("clear rating");

        sql=  'UPDATE public."Rating" ' +
              'SET "N1STARS"=$1, "N2STARS"=$2, "N3STARS"=$3, "N4STARS"=$4, "N5STARS"=$5 '+
              'WHERE "RATING_PK" = $6;';

        db.any(
          sql,[ String(0), String(0), String(0), String(0), String(0), data.RATING_PK ]
        ).then(data2 => {
          numstars = 0;
          avgstars = 0;
          res.status(200)
          res.json({ 
            rating_pk: data.RATING_PK,
            recipe_fk: data.RECIPE_FK,
            n1stars: 0,
            n2stars: 0,
            n3stars: 0,
            n4stars: 0,
            n5stars: 0,
            stars_avg: avgstars,
            stars_num: numstars
          });
        }).catch(error => {
          res.status(404).end()
        })
      }
    }).catch(error => {
      res.status(404).end()
    })
  }else{
      res.status(400).end()
  }

  console.log('');

})

app.delete('/rating', (req, res) => {

  console.log('');
  console.log('DELETE /rating');
  console.log('-----------------');

  console.log('delete rating for recipe')

  if (req.query.recipe_fk){
    // count rating for a specific recipe
    db.one(
      'SELECT count(*) FROM public."Rating" WHERE "RECIPE_FK" = $1;', 
      [ req.query.recipe_fk ]
    ).then(data => {
        // log input and output
        console.log('data:',data);
        console.log('query name:',req.query.name);
        console.log('data.count:',Number(data.count));

        if (Number(data.count)==1){
          // delete rating for a specific recipe
          console.log('existing name');
          db.none(
            'DELETE FROM public."Rating" WHERE "RECIPE_FK"=$1;'
            ,
            [ req.query.recipe_fk ]
          )
          .then(data => {
            console.log('rating deleted');
            res.status(204).end()
          })
          .catch(error => {
              console.log('ERROR:', error); // print error;
          })
        }else{
          console.log('rating does not exist');
          res.status(404).end()
        }
    }).catch(error => {
      console.log('ERROR:', error);
    })

  }else{

    console.log('query parameter recipe_fk not found');
    res.status(400).end()

  }

  console.log('');

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})