// tests/validation/data.validation.test.js
import { Ordine } from '../../models/ordine.js';
import { validateOrdine } from '../../utils/validators.js';

describe('Test Validazione Dati', () => {
  test('validazione email cliente', async () => {
    const ordineConEmailInvalida = {
      nomeCliente: 'Test',
      telefono: '1234567890',
      email: 'email_non_valida',
      dataRitiro: new Date(),
      oraRitiro: '10:00',
      prodotti: [{
        categoria: 'pasta',
        prodotto: 'Test',
        quantita: 1,
        unitaMisura: 'kg',
        prezzo: 10
      }]
    };

    const { isValid, errors } = await validateOrdine(ordineConEmailInvalida);
    expect(isValid).toBe(false);
    expect(errors.email).toBeDefined();
  });

  test('validazione dati sanitizzati', async () => {
    const ordineConXSS = {
      nomeCliente: '<script>alert("xss")</script>Test',
      telefono: '1234567890',
      dataRitiro: new Date(),
      oraRitiro: '10:00',
      prodotti: [{
        categoria: 'pasta',
        prodotto: 'Test',
        quantita: 1,
        unitaMisura: 'kg',
        prezzo: 10
      }]
    };

    const ordine = await Ordine.create(ordineConXSS);
    expect(ordine.nomeCliente).not.toContain('<script>');
  });

  test('validazione date future', async () => {
    const dataPassata = new Date();
    dataPassata.setDate(dataPassata.getDate() - 1);

    const ordineDataPassata = {
      nomeCliente: 'Test',
      telefono: '1234567890',
      dataRitiro: dataPassata,
      oraRitiro: '10:00',
      prodotti: [{
        categoria: 'pasta',
        prodotto: 'Test',
        quantita: 1,
        unitaMisura: 'kg',
        prezzo: 10
      }]
    };

    const { isValid, errors } = await validateOrdine(ordineDataPassata);
    expect(isValid).toBe(false);
    expect(errors.dataRitiro).toBeDefined();
  });
});