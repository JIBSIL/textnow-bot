(async () => {
  const puppeteer = require('puppeteer');
  const textnow = require('textnow-bot');
  const commander = require('commander')
  commander
      .version('v0.0.1')
      .description('Send a TextNow message')
      .option('--username <type>', 'To input a username')
      .option('--password <type>', 'To input a password')
      .option('--sendto <type>', 'To input a recipient')
      .option('--message <type>', 'To input a message')
      .parse(process.argv)
  const fs = require('fs').promises;

  let browser = null;
  let page = null;


  try {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    const client = await page.target().createCDPSession();
    let cookies = null;

    // Import cookies from file
    try {
      console.debug('Importing existing cookies...');
      const cookiesJSON = await fs.readFile('./cookies.json');
      cookies = JSON.parse(cookiesJSON);
    }
    catch (error) {
      console.debug('Failed to import existing cookies.');
    }

    // Log into TextNow and get cookies
    try {
      console.debug('Logging in with existing cookies...');
      await page.setCookie(...cookies);
      cookies = await textnow.logIn(page, client);
    }
    catch (error) {
      console.debug('Failed to log in with existing cookies.');
      console.debug('Logging in with account credentials...');
      cookies = await textnow.logIn(page, client, commander.username, commander.password);
    }

    // Save cookies to file
    console.debug('Successfully logged into TextNow!');
    await fs.writeFile('./cookies.json', JSON.stringify(cookies));

    // Select a conversation using recipient info
    console.debug('Selecting conversation...');
    await textnow.selectConversation(page, commander.sendto);

    // Send a message to the current recipient
    console.debug('Sending message...');
    await textnow.sendMessage(page, commander.message);

    console.debug('Message sent!');
    await browser.close();
  }
  catch (error) {
    console.error(error);

    if (page) {
      await page.screenshot({ path: './error-screenshot.jpg', type: 'jpeg' });
    }

    if (browser) {
      await browser.close();
    }

    process.exit(1);
  }
})();
