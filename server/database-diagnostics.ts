
import { pool } from './db';

export async function checkDatabaseHealth() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    connectionPool: {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    },
    tests: []
  };

  try {
    // Test basic connection
    const client = await pool.connect();
    diagnostics.tests.push({ test: 'basic_connection', status: 'pass' });
    
    try {
      // Test simple query
      const result = await client.query('SELECT NOW() as current_time');
      diagnostics.tests.push({ 
        test: 'simple_query', 
        status: 'pass',
        result: result.rows[0]
      });

      // Test tables exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      diagnostics.tests.push({ 
        test: 'tables_check', 
        status: 'pass',
        tableCount: tablesResult.rows.length,
        tables: tablesResult.rows.map(row => row.table_name)
      });

      // Test users table specifically
      const usersResult = await client.query('SELECT COUNT(*) as user_count FROM users');
      diagnostics.tests.push({ 
        test: 'users_table', 
        status: 'pass',
        userCount: parseInt(usersResult.rows[0].user_count)
      });

    } catch (queryError) {
      diagnostics.tests.push({ 
        test: 'query_execution', 
        status: 'fail',
        error: queryError.message
      });
    } finally {
      client.release();
    }

  } catch (connectionError) {
    diagnostics.tests.push({ 
      test: 'basic_connection', 
      status: 'fail',
      error: connectionError.message
    });
  }

  return diagnostics;
}

export async function checkDatabaseConnections() {
  try {
    const result = await pool.query(`
      SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        state,
        query_start,
        state_change,
        query
      FROM pg_stat_activity 
      WHERE datname = current_database()
      ORDER BY query_start DESC
    `);
    
    return {
      activeConnections: result.rows.length,
      connections: result.rows
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}
