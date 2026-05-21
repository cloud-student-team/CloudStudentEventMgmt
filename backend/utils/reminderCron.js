const cron = require('node-cron');
const pool = require('../config/db');

// Runs every day at 8:00 AM
// Sends reminder notifications to students registered for tomorrow's events

const startReminderCron = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily event reminder cron job...');

    try {
      // Find all events happening tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const events = await pool.query(
        `SELECT e.id, e.title, e.event_date, e.event_time, e.venue
         FROM app_events e
         WHERE e.event_date = $1
         AND e.status != 'Cancelled'`,
        [tomorrowStr]
      );

      if (events.rows.length === 0) {
        console.log('No events tomorrow — no reminders needed.');
        return;
      }

      console.log(`Found ${events.rows.length} event(s) tomorrow. Sending reminders...`);

      for (const event of events.rows) {
        // Get all registered students for this event
        const participants = await pool.query(
          `SELECT r.user_id 
           FROM app_registrations r
           WHERE r.event_id = $1 
           AND r.status = 'Registered'`,
          [event.id]
        );

        if (participants.rows.length === 0) continue;

        const timeFormatted = event.event_time
          ? event.event_time.slice(0, 5)
          : 'TBA';

        const title = `⏰ Reminder: ${event.title} is Tomorrow!`;
        const message = `Don't forget! "${event.title}" is happening tomorrow at ${timeFormatted}${event.venue ? ` at ${event.venue}` : ''}. See you there! 🎉`;

        // Check if reminder already sent today to avoid duplicates
        const alreadySent = await pool.query(
          `SELECT id FROM app_notifications 
           WHERE event_id = $1 
           AND type = 'reminder'
           AND created_at::date = CURRENT_DATE
           LIMIT 1`,
          [event.id]
        );

        if (alreadySent.rows.length > 0) {
          console.log(`Reminder already sent for event: ${event.title}`);
          continue;
        }

        // Create notification for each participant
        const insertPromises = participants.rows.map((p) =>
          pool.query(
            `INSERT INTO app_notifications (user_id, title, message, type, event_id)
             VALUES ($1, $2, $3, 'reminder', $4)`,
            [p.user_id, title, message, event.id]
          )
        );

        await Promise.all(insertPromises);
        console.log(`✅ Sent reminder for "${event.title}" to ${participants.rows.length} students`);
      }

      console.log('✅ Daily reminder cron job completed.');
    } catch (error) {
      console.error('❌ Cron job error:', error.message);
    }
  });

  console.log('⏰ Daily reminder cron job scheduled (runs at 8:00 AM daily)');
};

module.exports = { startReminderCron };
