import { Server } from "http";
import app from "./app";
import { envVars } from "./app/config/env";
import { seedAdmin } from "./app/utils/seed";
let server: Server;
const main = async () => {
     try {
        await seedAdmin()
          server = app.listen(envVars.PORT, () => {
               console.log(
                    `Server is running on http://localhost:${envVars.PORT}`,
               );
          });
     } catch (error) {
          console.error("Failed to start server:", error);
     }
};

main();
