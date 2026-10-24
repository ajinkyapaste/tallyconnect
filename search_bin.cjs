const { execSync } = require('child_process');
const fs = require('fs');

const psScript = `
$shell = New-Object -ComObject Shell.Application
$recycleBin = $shell.Namespace(0x0a)
foreach ($item in $recycleBin.Items()) {
    if ($item.Name -like '*App*' -or $item.Name -like '*.bak*' -or $item.Name -like '*.jsx*' -or $item.Name -like '*tally*') {
        Write-Output ($item.Name + ' | ' + $item.Path + ' | ' + $recycleBin.GetDetailsOf($item, 1))
    }
}
`;
fs.writeFileSync('temp_check_bin.ps1', psScript, 'utf8');
try {
  const out = execSync('powershell -ExecutionPolicy Bypass -File temp_check_bin.ps1').toString();
  console.log('Recycle bin matches:');
  console.log(out || 'None');
} catch(e) {
  console.error(e.message);
} finally {
  try { fs.unlinkSync('temp_check_bin.ps1'); } catch(e){}
}
