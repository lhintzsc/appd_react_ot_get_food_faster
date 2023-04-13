NAME="getfoodfaster_service_recipe"

docker ps --format "table {{.Names}}\t{{.ID}}" | grep $NAME
ID=`docker ps --format "table {{.Names}}\t{{.ID}}" | grep $NAME | awk '{print $2}'`

echo "Input:" $NAME
echo "ID:" $ID

echo "stop $ID"
docker stop $ID; sleep 5

echo "rm $ID"
docker rm $ID; sleep 5

echo "build services"
cd services/recipe
docker build -t getfoodfaster/recipe:latest  .
cd ../..

echo "docker compuse up"
docker-compose -f docker-compose.yml up &