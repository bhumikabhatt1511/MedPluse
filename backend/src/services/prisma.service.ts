import { db } from '../prisma/db.js';

export { db };

export async function checkDatabaseConnection(): Promise<{ isConnected: boolean; error?: string }> {
  try {
    // Perform quick probe
    await db.orm.public.PHC.where({}).first();
    return { isConnected: true };
  } catch (err: any) {
    return { isConnected: false, error: err?.message || 'Database unreachable' };
  }
}
