import dotenv from 'dotenv';
import neo4j, { Driver } from 'neo4j-driver';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
dotenv.config({path: resolve(sourceDirectory, '../../../.env')});

const uri = process.env.COGNODB_URI;
const username = process.env.COGNODB_USERNAME;
const password = process.env.COGNODB_PASSWORD;

export const hasDatabaseConfig = Boolean(uri && username && password);
export const driver: Driver | null = hasDatabaseConfig
  ? neo4j.driver(uri!, neo4j.auth.basic(username!, password!))
  : null;

export async function executeRead<T>(activeDriver: Driver | null, cypher: string, params: Record<string, unknown> = {}): Promise<T[]> {
  if (!activeDriver) throw new Error('CognoDB is not configured. Add valid COGNODB_URI, COGNODB_USERNAME, and COGNODB_PASSWORD values to .env.');
  const session = activeDriver.session({defaultAccessMode: neo4j.session.READ});
  try {
    const result = await session.executeRead((tx) => tx.run(cypher, params));
    return result.records.map((record) => record.toObject() as T);
  } finally {
    await session.close();
  }
}

export async function executeWrite<T = Record<string, unknown>>(activeDriver: Driver | null, cypher: string, params: Record<string, unknown> = {}): Promise<T[]> {
  if (!activeDriver) throw new Error('CognoDB is not configured.');
  const session = activeDriver.session({defaultAccessMode: neo4j.session.WRITE});
  try {
    const result = await session.executeWrite((tx) => tx.run(cypher, params));
    return result.records.map((record) => record.toObject() as T);
  } finally {
    await session.close();
  }
}

export const read = <T>(cypher: string, params: Record<string, unknown> = {}) => executeRead<T>(driver, cypher, params);
export const write = <T = Record<string, unknown>>(cypher: string, params: Record<string, unknown> = {}) => executeWrite<T>(driver, cypher, params);
