cd services/recipe
docker build -t getfoodfaster/recipe:latest  .
cd ../..

cd services/rating
docker build -t getfoodfaster/rating:latest  .
cd ../..

cd services/comment
docker build -t getfoodfaster/comment:latest  .
cd ../..