// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './20251222152612_past_mandrill/migration.sql';
import m0001 from './20260521105146_curious_callisto/migration.sql';

  export default {
    migrations: {
      "20251222152612_past_mandrill": m0000,
      "20260521105146_curious_callisto": m0001
    }
  }