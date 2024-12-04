const { body, param, query } = require('express-validator');

exports.validateOrdineInput = [
  body('prodotti').isArray().notEmpty().withMessage('I prodotti sono obbligatori'),
  body('prodotti.*.quantita').isFloat({ min: 0.1 }).withMessage('Quantità non valida'),
  body('prodotti.*.prezzo').isFloat({ min: 0 }).withMessage('Prezzo non valido'),
  body('prodotti.*.unita').isIn(['Kg', 'unità']).withMessage('Unità non valida'),
  body('dataRitiro').isDate().withMessage('Data ritiro non valida'),
  body('oraRitiro').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Ora ritiro non valida'),
  body('nomeCliente').trim().notEmpty().withMessage('Nome cliente obbligatorio'),
  body('telefono').optional().isMobilePhone('it-IT').withMessage('Numero di telefono non valido'),
];

exports.validateQueryParams = [
  query('page').optional().isInt({ min: 1 }).withMessage('Pagina non valida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite non valido'),
  query('sort').optional().isIn(['dataRitiro', 'oraRitiro', 'nomeCliente']).withMessage('Campo di ordinamento non valido'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Ordine non valido'),
  query('search').optional().trim().isLength({ min: 3 }).withMessage('Termine di ricerca troppo corto'),
];