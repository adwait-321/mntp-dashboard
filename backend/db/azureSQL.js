import sql from 'mssql'

let pool = null

export async function getPool() {
  if (pool) return pool

  const config = {
    server:   process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    user:     process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    port:     parseInt(process.env.AZURE_SQL_PORT) || 1433,

    requestTimeout:    120000,  // 2 min — needed for heavy queries on 27M rows
    connectionTimeout:  30000,

    options: {
      encrypt:                true,
      trustServerCertificate: false,
      enableArithAbort:       true,
    },

    pool: {
      max:               20,   // up from 10 — filters runs 5 parallel queries
      min:               2,    // keep 2 warm connections
      idleTimeoutMillis: 30000,
    },
  }

  pool = await sql.connect(config)
  console.log('Azure SQL connected')
  return pool
}

export { sql }