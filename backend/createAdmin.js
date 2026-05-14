const bcrypt = require('bcrypt');
const { User } = require('./models');

async function createAdmin() {
  try {
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin user created successfully! Username: admin, Password: admin123');
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

createAdmin();
