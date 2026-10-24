import json
with open(r'C:\Users\User\.gemini\antigravity-ide\brain\6f78d27c-9dfa-42e8-89b0-e8d992093bad\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try: data = json.loads(line)
        except: continue
        
        if data.get('step_index', 0) > 187:
            break
            
        if 'tool_calls' in data:
            for call in data['tool_calls']:
                print("Step", data['step_index'], call['function']['name'])
