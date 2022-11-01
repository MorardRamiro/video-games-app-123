require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const {
  DB_NAME,
  DB_PASSWORD
} = process.env;

const connectionUrl = `mongodb+srv://${DB_NAME}:${DB_PASSWORD}@cluster0.bd9ssgv.mongodb.net/?retryWrites=true&w=majority`;
const dbName = 'store';

let db;

const init = () =>
  MongoClient.connect(connectionUrl, { useNewUrlParser: true }).then((client) => {
    db = client.db(dbName);
    const videogames = db.collection('videogames');
    videogames.createIndex({ name: 1, id: 1 }, { unique: true });
    const genres = db.collection('genres');
    genres.createIndex({ name: 1, id: 1 }, { unique: true });
    const platforms = db.collection('platforms');
    platforms.createIndex({ name: 1, id: 1 }, { unique: true });
  });

const insertManyVideogames = (videogames) => {
  const collection = db.collection('videogames');
  return collection.insertMany(videogames);
};

const getAllVideoGames = (name, pageNumber, order, orderBy, type, genres) => {
  const collection = db.collection('videogames');
  const nameRegEx = new RegExp(`.*${name}.*`, 'i');
  const query = {};
  if (name && name.length) {
    query.name = nameRegEx;
  };
  if (type && type.length) {
    if (type === 'official') {
      query.id = { $exists: true };
    };
    if (type === 'custom') {
      query.id = { $exists: false };
    };
  };
  if (genres && genres.length) {
    query['genres.id'] = { $all: genres.split(',').map(Number) };
  };
  return collection.find(query)
    .sort(orderBy === 'rating' ? { rating: order === 'desc' ? -1 : 1 } : { name: order === 'desc' ? -1 : 1 })
    .skip((pageNumber - 1) * 15)
    .limit(15)
    .toArray()
};

const countVideoGames = (name, type, genres) => {
  const collection = db.collection('videogames');
  const nameRegEx = new RegExp(`.*${name}.*`, 'i');
  const query = {};
  if (name && name.length) {
    query.name = nameRegEx;
  };
  if (type && type.length) {
    if (type === 'official') {
      query.id = { $exists: true };
    };
    if (type === 'custom') {
      query.id = { $exists: false };
    };
  };
  if (genres && genres.length) {
    query['genres.id'] = { $all: genres.split(',').map(Number) };
  };
  return collection.count(query)
};

const insertManyGenres = (genres) => {
  const collection = db.collection('genres');
  return collection.insertMany(genres);
};

const getGenres = () => {
  const collection = db.collection('genres');
  return collection.find({}).toArray();
};

const insertManyPlatforms = (platforms) => {
  const collection = db.collection('platforms');
  return collection.insertMany(platforms);
};

const getPlatforms = () => {
  const collection = db.collection('platforms');
  return collection.find({}).toArray();
};

const insertVideogame = (videogame) => {
  const collection = db.collection('videogames');
  return collection.insertOne(videogame);
};

const deleteVideoGame = (id) => {
  const collection = db.collection('videogames');
  return collection.deleteOne(!isNaN(Number(id)) ? { id: Number(id) } : { _id: ObjectId(id) });
};

const getVideoGame = (id) => {
  const collection = db.collection('videogames');
  return collection.findOne({ _id: ObjectId(id) });
};

const updateVideoGame = (id, updates) => {
  const query = !isNaN(Number(id)) ? { id: Number(id) } : { _id: ObjectId(id) }
  Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key])
  const collection = db.collection('videogames');
  return collection.updateOne(query, { $set: updates })
};

const deleteVideoGames = () => {
  const collection = db.collection('videogames');
  return collection.deleteMany({});
};

const deleteGenres = () => {
  const collection = db.collection('genres');
  return collection.deleteMany({});
};

const deletePlatforms = () => {
  const collection = db.collection('platforms');
  return collection.deleteMany({});
};

module.exports = {
  init, insertManyVideogames, getAllVideoGames,
  insertManyGenres, getGenres, insertVideogame,
  deleteVideoGame, getVideoGame, updateVideoGame,
  countVideoGames, insertManyPlatforms, getPlatforms,
  deleteVideoGames, deleteGenres, deletePlatforms,
};
