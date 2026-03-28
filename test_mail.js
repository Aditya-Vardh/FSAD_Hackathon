const { sendEmail } = require('./server/utils/mailer');
require('dotenv').config({ path: './server/.env' });

async function test() {
  console.log('Sending test email to 2420030406@klh.edu.in...');
  try {
    const info = await sendEmail({
      to: '2420030406@klh.edu.in',
      subject: 'Test Email from Peer Review System',
      text: 'This is a test to see if emails reach the klh.edu.in domain.'
    });
    console.log('Result:', info);
  } catch (err) {
    console.error('Test Failed:', err);
  }
}

test();
