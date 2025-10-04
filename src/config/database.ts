import mongoose from 'mongoose';
import winston from 'winston';
import { configDotenv } from 'dotenv';


configDotenv()

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export const connectDB = async (): Promise<void> => {
  try {
    const options: mongoose.ConnectOptions = { replicaSet: 'rs0'}
    if (process.env.NODE_ENV == 'development') {
      await mongoose.connect(process.env.DEV_URI as string,  )
    }
    else {
      await mongoose.connect(process.env.MONGODB_URI as string, );
    }
    logger.info(`MongoDB Connected using ${process.env.NODE_ENV}`);
  } catch (error) {
    logger.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};