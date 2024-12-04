import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
let token = '';

async function test() {
  try {
    // Test login
    console.log('\n1. Test login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'Admin123!'
    });
    
    console.log('Login response:', loginResponse.data);
    token = loginResponse.data.token;

    // Breve pausa per assicurarsi che il token sia stato processato
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test creazione ordine
    console.log('\n2. Test creazione ordine...');
    console.log('Usando token:', token);
    
    const ordineData = {
      nomeCliente: "Cliente Test",
      telefono: "1234567890",
      dataRitiro: new Date().toISOString().split('T')[0],
      oraRitiro: "10:00",
      prodotti: [
        {
          prodotto: "Pardulas",
          quantita: 1,
          prezzo: 18,
          unita: "Kg"
        }
      ],
      daViaggio: false,
      note: "Ordine di test"
    };

    console.log('Dati ordine:', ordineData);

    const ordineResponse = await axios({
      method: 'post',
      url: `${API_URL}/ordini`,
      data: ordineData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Creazione ordine response:', ordineResponse.data);

    // Test get ordini
    console.log('\n3. Test get ordini...');
    const ordiniResponse = await axios.get(`${API_URL}/ordini`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Get ordini response:', ordiniResponse.data);

  } catch (error) {
    console.error('Test fallito:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.config?.headers,
      error: error.message
    });
  }
}

test();