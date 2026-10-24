const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'CreateVoucherWizard.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

const targetBlock = `                    {/* Items List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {items.map((it, idx) => {`;

const replacementBlock = `                    {/* Items List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {items.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '32px 20px',
                          background: 'rgba(255, 255, 255, 0.7)',
                          borderRadius: '16px',
                          border: '1px dashed rgba(0, 0, 0, 0.15)'
                        }}>
                          <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
                            No items added yet. Click "+ Add Item" above or select a preset below.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleAddItem()}
                            className="btn-primary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              borderRadius: '10px',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            <Plus size={14} /> Add First Item
                          </button>
                        </div>
                      ) : (
                        items.map((it, idx) => {`;

if (content.includes(targetBlock)) {
  content = content.replace(targetBlock, replacementBlock);
  // Also close the conditional after items.map ends
  content = content.replace(
    `                        );
                      })}
                    </div>`,
    `                        );
                      }))}
                    </div>`
  );
  // Also change items.length > 1 to true
  content = content.replace(`{items.length > 1 && (`, `{true && (`);
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('Successfully added empty state for items in CreateVoucherWizard.jsx');
} else {
  console.error('Target block not found');
}
