import json
with open('all_chunks.json', 'r', encoding='utf-8') as f:
    chunks = json.load(f)

with open(r'd:\Prototype\tally-frontend\src\App.jsx', 'r', encoding='utf-8') as f:
    app_jsx = f.read()

reverted_count = 0
for chunk in chunks:
    if chunk['step'] > 300:
        new_text = chunk['target'] # Wait, this is reverting the revert!
        old_text = chunk['replacement']
        
        if new_text in app_jsx:
            app_jsx = app_jsx.replace(new_text, old_text)
            reverted_count += 1
            print('Re-applied chunk from step %s' % chunk['step'])
        else:
            print('Could not find text from step %s in App.jsx' % chunk['step'])

if reverted_count > 0:
    with open(r'd:\Prototype\tally-frontend\src\App.jsx', 'w', encoding='utf-8') as f:
        f.write(app_jsx)
    print('Successfully re-applied %s chunks.' % reverted_count)
else:
    print('No chunks were re-applied.')
