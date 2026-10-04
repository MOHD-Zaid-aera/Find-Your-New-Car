const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const defaultPort = Number(process.env.PORT) || 4000;
const contactsFile = path.join(__dirname, 'data', 'contacts.json');
const ratingsFile = path.join(__dirname, 'data', 'ratings.json');
const carsFile = path.join(__dirname, 'data', 'cars.json');
const usersFile = path.join(__dirname, 'data', 'users.json');
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'nowarise';
const sessions = new Map();

function normalizeFuelType(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (['ev', 'electric', 'electric vehicle'].includes(normalized)) {
    return 'Electric';
  }

  if (['petrol', 'gasoline'].includes(normalized)) {
    return 'Petrol';
  }

  if (['cng', 'compressed natural gas'].includes(normalized)) {
    return 'CNG';
  }

  if (['diesel'].includes(normalized)) {
    return 'Diesel';
  }

  return value || 'Petrol';
}

function loadCars() {
  try {
    const cars = fs.existsSync(carsFile)
      ? JSON.parse(fs.readFileSync(carsFile, 'utf8'))
      : [];

    return cars.map(car => ({
      ...car,
      fuelType: normalizeFuelType(car.fuelType)
    }));
  } catch (error) {
    console.error('Failed to load cars:', error);
    return [];
  }
}

function saveCars(cars) {
  fs.writeFileSync(carsFile, JSON.stringify(cars, null, 2), 'utf8');
}

function loadUsers() {
  try {
    return fs.existsSync(usersFile)
      ? JSON.parse(fs.readFileSync(usersFile, 'utf8'))
      : [];
  } catch (error) {
    console.error('Failed to load users:', error);
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'salt_key').digest('hex');
}

function getSessionToken(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader
    .split(';')
    .map(item => item.trim())
    .find(item => item.startsWith('admin_session='));

  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
}

