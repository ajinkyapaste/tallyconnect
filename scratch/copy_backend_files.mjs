import fs from 'fs';
import path from 'path';

const srcBase = 'd:/Prototype/Tallyconnect_flutter-main (1)/Tallyconnect_flutter-main/backend_patches';
const dstBase = 'd:/Prototype/tally-backend';

const files = [
  ['reminders/routes/reminders.js', 'routes/reminders.js'],
  ['reminders/utils/reminderCore.js', 'utils/reminderCore.js'],
  ['reminders/utils/reminderRouter.js', 'utils/reminderRouter.js'],
  ['reminders/utils/sendReminderEmail.js', 'utils/sendReminderEmail.js'],
  ['assistant/routes/assistant.js', 'routes/assistant.js'],
  ['assistant/utils/assistantCore.js', 'utils/assistantCore.js'],
  ['assistant/utils/assistantRouter.js', 'utils/assistantRouter.js'],
  ['assistant/utils/assistantTools.js', 'utils/assistantTools.js'],
  ['assistant/utils/aiProviders.js', 'utils/aiProviders.js'],
  ['assistant/utils/aiUsage.js', 'utils/aiUsage.js'],
  ['assistant/utils/geminiClient.js', 'utils/geminiClient.js'],
  ['financial/routes/financial.js', 'routes/financial.js'],
  ['financial/utils/financialCore.js', 'utils/financialCore.js'],
  ['financial/utils/financialData.js', 'utils/financialData.js'],
  ['financial/utils/financialRouter.js', 'utils/financialRouter.js'],
  ['financial/utils/cashFlowColumns.js', 'utils/cashFlowColumns.js'],
  ['feedback/utils/feedbackRouter.js', 'utils/feedbackRouter.js'],
  ['feedback/utils/sendFeedbackEmail.js', 'utils/sendFeedbackEmail.js']
];

for (const [s, d] of files) {
  const src = path.join(srcBase, s);
  const dst = path.join(dstBase, d);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log(`Copied ${s} -> ${d}`);
}
console.log('All files copied successfully.');
