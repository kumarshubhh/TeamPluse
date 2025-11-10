const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




mongoose.connect('mongodb+srv://shubh:Shubh@cluster0.isujjgg.mongodb.net/?appName=Cluster0', {
  
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Failed to connect to MongoDB', err);
});




// Sample route
app.get('/', (req, res) => {
  res.send('Hello World!');


});

app.post('/users', async (req, res)=>{

       
    try{
        const { username, passwordHash: plainPassword, email } = req.body;
        if(!username || !plainPassword || !email){
            return res.status(400).json({error: 'All fields are required'});
        }

        const existingUser = await User.findOne({$or: [{username}, {email}]});
        if(existingUser){
            return res.status(409).json({error: 'Username or email already exists'});
        }
        
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const newUser = new User({ username, passwordHash: hashedPassword, email });

       
        await newUser.save();
        res.status(201).json({message: 'User created successfully', userId: newUser._id});
    }catch(err){
        console.error('Error creating user:', err);
        res.status(500).json({error: 'Internal server error'});
    }
})

app.post('/login', async (req, res) => {
    try {
      const { username, passwordHash } = req.body;
      if (!username || !passwordHash) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
  
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
  
      const isPasswordValid = await bcrypt.compare(passwordHash, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' }); 
       
  
      res.status(200).json({ message: 'Login successful', userId: user._id , token });
    } catch (err) {
      console.error('Error during login:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


const verifyToken = async (req, res, next ) =>{

    const header = req.headers['authorization'];
    if(!header) return res.status(401).json({ error: 'Authorization header missing' });

    const token = header.split(' ')[1];
    if(!token) return res.status(401).json({ error: 'Token missing' });

    try{
        const decoded = jwt.verify(token, 'your_jwt_secret');
        req.userId = decoded.userId;
        next(); 
    }catch(err){
        return res.status(401).json({ error: 'Invalid or expired token' });
    }


}
// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});