function requireAdmin(req, res, next) {
  const token = getSessionToken(req);
  if (token && sessions.has(token)) {
    return next();
  }

  if (req.method === 'GET') {
    return res.redirect('/login.html');
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

app.use(cors());
app.use(express.json());

app.post('/api/login', (req, res) => {
  const { username, email, password } = req.body;

  // Check admin login
  if (username === adminUsername && password === adminPassword) {
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, { username });
    res.setHeader('Set-Cookie', `admin_session=${token}; HttpOnly; Path=/; SameSite=Lax`);
    return res.json({ success: true, message: 'Admin login successful' });
  }

  // Check user email login
  if (email) {
    const users = loadUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user && user.password === hashPassword(password)) {
      const token = crypto.randomBytes(24).toString('hex');
      sessions.set(token, { email: user.email, fullName: user.fullName });
      res.setHeader('Set-Cookie', `user_session=${token}; HttpOnly; Path=/; SameSite=Lax`);
      return res.json({ success: true, message: 'Login successful', user: { email: user.email, fullName: user.fullName } });
    }
    
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  return res.status(401).json({ error: 'Invalid credentials.' });
});

app.post('/api/register', (req, res) => {
  const { fullName, email, phone, password } = req.body;

  // Validation
  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (phone.length < 10) {
    return res.status(400).json({ error: 'Phone number must be at least 10 digits.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  // Check if user already exists
  const users = loadUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered. Please login or use a different email.' });
  }

  // Create new user
  const newUser = {
    id: crypto.randomBytes(8).toString('hex'),
    fullName,
    email,
    phone,
    password: hashPassword(password),
    registeredAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);

  return res.status(201).json({ 
    success: true, 
    message: 'Registration successful! Please login with your email.',
    user: { email: newUser.email, fullName: newUser.fullName }
  });
});

app.post('/api/logout', (req, res) => {
  const token = getSessionToken(req);
  if (token) {
    sessions.delete(token);
  }

  res.setHeader('Set-Cookie', 'admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return res.json({ success: true });
});

app.get('/api/cars', (req, res) => {
  res.json(loadCars());
});

app.get('/api/inquiries', requireAdmin, (req, res) => {
  try {
    const inquiries = fs.existsSync(contactsFile)
      ? JSON.parse(fs.readFileSync(contactsFile, 'utf8'))
      : [];

    const sortedInquiries = [...inquiries].sort((a, b) => {
      const aTime = new Date(a.submittedAt || 0).getTime();
      const bTime = new Date(b.submittedAt || 0).getTime();
      return bTime - aTime;
    });

    res.json(sortedInquiries);
  } catch (error) {
    console.error('Failed to load inquiries:', error);
    res.status(500).json({ error: 'Unable to load inquiries.' });
  }
});

app.get('/login', (req, res) => {
  res.redirect('/login.html');
});

app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin.html', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.post('/api/cars', requireAdmin, (req, res) => {
  const car = req.body;
  if (!car?.brand || !car?.model || !car?.price || !car?.fuelType || !car?.description) {
    return res.status(400).json({ error: 'Brand, model, price, fuel type, and description are required.' });
  }

  try {
    const currentCars = loadCars();
    const newCar = {
      ...car,
      id: car.id || Date.now(),
      brand: car.brand,
      model: car.model,
      price: car.price,
      fuelType: normalizeFuelType(car.fuelType),
      transmission: car.transmission || 'Manual',
      seats: Number(car.seats) || 5,
      mileage: car.mileage || 'N/A',
      rating: Number(car.rating) || 4.0,
      segment: car.segment || 'New',
      imageUrl: car.imageUrl || 'images/car-placeholder.svg',
      description: car.description,
      launchCategory: car.launchCategory || car.fuelType,
      buyUrl: car.buyUrl || '#',
      highlights: Array.isArray(car.highlights)
        ? car.highlights
        : String(car.highlights || '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
    };

    currentCars.push(newCar);
    saveCars(currentCars);

    res.status(201).json({ success: true, car: newCar });
  } catch (error) {
    console.error('Failed to save car:', error);
    res.status(500).json({ error: 'Unable to save car at this time.' });
  }
});

app.patch('/api/cars/:id', requireAdmin, (req, res) => {
  const { brand, model, price, fuelType, description } = req.body;
  if (!brand || !model || !price || !fuelType || !description) {
    return res.status(400).json({ error: 'Brand, model, price, fuel type, and description are required.' });
  }

  try {
    const currentCars = loadCars();
    const carIndex = currentCars.findIndex(car => String(car.id) === req.params.id);
    if (carIndex === -1) {
      return res.status(404).json({ error: 'Car not found.' });
    }

    const car = currentCars[carIndex];
    const highlights = Array.isArray(req.body.highlights)
      ? req.body.highlights
      : String(req.body.highlights || '')
          .split(',')
          .map(item => item.trim())
          .filter(Boolean);

    currentCars[carIndex] = {
      ...car,
      brand,
      model,
      price,
      fuelType: normalizeFuelType(fuelType),
      segment: req.body.segment || 'New',
      mileage: req.body.mileage || 'N/A',
      imageUrl: req.body.imageUrl || 'images/car-placeholder.svg',
      description,
      launchCategory: req.body.launchCategory || normalizeFuelType(fuelType),
      highlights
    };
    saveCars(currentCars);
    return res.json({ success: true, car: currentCars[carIndex] });
  } catch (error) {
    console.error('Failed to update car:', error);
    return res.status(500).json({ error: 'Unable to update car at this time.' });
  }
});

app.delete('/api/cars/:id', requireAdmin, (req, res) => {
  try {
    const currentCars = loadCars();
    const remainingCars = currentCars.filter(car => String(car.id) !== req.params.id);
    if (remainingCars.length === currentCars.length) {
      return res.status(404).json({ error: 'Car not found.' });
    }

    saveCars(remainingCars);
    return res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete car:', error);
    return res.status(500).json({ error: 'Unable to delete car at this time.' });
  }
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const newContact = {
    id: Date.now(),
    name,
    email,
    message,
    submittedAt: new Date().toISOString()
  };

  try {
    const currentData = fs.existsSync(contactsFile)
      ? JSON.parse(fs.readFileSync(contactsFile, 'utf8'))
      : [];

    currentData.push(newContact);
    fs.writeFileSync(contactsFile, JSON.stringify(currentData, null, 2), 'utf8');

    res.status(201).json({ success: true, contact: newContact });
  } catch (error) {
    console.error('Failed to save contact:', error);
    res.status(500).json({ error: 'Unable to save contact at this time.' });
  }
});

app.get('/api/ratings', (req, res) => {
  try {
    const ratings = fs.existsSync(ratingsFile)
      ? JSON.parse(fs.readFileSync(ratingsFile, 'utf8'))
      : [];
    res.json(ratings);
  } catch (error) {
    console.error('Failed to load ratings:', error);
    res.status(500).json({ error: 'Unable to load ratings.' });
  }
});

app.post('/api/ratings', (req, res) => {
  const { carId, score, comment } = req.body;
  if (!carId || !score) {
    return res.status(400).json({ error: 'Car ID and rating are required.' });
  }

  const newRating = {
    id: Date.now(),
    carId: Number(carId),
    score: Number(score),
    comment: comment || '',
    createdAt: new Date().toISOString()
  };

  try {
    const currentRatings = fs.existsSync(ratingsFile)
      ? JSON.parse(fs.readFileSync(ratingsFile, 'utf8'))
      : [];

    currentRatings.push(newRating);
    fs.writeFileSync(ratingsFile, JSON.stringify(currentRatings, null, 2), 'utf8');

    res.status(201).json({ success: true, rating: newRating });
  } catch (error) {
    console.error('Failed to save rating:', error);
    res.status(500).json({ error: 'Unable to save rating.' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function startServer(portToTry) {
  const server = app.listen(portToTry, () => {
    console.log(`Car buy website backend running at http://localhost:${portToTry}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${portToTry} is busy. Trying ${portToTry + 1}...`);
      startServer(portToTry + 1);
      return;
    }

    throw error;
  });
}

startServer(defaultPort);
