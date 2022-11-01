const express = require('express');
const Joi = require('@hapi/joi');
const axios = require('axios').default;
const { insertManyVideogames, getAllVideoGames, insertManyGenres, getGenres, insertVideogame, deleteVideoGame, getVideoGame, updateVideoGame, countVideoGames, insertManyPlatforms, getPlatforms, deleteVideoGames, deletePlatforms, deleteGenres } = require('./db');

const { API_KEY } = process.env;

const router = express.Router();

const genreSchema = Joi.object().keys({
  id: Joi.number().integer(),
  name: Joi.string(),
});

const genresSchema = Joi.array().items(genreSchema)

const videoGameSchema = Joi.object().keys({
  id: Joi.number().integer(),
  name: Joi.string(),
  description: Joi.string(),
  release_date: Joi.string().isoDate(),
  rating: Joi.number().min(1).max(5),
  platforms: Joi.array().items(Joi.string()),
  image: Joi.string(),
  genres: genresSchema,
});

const allVideoGamesSchema = Joi.array().items(videoGameSchema);

router.post('/videogames', (req, res) => {
  const urls = [1, 2, 3, 4, 5].map(num => axios.get(`https://api.rawg.io/api/games?key=${API_KEY}&page=${num}`));
  Promise.all(urls)
    .then((responses) => {
      let allVideoGames = [].concat(...responses.map(response => response.data.results))
        .map(videogame => ({
          id: videogame.id,
          name: videogame.name,
          rating: videogame.rating,
          image: videogame.background_image,
          genres: videogame.genres.map(genre => ({ id: genre.id, name: genre.name }))
        }))
      const result = allVideoGamesSchema.validate(allVideoGames);
      if (result.error) {
        console.log(result.error)
        res.status(400).end()
        return
      };
      insertManyVideogames(allVideoGames);
    }).then(() => {
      res.status(200).end()
    })
    .catch((err) => {
      console.log(err)
      res.status(500).end()
    });
});


router.get('/videogames', (req, res) => {
  const { name, page, order, orderBy, type, genres } = req.query;
  getAllVideoGames(name, page, order, orderBy, type, genres)
    .then((videogames) => {
      videogames = videogames.map((videogame) => ({
        _id: videogame._id,
        id: videogame.id,
        name: videogame.name,
        image: videogame.image,
        genres: videogame.genres
      }))
      res.json(videogames)
    })
    .catch((err) => {
      console.log(err)
      res.status(500).end()
    });
});

router.get('/videogames/count', (req, res) => {
  const { name, type, genres } = req.query;
  countVideoGames(name, type, genres)
    .then((response) => {
      res.json(response)
    })
    .catch((err) => {
      console.log(err)
      res.status(500).end()
    });
});

router.post('/genres', (req, res) => {
  axios.get(`https://api.rawg.io/api/genres?key=${API_KEY}`).then((response) => {
    let allGenres = response.data.results.map(genre => ({
      id: genre.id,
      name: genre.name,
    }))
    const result = genresSchema.validate(allGenres);
    if (result.error) {
      console.log(result.error)
      res.status(400).end()
      return
    };
    insertManyGenres(allGenres);
  })
    .then(() => {
      res.status(200).end()
    })
    .catch((err) => {
      console.log(err)
      res.status(500).end()
    });
});

router.get('/genres', (req, res) => {
  getGenres()
    .then((genres) => {
      genres = genres.map((genre) => ({
        id: genre.id,
        name: genre.name,
      }))
      res.json(genres)
    })
    .catch((err) => {
      console.log(err)
      res.status(500).end()
    });
});

router.post('/platforms', (req, res) => {
  axios.get(`https://api.rawg.io/api/platforms?key=${API_KEY}`).then((response) => {
    let allPlatforms = response.data.results.map(platform => ({
      id: platform.id,
      name: platform.name,
    }))
    const result = genresSchema.validate(allPlatforms);
    if (result.error) {
      console.log(result.error)
      res.status(400).end()
      return
    };
    insertManyPlatforms(allPlatforms);
  })
    .then(() => {
      res.status(200).end()
    })
    .catch((err) => {
      console.log(err)
      res.status(500).end()
    });
});

router.get('/platforms', (req, res) => {
  getPlatforms()
    .then((platforms) => {
      platforms = platforms.map((platform) => ({
        id: platform.id,
        name: platform.name,
      }))
      res.json(platforms)
    })
    .catch((err) => {
      console.log(err)
      res.status(500).end()
    });
});

router.post('/videogame', (req, res) => {
  const videogame = req.body;
  const result = videoGameSchema.validate(videogame);
  if (result.error) {
    console.log(result.error)
    res.status(400).end()
    return
  };
  insertVideogame(videogame)
    .then(() => {
      res.status(200).end()
    })
    .catch((err) => {
      console.log(err)
      res.status(500).end()
    });
});

router.delete('/videogame/:id', (req, res) => {
  const { id } = req.params;
  deleteVideoGame(id)
    .then(() => {
      res.status(200).end()
    })
    .catch((err) => {
      console.log(err)
      res.status(500).end()
    });
});

router.get('/videogame/:id', (req, res) => {
  const { id } = req.params;
  !isNaN(Number(id)) ?
    axios.get(`https://api.rawg.io/api/games/${id}?key=${API_KEY}`)
      .then((response) => {
        let videogame = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description,
          release_date: response.data.released,
          rating: response.data.rating,
          platforms: response.data.platforms.map(obj => ({
            name: obj.platform.name,
            id: obj.platform.id
          })),
          image: response.data.background_image,
          genres: response.data.genres.map(genre => ({
            id: genre.id,
            name: genre.name
          }))
        };
        res.json(videogame);
      }).catch((err) => {
        console.log(err)
        res.status(500).end()
      }) :
    getVideoGame(id)
      .then((response) => {
        res.json(response)
      })
      .catch((err) => {
        console.log(err)
        res.status(500).end()
      });
});

router.put('/videogame/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, release_date, rating, platforms, image, genres } = req.body;
  const updates = { name, description, release_date, rating, platforms, image, genres };
  const result = videoGameSchema.validate(updates);
  if (result.error) {
    console.log(result.error)
    res.status(400).end()
    return
  };
  updateVideoGame(id, updates)
    .then(() => {
      res.status(200).end()
    })
    .catch((err) => {
      console.log(err)
      res.status(500).end()
    });
});

router.delete('/videogames', (req, res) => {
  deleteVideoGames()
    .then(() => {
      res.status(200).end()
    })
    .catch((err) => {
      console.log(err)
      res.status(500).end()
    });
});

router.delete('/platforms', (req, res) => {
  deletePlatforms()
    .then(() => {
      res.status(200).end()
    })
    .catch((err) => {
      console.log(err)
      res.status(500).end()
    });
});

router.delete('/genres', (req, res) => {
  deleteGenres()
    .then(() => {
      res.status(200).end()
    })
    .catch((err) => {
      console.log(err)
      res.status(500).end()
    });
});

module.exports = router;
