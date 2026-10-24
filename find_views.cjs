const fs = require('fs');
const readline = require('readline');

async function findAppViews(convId) {
  const fileStream = fs.createReadStream('C:/Users/User/.gemini/antigravity-ide/brain/' + convId + '/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line) continue;
    if (line.includes('Total Lines:') && line.includes('App.jsx')) {
      const match = line.match(/Showing lines (\d+) to (\d+)/);
      if (match) {
        const data = JSON.parse(line);
        console.log(convId, 'Step:', data.step_index, 'Lines:', match[1], 'to', match[2]);
      }
    }
  }
}

(async () => {
  await findAppViews('fb7ccd0c-527a-47c6-90f6-d1a922ef1db5');
  await findAppViews('bf40a3da-5687-43f6-bfae-4f621515d2e7');
})();
