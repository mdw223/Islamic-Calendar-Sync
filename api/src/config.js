// abstracts the env file to be able to change the values

export const appConfig = {
  PORT: process.env.API_PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  TRUST_PROXY: true
};

export const dbConfig = {
  HOST: process.env.DB_HOST || 'localhost',
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || '',
  DATABASE: process.env.DB_DATABASE || 'ics_development',
  PORT: process.env.DB_PORT || 5432
}

export const emailConfig = {
  
}