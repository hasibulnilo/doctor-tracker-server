import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const port = Number(process.env.PORT || 5001);

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(port, () => {
      console.log(`Doctor Tracker API running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
