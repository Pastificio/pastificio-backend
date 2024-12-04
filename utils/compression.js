import { createGzip, createGunzip } from 'zlib';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import logger from '../config/logger.js';

export const compressFile = async (inputPath, outputPath = `${inputPath}.gz`) => {
  try {
    const gzip = createGzip();
    const source = createReadStream(inputPath);
    const destination = createWriteStream(outputPath);

    await pipeline(source, gzip, destination);
    logger.info(`File compresso: ${outputPath}`);
    return outputPath;
  } catch (error) {
    logger.error('Errore nella compressione:', error);
    throw new Error(`Errore nella compressione: ${error.message}`);
  }
};

export const decompressFile = async (inputPath, outputPath) => {
  try {
    const gunzip = createGunzip();
    const source = createReadStream(inputPath);
    const destination = createWriteStream(outputPath);

    await pipeline(source, gunzip, destination);
    logger.info(`File decompresso: ${outputPath}`);
    return outputPath;
  } catch (error) {
    logger.error('Errore nella decompressione:', error);
    throw new Error(`Errore nella decompressione: ${error.message}`);
  }
};