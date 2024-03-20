const bcrypt = require('bcrypt');
const knex = require('knex')(require('./knexfile'));

async function seedUsers() {
    try {
        const hashedPassword = await bcrypt.hash('welcome', 10);
        const users = [
            { name: 'zohurul', email: 'zohurul@gmail.com', password: hashedPassword }
        ];
        await knex('users').insert(users);
        console.log('User seeder completed successfully.');
    } catch (error) {
        console.error('Error seeding users:', error);
    } finally {
        knex.destroy();
    }
}

seedUsers();
