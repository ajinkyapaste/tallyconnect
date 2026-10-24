const http = require('http');
const fs = require('fs');

http.get('http://127.0.0.1:9229/json', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const list = JSON.parse(d);
    const wsUrl = list[0].webSocketDebuggerUrl;
    console.log('Connecting to:', wsUrl);

    // Use ws or custom minimal websocket client
    const WebSocket = require('d:/Prototype/tally-frontend/node_modules/ws');
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log('WS connected!');
      // Take heap snapshot
      const stream = fs.createWriteStream('d:/Prototype/vite_heap.heapsnapshot');
      let chunkCount = 0;
      let totalBytes = 0;

      ws.on('message', (msg) => {
        const parsed = JSON.parse(msg.toString());
        if (parsed.method === 'HeapProfiler.addHeapSnapshotChunk') {
          stream.write(parsed.params.chunk);
          chunkCount++;
          totalBytes += parsed.params.chunk.length;
        } else if (parsed.id === 1) {
          console.log('Heap snapshot command acknowledged');
        }
      });

      ws.send(JSON.stringify({ id: 1, method: 'HeapProfiler.takeHeapSnapshot', params: { reportProgress: false } }));

      // Wait for snapshot completion
      setTimeout(() => {
        stream.end(() => {
          console.log('Saved heap snapshot! Chunks:', chunkCount, 'Bytes:', totalBytes);
          ws.close();
          process.exit(0);
        });
      }, 8000);
    });

    ws.on('error', e => console.error('WS Error:', e));
  });
});
