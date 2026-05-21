require('dotenv').config();
const pool = require('./config/db');

const runReminder = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  console.log('Checking events for tomorrow:', tomorrowStr);

  const events = await pool.query(
    `SELECT * FROM app_events WHERE event_date::date = $1 AND status != 'Cancelled'`,
    [tomorrowStr]
  );

  console.log('Events found:', events.rows.length);

  for (const event of events.rows) {
    const participants = await pool.query(
      `SELECT user_id FROM app_registrations WHERE event_id = $1 AND status = 'Registered'`,
      [event.id]
    );

    console.log(`Event: "${event.title}" — ${participants.rows.length} participants`);

    if (participants.rows.length === 0) {
      console.log('No participants — skipping');
      continue;
    }

    const title = `⏰ Reminder: ${event.title} is Tomorrow!`;
    const message = `Don't forget! "${event.title}" is happening tomorrow at ${event.event_time?.slice(0,5) || 'TBA'}${event.venue ? ` at ${event.venue}` : ''}. See you there! 🎉`;

    for (const p of participants.rows) {
      await pool.query(
        `INSERT INTO app_notifications (user_id, title, message, type, event_id)
         VALUES ($1, $2, $3, 'reminder', $4)`,
        [p.user_id, title, message, event.id]
      );
    }

    console.log(`✅ Sent reminder to ${participants.rows.length} participants`);
  }

  // Verify notifications created
  const notifs = await pool.query(
    'SELECT * FROM app_notifications ORDER BY created_at DESC LIMIT 5'
  );
  console.log('\nNotifications in DB now:', notifs.rows.length);
  notifs.rows.forEach(n => console.log(' -', n.title, '| user:', n.user_id));

  process.exit();
};

runReminder().catch(console.error);