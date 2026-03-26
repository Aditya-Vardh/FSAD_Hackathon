const bcrypt = require('bcryptjs');

bcrypt.hash('password123', 10, (err, hash) => {
  if (err) throw err;
  console.log('INSERT INTO users (name, email, password_hash, role) VALUES (\'Aditya\', \'adityamarisa167@gmail.com\', \'' + hash + '\', \'admin\');');
});