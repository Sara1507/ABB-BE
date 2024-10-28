const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
const server = http.createServer(app);
const io = new Server(server);


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const authRoutes = require('./routes/auth');

const auctionItemSchema = new mongoose.Schema({
    title: String,
    description: String,
    startingBid: Number,
    endDate: Date,
});

const AuctionItem = mongoose.model('AuctionItem', auctionItemSchema);

// Create Auction Item
app.post('/api/auction-items', async (req, res) => {
    const item = new AuctionItem(req.body);
    await item.save();
    res.status(201).send(item);
});

// Get All Auction Items
app.get('/api/auction-items', async (req, res) => {
    const items = await AuctionItem.find();
    res.send(items);
});

// Update Auction Item
app.put('/api/auction-items/:id', async (req, res) => {
    const item = await AuctionItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.send(item);
});

// Delete Auction Item
app.delete('/api/auction-items/:id', async (req, res) => {
    await AuctionItem.findByIdAndDelete(req.params.id);
    res.status(204).send();
});

let auctions = {
    1: {
      item: 'Vintage Vase',
      highestBid: 100,
      bidHistory: [],
    },
  };
  
  app.get('/api/auctions/:id', (req, res) => {
    const auction = auctions[req.params.id];
    res.json(auction);
  });
  
  app.post('/api/auctions/:id/bid', (req, res) => {
    const auctionId = req.params.id;
    const { user, amount } = req.body;
  
    const auction = auctions[auctionId];
    if (amount > auction.highestBid) {
      auction.bidHistory.push({ user, amount });
      auction.highestBid = amount;
      io.emit('outbid', { auctionId, user, amount }); // Notify all users
      res.status(200).json({ success: true, highestBid: amount });
    } else {
      res.status(400).json({ success: false, message: 'Bid must be higher than current highest bid.' });
    }
  });

// app.listen(5000, () => {
//     console.log('Server running on port 5000');
// });

io.on('connection', (socket) => {
    console.log('A user connected');
  
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
  
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
