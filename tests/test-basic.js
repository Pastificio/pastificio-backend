// tests/test-basic.js
import axios from 'axios';

const baseURL = 'http://localhost:5000/api';
let authToken = '';

const runTests = async () => {
    console.log('=== Test Suite Completa ===\n');

    try {
        // Test 1: Login
        console.log('1. Test Autenticazione');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            username: 'admin',
            password: 'password123'
        });
        
        if (loginResponse.data.success) {
            authToken = loginResponse.data.token;
            console.log('✓ Login effettuato');
            console.log(`- Username: ${loginResponse.data.user.username}`);
            console.log(`- Ruolo: ${loginResponse.data.user.ruolo}`);
        }

        // Test 2: Creazione Ordine
        console.log('\n2. Test Creazione Ordine');
        const nuovoOrdine = {
            nomeCliente: 'Cliente Test',
            telefono: '1234567890',
            dataRitiro: new Date().toISOString().split('T')[0],
            oraRitiro: '15:00',
            prodotti: [
                {
                    nome: 'Pasta Fresca',
                    categoria: 'Pasta',
                    quantita: 2,
                    prezzo: 10,
                    unitaMisura: 'KG'
                }
            ],
            totale: 20
        };

        const ordineResponse = await axios.post(`${baseURL}/ordini`, nuovoOrdine, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (ordineResponse.data.success) {
            console.log('✓ Ordine creato con ID:', ordineResponse.data.data._id);
        }

        // Test 3: Get Ordini con Filtri
        console.log('\n3. Test Ricerca e Filtri');
        const ordiniResponse = await axios.get(`${baseURL}/ordini`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        console.log(`✓ Ricerca completata - Trovati: ${ordiniResponse.data.data.length} ordini`);
        
        // Test 4: Aggiornamento Ordine
        console.log('\n4. Test Aggiornamento Ordine');
        const ordineId = ordineResponse.data.data._id;
        const updateResponse = await axios.put(`${baseURL}/ordini/${ordineId}`, 
            { ...nuovoOrdine, nomeCliente: 'Cliente Test Modificato' },
            { headers: { 'Authorization': `Bearer ${authToken}` } }
        );
        
        if (updateResponse.data.success) {
            console.log('✓ Ordine aggiornato');
        }

        // Test 5: Statistiche
        console.log('\n5. Test Statistiche');
        const statsResponse = await axios.get(
            `${baseURL}/ordini/statistiche/${new Date().toISOString().split('T')[0]}`,
            { headers: { 'Authorization': `Bearer ${authToken}` } }
        );
        
        console.log('✓ Statistiche recuperate:', statsResponse.data.data);

        // Test 6: Get Ordine Singolo
        console.log('\n6. Test Get Ordine Singolo');
        const getOrdineResponse = await axios.get(
            `${baseURL}/ordini/${ordineId}`,
            { headers: { 'Authorization': `Bearer ${authToken}` } }
        );
        
        if (getOrdineResponse.data.success) {
            console.log('✓ Dettagli ordine recuperati');
            console.log(`  - Totale ordine: ${getOrdineResponse.data.data.totale}`);
            console.log(`  - Numero prodotti: ${getOrdineResponse.data.data.numeroProdotti}`);
            console.log(`  - Data ritiro formattata: ${getOrdineResponse.data.data.dataRitiroFormatted}`);
        }

        console.log('\n=== Test completati con successo ===');

    } catch (error) {
        console.error('\n❌ Test fallito:', {
            endpoint: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            error: error.response?.data?.error || error.message
        });
    }
};

console.log('Assicurati che il server sia in esecuzione su localhost:5000');
console.log('Avvio test tra 2 secondi...\n');

setTimeout(runTests, 2000);