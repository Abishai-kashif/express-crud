require('dotenv').config();
const express = require('express')
const port = 3000
const app = express()
app.use(express.json())

const pgp = require('pg-promise')()
const db = pgp('postgres://postgres:mysecretpassword@localhost:5432/database')

const RedisClient = require('./redis_client');
const redisClient = new RedisClient();

app.get('/users', async function(req, res, next) {
  try {
    const cacheKey = 'users:all';
    const cached = await redisClient.getCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached, source: 'cache' });
    const users = await db.any('SELECT * FROM users');
    await redisClient.setCache(cacheKey, users);

    res.json({
      success: true,
      data: users,
      source: 'db'
     });
  } catch (error) {
    console.error("Something went wrong while fetching users: ", error)
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while fetching users"
    })
  }
});

app.get('/users/:id', async function(req, res, next) {
  try {
    const userId = req?.params?.id;
    const cacheKey = `user:${userId}`;

    const cached = await redisClient.getCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached, source: 'cache' });

    const user = await db.oneOrNone('SELECT * FROM users WHERE id=$1', userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await redisClient.setCache(cacheKey, user);
    res.json({ success: true, data: user, source: 'db' });
  } catch (error) {
    console.error("Something went wrong while fetching user: ", error)
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while fetching user"
    })
  }
});

app.post('/create', async function(req, res, next) {
  try {
    const user = req?.body || {};
  
    if (!user || !Object.values(user).length) {
      return res.status(400).json({
        success: false,
        message: "Valid user payload is required"
      })
    }
  
    const result = await db.one("INSERT INTO users(name) VALUES($1) RETURNING id", [user?.name])
    await redisClient.delCache('users:all');

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Something went wrong while inserting user: ", error)
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while inserting user"
    })
  }
});

app.put('/update/:id', async function(req, res, next) {
  try {    
    const userId = req?.params?.id;
    const user = req?.body;
  
    if (!user || !userId) {
      return res.status(400).json({
        success: false,
        message: "Valid user payload is required"
      })
    }
    
    await db.none("UPDATE users SET name=$1 WHERE id=$2", [user?.name, userId])

    await redisClient.delCache(`user:${userId}`);
    res.json({
      success: true,
      data: { id: userId }
    });
  } catch (error) {
    console.error("Something went wrong while updating user: ", error)
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while updating user"
    })
  }
});

app.delete('/delete/:id', async function(req, res, next) {
  try {
    const userId = req?.params?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Valid user payload is required"
      })
    }
  
    await db.none("DELETE FROM users WHERE id=$1", [userId])

    await redisClient.delCache(`user:${userId}`);
    res.json({ success: true, data: { id: userId } });
  } catch (error) {
    console.error("Something went wrong while deleting user: ", error)
    res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong while deleting user"
    })
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})