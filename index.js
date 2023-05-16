import express from 'express';
//import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';

const app = express();
const PORT = 3000;

// connect to MongoDB
const mongoUrl = 'mongodb://localhost:27017';

const client = new MongoClient(mongoUrl);
await client.connect();

const db = client.db('bank');
const collection = db.collection('accounts')

// Set up body-parser and method-override middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// set up EJS as the view engine
app.set('view engine', 'ejs');

// set up the body parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// define routes for deposit and withdrawal
app.get('/', async (req, res) => {
    let accounts = await db.collection('accounts').find().toArray();
    if (accounts == NaN) {
        accounts = [];
    } else {
    res.render('accounts', { accounts });
    }
  });

app.post('/accounts/:id/transaction', async (req, res) => {
  const { id } = req.params;
  const { amount, action } = req.body;
  const account = await db.collection('accounts').findOne({ _id: new ObjectId(id) });
  if (action === 'deposit') {
    account.balance += Number(amount);
  } else if (action === 'withdraw') {
    if (account.balance >= Number(amount)) {
      account.balance -= Number(amount);
    } else {
      res.status(400).send('Insufficient funds.');
      return;
    }
  }
  await db.collection('accounts').updateOne({ _id: new ObjectId(id)}, { $set: { balance: account.balance } });
  res.redirect('/');
});

app.get('/register', (req, res) => {
    res.render('register.ejs');
  });


app.post('/register', async (req, res) => {
    const { name, balance, email } = req.body;
    const { id } = req.params;
    const query = { email: email }
    let emailTaken = await db.collection('accounts').findOne(query);

    if (emailTaken && emailTaken.email == email) {
      res.status(400).send('User already exist');
      return;
    } else {
      await db.collection('accounts').insertOne({name, email, balance: Number(balance)});
    }
    res.redirect('/');
  });

  app.post('/accounts/:id', async (req, res) => {
    // find the account with the specified id and update its balance
    const { id } = req.params;
    await db.collection('accounts').deleteOne({ _id: new ObjectId(id) });
    res.redirect('/')
  });

// start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});