// tests/security/auth.security.test.js
import request from 'supertest';
import { app } from '../../server.js';
import { generateToken, hashPassword } from '../../utils/auth.js';
import { User } from '../../models/User.js';

describe('Test Sicurezza Autenticazione', () => {
 beforeEach(async () => {
   await User.deleteMany({});
 });

 test('tentativo di accesso con credenziali errate', async () => {
   const response = await request(app)
     .post('/api/auth/login')
     .send({
       username: 'admin',
       password: 'password_sbagliata'
     });

   expect(response.status).toBe(401);
   expect(response.body.success).toBe(false);
 });

 test('bruteforce protection', async () => {
   const maxTentativi = 5;
   const requests = Array(maxTentativi + 1).fill().map(() => 
     request(app)
       .post('/api/auth/login')
       .send({
         username: 'admin',
         password: 'password_sbagliata'
       })
   );

   const responses = await Promise.all(requests);
   const ultimaRisposta = responses[responses.length - 1];

   expect(ultimaRisposta.status).toBe(429);
   expect(ultimaRisposta.body.error).toContain('troppi tentativi');
 });

 test('token JWT scaduto', async () => {
   const tokenScaduto = generateToken({ id: 'test' }, '0s');

   const response = await request(app)
     .get('/api/ordini')
     .set('Authorization', `Bearer ${tokenScaduto}`);

   expect(response.status).toBe(401);
   expect(response.body.error).toContain('token scaduto');
 });
});